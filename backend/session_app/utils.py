"""Helpers for sessions: who may open one, what the players see, leveling, items, equipment and rolls."""

from collections import defaultdict, deque

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from battle_app.rules import FAILURE, check, roll_die
from character_app.models import Npc
from character_app.utils import use_inspiration
from session_app.models import Note, Session, SessionEntry
from world.world_app.models import Quest
from world.world_app.utils import in_scope, npcs_in_world

KEPT_ROLLS = 30
# The bonus points a character gets for a closed chapter when the game master names no other number.
# The latest rolls of every session. They live only in the memory of the server.
ROLLS = defaultdict(lambda: deque(maxlen=KEPT_ROLLS))


def _marked_entries(world):
    """Return for each kind of entry the ones of a world that are marked as visible from the start.

    What a session made up stays out: it belongs to that session alone.
    """
    kinds = SessionEntry.Kind
    return {
        kinds.LOCATION: in_scope(world.locations).filter(visible_from_start=True),
        kinds.QUEST: in_scope(world.quests).filter(visible_from_start=True),
        kinds.EVENT: in_scope(world.events).filter(visible_from_start=True),
        kinds.TRIVIA: in_scope(world.trivia).filter(visible_from_start=True),
        kinds.NPC: npcs_in_world(world).filter(visible_from_start=True),
    }


def reveal_from_start(session):
    """Show the players of a new session every entry of its world that is marked as visible from the start."""
    SessionEntry.objects.bulk_create(
        SessionEntry(session=session, kind=kind, entry_id=entry.pk, revealed=True, shown=["description"])
        for kind, entries in _marked_entries(session.world).items()
        for entry in entries
    )


def sessions_for_game_master(user):
    """Return the sessions the given game master runs."""
    return Session.objects.filter(owner=user)


def sessions_for_player(user):
    """Return the sessions in which one of the user's characters plays."""
    return Session.objects.filter(characters__owner=user).distinct()


def session_for_game_master(user, session_id):
    """Return the user's own session with the given id or raise a 404."""
    return get_object_or_404(sessions_for_game_master(user), pk=session_id)


@transaction.atomic
def delete_session(session):
    """Delete a session with everything made up in it; its NPCs would otherwise stay behind without a world."""
    Npc.objects.filter(world_link__session=session).delete()
    session.delete()


def session_for_member(user, session_id):
    """Return the session with the given id for its game master or one of its players, or raise a 404."""
    member = Q(owner=user) | Q(characters__owner=user)
    return get_object_or_404(Session.objects.filter(member).distinct(), pk=session_id)


def notes_for_user(user):
    """Return the notes the user may change: his own and the notepads of the groups he leads or plays in."""
    member = Q(session__owner=user) | Q(session__characters__owner=user)
    return Note.objects.filter(Q(author=user) | (Q(shared=True) & member)).distinct()


def characters_in_other_sessions(characters, session=None):
    """Return the given characters that already play in another running session; a finished one frees them."""
    others = Session.objects.filter(finished=False).exclude(pk=getattr(session, "pk", None))
    return [character for character in characters if others.filter(characters=character).exists()]


@transaction.atomic
def give_bonus_points(session, bonus_points):
    """Add the named bonus points to the named characters of the session; nobody else gets any.

    The points are named per character id. The chapter of the session stays as it is.
    """
    for character in session.characters.filter(pk__in=[int(pk) for pk in bonus_points]):
        character.bonus_points_total += bonus_points[str(character.pk)]
        character.save(update_fields=["bonus_points_total"])


def characters_of(session, ids):
    """Return the named characters of the session, or all of them when no id is named."""
    characters = session.characters.all()
    return characters.filter(pk__in=ids) if ids else characters


def notes_for_reader(session, user):
    """Return the own notes of the user and the notepad of the group, with their comments."""
    visible = Q(shared=True) | Q(author=user)
    return session.notes.filter(visible).select_related("author").prefetch_related("comments__author")


