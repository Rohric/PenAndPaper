"""Endpoints for sessions: the game master runs them, the players of a session take part."""

from functools import cached_property

from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from auth_app.api.permissions import IsGameMaster
from session_app.models import Note, SessionEntry
from session_app.utils import (
    close_chapter,
    give_item,
    latest_rolls,
    player_view,
    roll_check,
    roll_dice,
    session_for_game_master,
    session_for_member,
    sessions_for_game_master,
    sessions_for_player,
)

from .serializers import (
    CommentSerializer,
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
        serializer.save(owner=self.request.user)


class SessionDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one session of the requesting game master."""

    serializer_class = SessionSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only the sessions the requesting user runs."""
        return sessions_for_game_master(self.request.user)


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
    """Set the state of one world entry in the session: done, revealed, pinned, steps and known pieces."""

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
    """Close the chapter of a session: every character gets its bonus points, the next chapter begins."""

    def post(self, request, session_id):
        """Give the bonus points and return the session."""
        serializer = LevelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        close_chapter(self.session, serializer.validated_data["bonus_points"])
        return Response(SessionSerializer(self.session, context={"request": request}).data)


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


class NoteList(SessionMixin, generics.ListCreateAPIView):
    """
    List and create the notes of a session.

    - GET: the own notes and the notepad of the group.
    - POST: write a note; it is personal unless "shared" is set.
    """

    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return the user's own notes and the shared ones, with their comments."""
        visible = Q(shared=True) | Q(author=self.request.user)
        return self.session.notes.filter(visible).select_related("author").prefetch_related("comments__author")

    def perform_create(self, serializer):
        """Save the note in the session with the requesting user as author."""
        serializer.save(session=self.session, author=self.request.user)


class NoteDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one of the requesting user's own notes."""

    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only the notes the requesting user wrote."""
        return Note.objects.filter(author=self.request.user)


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
        messages = self.session.messages.all()
        if not self.is_game_master:
            return messages.filter(character__owner=self.request.user)
        character = self.request.query_params.get("character")
        return messages.filter(character_id=character) if character else messages

    def perform_create(self, serializer):
        """Save the message for a character of the session and note who wrote it."""
        character = self.own_character(serializer.validated_data["character"])
        serializer.save(session=self.session, character=character, from_gm=self.is_game_master)


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
        who, secret = self.roller(data), data["secret"] and self.is_game_master
        if data["value"] is None:
            roll = roll_dice(self.session, who, data["label"], data["sides"], data["count"], secret)
        else:
            roll = roll_check(self.session, who, data["label"], data["value"], secret)
        return Response(roll, status=status.HTTP_201_CREATED)

    def roller(self, data):
        """Return the name the roll is made under: the own character of a player, or whoever the game master names."""
        if self.is_game_master:
            return data["who"] or "Spielleiter"
        if data["character"] is None:
            raise PermissionDenied(NOT_IN_SESSION)
        return self.own_character(data["character"]).name
