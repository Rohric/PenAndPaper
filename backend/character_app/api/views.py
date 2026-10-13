"""Endpoints for the NPCs of a game master and the characters of the players."""

from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from auth_app.api.permissions import IsGameMaster
from character_app.models import PlayerCharacter
from character_app.utils import npcs_for_user, player_characters_for_user, set_image

from .serializers import (
    CharacterImageSerializer,
    NpcSerializer,
    PlayerCharacterLevelSerializer,
    PlayerCharacterSerializer,
)

GAME_MASTER_ONLY = [IsAuthenticated, IsGameMaster]


class NpcList(generics.ListCreateAPIView):
    """
    List and create NPCs.

    - GET: the NPCs the requesting game master owns.
    - POST: create a new NPC owned by the requesting game master.
    """

    serializer_class = NpcSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only the NPCs the requesting user owns."""
        return npcs_for_user(self.request.user)

    def perform_create(self, serializer):
        """Save the new NPC with the requesting user as owner."""
        serializer.save(owner=self.request.user)


class NpcDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one NPC of the requesting game master."""

    serializer_class = NpcSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only the NPCs the requesting user owns."""
        return npcs_for_user(self.request.user)


class PlayerCharacterList(generics.ListCreateAPIView):
    """
    List and create the characters of a player.

    - GET: the characters the requesting player owns.
    - POST: create a new character owned by the requesting player.
    """

    serializer_class = PlayerCharacterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only the characters the requesting user owns."""
        return player_characters_for_user(self.request.user).prefetch_related("sessions")

    def perform_create(self, serializer):
        """Save the new character with the requesting user as owner."""
        serializer.save(owner=self.request.user)


class PlayerCharacterDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one character of the requesting player."""

    serializer_class = PlayerCharacterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only the characters the requesting user owns."""
        return player_characters_for_user(self.request.user).prefetch_related("sessions")


class GmPlayerCharacterList(generics.ListAPIView):
    """List the characters of all players for the game master."""

    serializer_class = PlayerCharacterLevelSerializer
    permission_classes = GAME_MASTER_ONLY
    queryset = PlayerCharacter.objects.select_related("owner").prefetch_related("sessions")


class GmPlayerCharacterDetail(generics.RetrieveUpdateAPIView):
    """Let the game master read one player character and change its budgets and life points."""

    serializer_class = PlayerCharacterLevelSerializer
    permission_classes = GAME_MASTER_ONLY
    queryset = PlayerCharacter.objects.select_related("owner").prefetch_related("sessions")


class CharacterImage(APIView):
    """
    Base for the picture of a character; subclasses say whose characters and how they are returned.

    - PUT: upload the picture (multipart, field "image"); it replaces the one before.
    - DELETE: remove the picture.
    """

    parser_classes = [MultiPartParser]
    serializer_class = None

    def characters(self):
        """Return the characters the requesting user may change; overridden by the subclasses."""
        raise NotImplementedError

    def put(self, request, pk):
        """Store the uploaded picture and return the character."""
        upload = CharacterImageSerializer(data=request.data)
        upload.is_valid(raise_exception=True)
        return self.answer(set_image(get_object_or_404(self.characters(), pk=pk), upload.validated_data["image"]))

    def delete(self, request, pk):
        """Remove the picture and return the character."""
        return self.answer(set_image(get_object_or_404(self.characters(), pk=pk), None))

    def answer(self, character):
        """Return the character as its usual serializer shows it."""
        return Response(self.serializer_class(character, context={"request": self.request}).data)


class NpcImage(CharacterImage):
    """Upload or remove the picture of an NPC of the requesting game master."""

    permission_classes = GAME_MASTER_ONLY
    serializer_class = NpcSerializer

    def characters(self):
        """Return the NPCs the requesting user owns."""
        return npcs_for_user(self.request.user)


class PlayerCharacterImage(CharacterImage):
    """Upload or remove the picture of a character of the requesting player."""

    permission_classes = [IsAuthenticated]
    serializer_class = PlayerCharacterSerializer

    def characters(self):
        """Return the characters the requesting user owns."""
        return player_characters_for_user(self.request.user).prefetch_related("sessions")