def messages_for_reader(session, user, is_game_master, character=None):
    """Return the secret messages the user may read: a player his own, the game master one thread or all."""
    messages = session.messages.all()
    if not is_game_master:
        return messages.filter(character__owner=user)
    return messages.filter(character_id=character) if character else messages


def chat_of(session):
    """Return the chat of the whole group of a session, oldest first."""
    return session.chat.select_related("author", "session")


def give_item(character, item):
    """Put an item into the inventory of a character."""
    character.inventory = [*character.inventory, item]
    character.save(update_fields=["inventory"])


def remember_roll(session, roll):
    """Put a roll in front of the latest rolls of the session and return it."""
    ROLLS[session.pk].appendleft(roll)
    return roll


def roll_check(session, who, label, value, secret=False, **extra):
    """Roll a check against a value, remember it for the session and return it; extra is kept with the roll."""
    return remember_roll(session, {"who": who, "label": label, "secret": secret, **extra, **check(value)})


def chat_name(session, user):
    """Return the name a user chats under in a session: "Spielleiter", or the name of the own character."""
    if session.owner_id == user.pk:
        return "Spielleiter"
    character = session.characters.filter(owner=user).first()
    return character.name if character else user.username


def inspire(session, character):
    """Roll the last check of a character again, paid with an inspiration point, and return the new roll.

    It works once for a failed check that was no fumble, and only for a check with a talent.
    """
    last = next((roll for roll in ROLLS[session.pk] if roll.get("character") == character.pk), None)
    if not last or last["result"] != FAILURE or last.get("inspired") or not last.get("talent"):
        raise ValidationError("Ein Geistesblitz geht nur direkt nach einer misslungenen Probe, einmal und nicht nach einem Patzer.")
    if not use_inspiration(character, last["talent"]):
        raise ValidationError("Du hast keinen Geistesblitzpunkt mehr in dieser Begabung.")
    label = f"{last['label']} · Geistesblitz"
    return roll_check(session, last["who"], label, last["value"], False, character=character.pk, talent=last["talent"], inspired=True)


def roll_dice(session, who, label, sides, count, secret=False):
    """Roll dice without a value, remember the roll for the session and return it."""
    dice = [roll_die(sides) for _ in range(count)]
    name = label or f"{count}W{sides}"
    return remember_roll(session, {"who": who, "label": name, "secret": secret, "dice": dice, "total": sum(dice)})


def latest_rolls(session, with_secret):
    """Return the latest rolls of a session, newest first; secret rolls are only for the game master."""
    return [roll for roll in ROLLS[session.pk] if with_secret or not roll["secret"]]


def session_text(entry, state, key):
    """Return a text of an entry as the session has it: changed for this session, or as the world wrote it.

    An empty name counts as no change, so an entry never loses its name.
    """
    value = state.changes.get(key)
    if not isinstance(value, str) or (key == "name" and not value):
        return getattr(entry, key, "")
    return value


def shown_text(entry, state, part):
    """Return a text of an entry as the session has it when it shows this part to the players, otherwise nothing."""
    return session_text(entry, state, part) if part in state.shown else ""


def known_pieces(entry, state):
    """Return the pieces of player knowledge the group knows about an entry."""
    return [piece for index, piece in enumerate(entry.player_knowledge) if index in state.known]


def shared_entry(kind, entry, state):
    """Return what players see of one revealed entry: its name, the parts shown to them and what they found out."""
    return {
        "kind": kind, "id": entry.pk, "name": session_text(entry, state, "name"), "category": entry.category,
        "symbol": entry.symbol, "description": shown_text(entry, state, "description"),
        "trigger": shown_text(entry, state, "trigger"), "happening": shown_text(entry, state, "happening"),
        "knowledge": known_pieces(entry, state),
    }


