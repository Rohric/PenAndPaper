"""Endpoints for sessions: the game master runs them, the players of a session take part."""

from functools import cached_property


from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from auth_app.api.permissions import IsGameMaster
from character_app.utils import refill_inspiration
from session_app.models import Note, SessionEntry
from session_app.state import game_master_state, player_state, state_tag
from session_app.utils import (
    characters_of,
    chat_of,
    delete_session,
    give_bonus_points,
    give_item,
    inspire,
    latest_rolls,
    messages_for_reader,
    notes_for_reader,
    notes_for_user,
    player_view,
    reveal_from_start,
    roll_check,
    roll_dice,
    session_for_game_master,
    session_for_member,
    sessions_for_game_master,
    sessions_for_player,
)

from .serializers import (
    ChatMessageSerializer,
    CommentSerializer,
    InspirationSerializer,
    ItemSerializer,
    LevelSerializer,
    MessageSerializer,
    NoteSerializer,
    QuestLogSerializer,
    RollSerializer,
    SessionEntrySerializer,
    SessionSerializer,
)

GAME_MASTER_ONLY = [IsAuthenticated, IsGameMaster]
NOT_IN_SESSION = "Dieser Charakter spielt nicht in dieser Runde."


class SessionMixin:
    """Find the session from the URL for its game master or one of its players."""

    @cached_property
    def session(self):
        """Return the session from the URL, or raise a 404 when the user takes no part in it."""
        return session_for_member(self.request.user, self.kwargs["session_id"])

    @cached_property
    def is_game_master(self):
        """Return True when the requesting user runs the session."""
        return self.session.owner_id == self.request.user.pk

    def own_character(self, character):
        """Return the character when it plays in the session and the user may act for it."""
        if not self.session.characters.filter(pk=character.pk).exists():
            raise PermissionDenied(NOT_IN_SESSION)
        if not self.is_game_master and character.owner_id != self.request.user.pk:
            raise PermissionDenied("Das ist nicht dein Charakter.")
        return character


class GameMasterSessionMixin:
    """Find the session from the URL for the game master who runs it."""

    permission_classes = GAME_MASTER_ONLY

    @cached_property
    def session(self):
        """Return the session from the URL, or raise a 404 when it is not the user's."""
        return session_for_game_master(self.request.user, self.kwargs["session_id"])


class SessionList(generics.ListCreateAPIView):
    """
    List and create sessions.

    - GET: the sessions the requesting game master runs.
    - POST: start a new session with a world and characters.
    """

    serializer_class = SessionSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only the sessions the requesting user runs."""
        return sessions_for_game_master(self.request.user)

    def perform_create(self, serializer):
        """Save the new session with the requesting user as game master."""
        reveal_from_start(serializer.save(owner=self.request.user))


class SessionDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one session of the requesting game master."""

    serializer_class = SessionSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only the sessions the requesting user runs."""
        return sessions_for_game_master(self.request.user)

    def perform_destroy(self, instance):
        """Delete the session together with everything made up in it."""
        delete_session(instance)


class MySessionList(generics.ListAPIView):
    """List the sessions in which one of the requesting player's characters plays."""

    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return the sessions of the user's characters."""
        return sessions_for_player(self.request.user)


class SessionEntryList(GameMasterSessionMixin, generics.ListAPIView):
    """List what the session did with the entries of its world."""

    serializer_class = SessionEntrySerializer

    def get_queryset(self):
        """Return the entry states of the session."""
        return self.session.entries.all()


class SessionEntryDetail(GameMasterSessionMixin, generics.UpdateAPIView):
    """Set the state of one entry in the session: done, revealed, pinned, steps, known pieces and changes.

    The entry is one of the world or one made up in this session.
    """

    serializer_class = SessionEntrySerializer

    def get_object(self):
        """Return the state of the entry from the URL; it is created on first use."""
        if self.kwargs["kind"] not in SessionEntry.Kind.values:
            raise Http404
        state, _ = self.session.entries.get_or_create(kind=self.kwargs["kind"], entry_id=self.kwargs["entry_id"])
        return state


class QuestLog(SessionMixin, generics.UpdateAPIView):
    """
    Let everybody in a session keep the log of a quest that is shared with the players.

    - PATCH: notes, tags, own points and their order ("log"), and the checked points ("steps").
    """

    serializer_class = QuestLogSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Return what the session knows about the quest, or raise a 404 when it is not shared."""
        return get_object_or_404(
            self.session.entries, kind=SessionEntry.Kind.QUEST, entry_id=self.kwargs["quest_id"], revealed=True
        )


class SessionLevel(GameMasterSessionMixin, APIView):
    """Give characters of a session bonus points to level with (LvUp); the chapter stays as it is."""

    def post(self, request, session_id):
        """Give the bonus points and return the session."""
        serializer = LevelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        give_bonus_points(self.session, serializer.validated_data["bonus_points"])
        return Response(SessionSerializer(self.session, context={"request": request}).data)


class SessionInspiration(GameMasterSessionMixin, APIView):
    """Give characters of the session all their inspiration points back: the named ones, or the whole group."""

    def post(self, request, session_id):
        """Refill the inspiration points and answer without content."""
        serializer = InspirationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        refill_inspiration(characters_of(self.session, serializer.validated_data["characters"]))
        return Response(status=status.HTTP_204_NO_CONTENT)


class SessionItems(GameMasterSessionMixin, APIView):
    """Hand an item to a character of the session; it lands in the character's inventory."""

    def post(self, request, session_id):
        """Put the item into the inventory and return it."""
        serializer = ItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = dict(serializer.validated_data)
        character = item.pop("character")
        if not self.session.characters.filter(pk=character.pk).exists():
            raise PermissionDenied(NOT_IN_SESSION)
        give_item(character, item)
        return Response(item, status=status.HTTP_201_CREATED)


