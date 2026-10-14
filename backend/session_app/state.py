"""The whole state of a session in one answer, so a device asks one address instead of many."""

import hashlib

from rest_framework.renderers import JSONRenderer

from battle_app.utils import battle_for_players, current_battle
from character_app.api.serializers import PlayerCharacterLevelSerializer, PlayerCharacterSerializer
from session_app.api.serializers import ChatMessageSerializer, MessageSerializer, NoteSerializer, SessionEntrySerializer
from session_app.utils import chat_of, latest_rolls, messages_for_reader, notes_for_reader, player_view


def _talk(session, request, is_game_master):
    """Return the notes, the secret messages, the chat and the rolls the requesting user may read."""
    context = {"request": request}
    messages = messages_for_reader(session, request.user, is_game_master)
    return {
        "notes": NoteSerializer(notes_for_reader(session, request.user), many=True, context=context).data,
        "messages": MessageSerializer(messages, many=True, context=context).data,
        "chat": ChatMessageSerializer(chat_of(session), many=True, context=context).data,
        "rolls": latest_rolls(session, is_game_master),
    }


def _own_character(session, request):
    """Return the requesting player's own character in the session, as the player's pages show it."""
    own = session.characters.filter(owner=request.user).prefetch_related("sessions__world").first()
    return PlayerCharacterSerializer(own, context={"request": request}).data if own else None


def player_state(session, request):
    """Return everything the page of a player shows during a session."""
    battle = current_battle(session)
    return {
        "view": player_view(session, request.user),
        **_talk(session, request, False),
        "battle": battle_for_players(battle, request.user) if battle else None,
        "character": _own_character(session, request),
    }


def game_master_state(session, request):
    """Return everything the cockpit of the game master shows during a session."""
    context = {"request": request}
    characters = session.characters.select_related("owner").prefetch_related("sessions__world")
    return {
        "entries": SessionEntrySerializer(session.entries.all(), many=True, context=context).data,
        **_talk(session, request, True),
        "characters": PlayerCharacterLevelSerializer(characters, many=True, context=context).data,
    }


def state_tag(state):
    """Return a short fingerprint of a state; the same state always gets the same tag."""
    return hashlib.sha1(JSONRenderer().render(state)).hexdigest()