def shown_steps(quest, state):
    """Return the points of a quest's checklist the players see, each with its position and whether it is checked."""
    return [
        {"position": position, "text": text, "done": position in state.steps}
        for position, text in enumerate(quest.checklist) if f"step:{position}" in state.shown
    ]


def place_name(quest, state):
    """Return the name of the place a quest starts at as the session has it; empty when hidden or unknown."""
    place = quest.location
    if "location" in state.changes:
        place = in_scope(quest.world.locations, state.session_id).filter(pk=state.changes["location"]).first()
    return place.name if place and "location" in state.shown else ""


def giver_name(quest, state):
    """Return the name of the giver of a quest as the session has it; empty when there is none."""
    giver = quest.giver
    if "giver" in state.changes:
        giver = npcs_in_world(quest.world_id, state.session_id).filter(pk=state.changes["giver"]).first()
    return giver.name if giver else ""


def shared_quest(quest, state):
    """Return what players see of a quest shared with them: the parts and points shown to them, its state and its log.

    What the session has different about the quest counts before what the world says.
    """
    return {
        **shared_entry("quest", quest, state),
        "main": quest.kind == Quest.Kind.MAIN, "number": quest.number, "goal": shown_text(quest, state, "goal"),
        "giver": giver_name(quest, state) if "giver" in state.shown else "", "location": place_name(quest, state),
        "checklist": shown_steps(quest, state), "started": state.started, "done": state.done, "log": state.log,
    }


def shared_entries(kind, entries, states):
    """Return the revealed entries of one kind as the players see them."""
    ids = [entry_id for entry_kind, entry_id in states if entry_kind == kind]
    return [shared_entry(kind, entry, states[kind, entry.pk]) for entry in entries.filter(pk__in=ids)]


def glossary_for_players(session, states):
    """Return the revealed places, characters, knowledge and events of a session's world and of the session itself."""
    world = session.world
    return (
        shared_entries("location", in_scope(world.locations, session), states)
        + shared_entries("npc", npcs_in_world(world, session), states)
        + shared_entries("trivia", in_scope(world.trivia, session), states)
        + shared_entries("event", in_scope(world.events, session), states)
    )


def group_of(session):
    """Return the characters of a session as the whole group sees them: name, player, life and the second bar."""
    characters = session.characters.select_related("owner")
    return [
        {
            "id": character.pk, "name": character.name, "player": character.owner.username,
            "life_points": character.life_points, "max_life_points": character.max_life_points,
            "second_bar_points": character.second_bar_points, "max_second_bar_points": character.max_second_bar_points,
        }
        for character in characters
    ]


def equipment_of(session, user):
    """Return what the characters of a session carry, as the given user may see it.

    A hidden line is shown only to the owner of the character and to the game master.
    """
    sees_all = session.owner_id == user.pk
    lines = []
    for character in session.characters.all():
        for line in character.inventory:
            hidden = bool(line.get("hidden"))
            if sees_all or character.owner_id == user.pk or not hidden:
                lines.append({**line, "hidden": hidden, "owner": character.name})
    return lines


def player_view(session, user):
    """Return everything the given user may see of a session as one of its players.

    Entries of the world and those made up in this session count; what other sessions made up never does.
    """
    states = {(state.kind, state.entry_id): state for state in session.entries.filter(revealed=True)}
    shared = [pk for kind, pk in states if kind == "quest"]
    quests = in_scope(session.world.quests, session).filter(pk__in=shared).select_related("giver", "location", "world")
    return {
        "id": session.pk, "name": session.name, "world": session.world.name, "date": session.date,
        "chapter": str(session.chapter) if session.chapter else "", "finished": session.finished,
        "second_bar": session.world.second_bar_name,
        "group": group_of(session),
        "quests": [shared_quest(quest, states["quest", quest.pk]) for quest in quests],
        "glossary": glossary_for_players(session, states),
        "equipment": equipment_of(session, user),
    }