class PlayerView(SessionMixin, APIView):
    """Return what the players of a session see; the game master can look at it too."""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Return group, shared quests, the glossary of the players and what the group carries."""
        return Response(player_view(self.session, request.user))


class SessionState(SessionMixin, APIView):
    """
    Return everything a device shows during a session, in one answer.

    - GET: the state for the game master or for a player, with its tag. With "?have=" set to the tag
      of the last answer, no content (204) when nothing has changed since.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Return the state with its tag, or no content when the caller has it already."""
        state = game_master_state(self.session, request) if self.is_game_master else player_state(self.session, request)
        tag = state_tag(state)
        if request.query_params.get("have") == tag:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"tag": tag, **state})


class NoteList(SessionMixin, generics.ListCreateAPIView):
    """
    List and create the notes of a session.

    - GET: the own notes and the notepad of the group.
    - POST: write a note; it is personal unless "shared" is set. The game master can lay his own note
      on his table ("table_group").
    """

    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return the user's own notes and the shared ones, with their comments."""
        return notes_for_reader(self.session, self.request.user)

    def get_serializer_context(self):
        """Pass the session, so the serializer knows whether the author runs it."""
        return {**super().get_serializer_context(), "session": self.session}

    def perform_create(self, serializer):
        """Save the note in the session with the requesting user as author."""
        serializer.save(session=self.session, author=self.request.user)


class NoteDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete one note.

    - GET, PATCH: an own note, or a note in the notepad of a group the user leads or plays in.
    - DELETE: only the author removes a note.
    """

    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return the user's own notes and the notepads of his groups."""
        return notes_for_user(self.request.user)

    def perform_destroy(self, instance):
        """Delete the note when the requesting user wrote it."""
        if instance.author_id != self.request.user.pk:
            raise PermissionDenied("Nur wer die Notiz geschrieben hat, kann sie löschen.")
        instance.delete()


class CommentList(generics.CreateAPIView):
    """Add a comment to a note in the notepad of the group."""

    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Save the comment when the note is shared and the user takes part in its session."""
        note = get_object_or_404(Note, pk=self.kwargs["note_id"], shared=True)
        session_for_member(self.request.user, note.session_id)
        serializer.save(note=note, author=self.request.user)


class MessageList(SessionMixin, generics.ListCreateAPIView):
    """
    List and write the secret messages between the game master and a character.

    - GET: the game master reads the thread of the character in "?character=", a player his own.
    - POST: the game master writes to a character, a player answers for his own character.
    """

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return the messages the requesting user may read."""
        character = self.request.query_params.get("character")
        return messages_for_reader(self.session, self.request.user, self.is_game_master, character)

    def perform_create(self, serializer):
        """Save the message for a character of the session and note who wrote it."""
        character = self.own_character(serializer.validated_data["character"])
        serializer.save(session=self.session, character=character, from_gm=self.is_game_master)


class ChatList(SessionMixin, generics.ListCreateAPIView):
    """
    Read and write the chat of the whole group of a session.

    - GET: all messages of the chat, oldest first.
    - POST: write a message as the game master or as a player of the session.
    """

    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return the messages of the chat of the session."""
        return chat_of(self.session)

    def perform_create(self, serializer):
        """Save the message with the requesting user as its author."""
        serializer.save(session=self.session, author=self.request.user)


class MessagesRead(SessionMixin, APIView):
    """Mark the messages the requesting user received in one thread as read."""

    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        """Mark the received messages of the character's thread as read."""
        received = self.session.messages.filter(character_id=request.data.get("character"), from_gm=not self.is_game_master)
        if not self.is_game_master:
            received = received.filter(character__owner=request.user)
        received.update(read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RollList(SessionMixin, APIView):
    """
    Roll in a session and read the latest rolls.

    - GET: the latest rolls of the session, newest first; secret ones only for the game master.
    - POST: roll a W100 against a value, or free dice without one. A player rolls for the own
      character, the game master for whoever he names, and secretly if he wants.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Return the latest rolls the requesting user may see."""
        return Response(latest_rolls(self.session, self.is_game_master))

    def post(self, request, session_id):
        """Roll and return the roll."""
        serializer = RollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data["inspiration"]:
            return Response(inspire(self.session, self.inspired(data)), status=status.HTTP_201_CREATED)
        who, secret = self.roller(data), data["secret"] and self.is_game_master
        character = None if self.is_game_master else data["character"]
        if data["value"] is None:
            roll = roll_dice(self.session, who, data["label"], data["sides"], data["count"], secret)
        else:
            extra = {"character": character.pk, "talent": data["talent"]} if character else {}
            roll = roll_check(self.session, who, data["label"], data["value"], secret, **extra)
        return Response(roll, status=status.HTTP_201_CREATED)

    def inspired(self, data):
        """Return the own character of the player who rolls again with an inspiration point."""
        if self.is_game_master or data["character"] is None:
            raise PermissionDenied(NOT_IN_SESSION)
        return self.own_character(data["character"])

    def roller(self, data):
        """Return the name the roll is made under: the own character of a player, or whoever the game master names."""
        if self.is_game_master:
            return data["who"] or "Spielleiter"
        if data["character"] is None:
            raise PermissionDenied(NOT_IN_SESSION)
        return self.own_character(data["character"]).name
