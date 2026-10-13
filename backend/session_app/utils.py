"""Helpers for sessions: who may open one, what the players see, leveling, items and rolls."""

from collections import defaultdict, deque

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from battle_app.rules import check
from character_app.models import Npc
from session_app.models import Session
from world.world_app.models import Quest

KEPT_ROLLS = 30
# The bonus points a character gets for a closed chapter when the game master names no other number.
CHAPTER_BONUS = 10
# The latest rolls of every session. They live only in the memory of the server.
ROLLS = defaultdict(lambda: deque(maxlen=KEPT_ROLLS))


def sessions_for_game_master(user):
    """Return the sessions the given game master runs."""
    return Session.objects.filter(owner=user)


def sessions_for_player(user):
    """Return the sessions in which one of the user's characters plays."""
    return Session.objects.filter(characters__owner=user).distinct()


def session_for_game_master(user, session_id):
    """Return the user's own session with the given id or raise a 404."""
    return get_object_or_404(sessions_for_game_master(user), pk=session_id)


def session_for_member(user, session_id):
    """Return the session with the given id for its game master or one of its players, or raise a 404."""
    member = Q(owner=user) | Q(characters__owner=user)
    return get_object_or_404(Session.objects.filter(member).distinct(), pk=session_id)


def characters_in_other_sessions(characters, session=None):
    """Return the given characters that already play in another running session."""
    running = Session.objects.filter(finished=False).exclude(pk=getattr(session, "pk", None))
    return [character for character in characters if running.filter(characters=character).exists()]


@transaction.atomic
def close_chapter(session, bonus_points):
    """Give every character of the session its bonus points and move the session to the next chapter.

    The points are named per character id; a character that is not named gets the usual amount.
    """
    for character in session.characters.all():
        character.bonus_points_total += bonus_points.get(str(character.pk), CHAPTER_BONUS)
        character.save(update_fields=["bonus_points_total"])
    number = session.chapter.number if session.chapter else 0
    session.chapter = session.world.chapters.filter(number__gt=number).first() or session.chapter
    session.save(update_fields=["chapter"])


def give_item(character, item):
    """Put an item into the inventory of a character."""
    character.inventory = [*character.inventory, item]
    character.save(update_fields=["inventory"])


def roll_check(session, who, label, value):
    """Roll a check, remember it for the session and return it."""
    roll = {"who": who, "label": label, **check(value)}
    ROLLS[session.pk].appendleft(roll)
    return roll


def latest_rolls(session):
    """Return the latest rolls of a session, newest first."""
    return list(ROLLS[session.pk])


def known_pieces(entry, state):
    """Return the pieces of player knowledge the group knows about an entry."""
    return [piece for index, piece in enumerate(entry.player_knowledge) if index in state.known]


def shared_entry(kind, entry, state):
    """Return what players see of one revealed entry: name, description and what they found out."""
    return {
        "kind": kind, "id": entry.pk, "name": entry.name, "category": getattr(entry, "category", ""),
        "description": entry.description, "knowledge": known_pieces(entry, state),
    }


def giver_name(quest, changes):
    """Return the name of the giver of a quest as the session has it; empty when there is none."""
    giver = quest.giver
    if "giver" in changes:
        giver = Npc.objects.filter(world_link__world=quest.world_id, pk=changes["giver"]).first()
    return giver.name if giver else ""


def shared_quest(quest, state):
    """Return what players see of a quest shared with them: also goal, checklist and giver.

    What the session has different about the quest counts before what the world says.
    """
    changes = state.changes
    steps = [{"text": text, "done": index in state.steps} for index, text in enumerate(quest.checklist)]
    return {
        **shared_entry("quest", quest, state), "name": changes.get("name") or quest.name,
        "main": quest.kind == Quest.Kind.MAIN, "number": quest.number, "goal": changes.get("goal", quest.goal),
        "checklist": steps, "giver": giver_name(quest, changes), "done": state.done,
    }


def shared_entries(kind, entries, states):
    """Return the revealed entries of one kind as the players see them."""
    ids = [entry_id for entry_kind, entry_id in states if entry_kind == kind]
    return [shared_entry(kind, entry, states[kind, entry.pk]) for entry in entries.filter(pk__in=ids)]


def glossary_for_players(session, states):
    """Return the revealed places, characters, knowledge and events of a session's world."""
    world = session.world
    return (
        shared_entries("location", world.locations, states)
        + shared_entries("npc", Npc.objects.filter(world_link__world=world), states)
        + shared_entries("trivia", world.trivia, states)
        + shared_entries("event", world.events, states)
    )


def group_of(session):
    """Return the characters of a session as the whole group sees them: name, player and life points."""
    characters = session.characters.select_related("owner")
    return [
        {
            "id": character.pk, "name": character.name, "player": character.owner.username,
            "life_points": character.life_points, "max_life_points": character.max_life_points,
        }
        for character in characters
    ]


def player_view(session):
    """Return everything the players of a session may see."""
    states = {(state.kind, state.entry_id): state for state in session.entries.filter(revealed=True)}
    quests = session.world.quests.filter(pk__in=[pk for kind, pk in states if kind == "quest"]).select_related("giver")
    return {
        "id": session.pk, "name": session.name, "world": session.world.name, "date": session.date,
        "chapter": str(session.chapter) if session.chapter else "", "finished": session.finished,
        "group": group_of(session),
        "quests": [shared_quest(quest, states["quest", quest.pk]) for quest in quests],
        "glossary": glossary_for_players(session, states),
    }
