"""Endpoints for the NPCs of a game master and the characters of the players."""

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from auth_app.api.permissions import IsGameMaster
from character_app.models import PlayerCharacter
from character_app.utils import npcs_for_user, player_characters_for_user

from .serializers import NpcSerializer, PlayerCharacterLevelSerializer, PlayerCharacterSerializer

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
        return player_characters_for_user(self.request.user)

    def perform_create(self, serializer):
        """Save the new character with the requesting user as owner."""
        serializer.save(owner=self.request.user)


class PlayerCharacterDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one character of the requesting player."""

    serializer_class = PlayerCharacterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only the characters the requesting user owns."""
        return player_characters_for_user(self.request.user)


class GmPlayerCharacterList(generics.ListAPIView):
    """List the characters of all players for the game master."""

    serializer_class = PlayerCharacterLevelSerializer
    permission_classes = GAME_MASTER_ONLY
    queryset = PlayerCharacter.objects.select_related("owner")


class GmPlayerCharacterDetail(generics.RetrieveUpdateAPIView):
    """Let the game master read one player character and change its budgets and life points."""

    serializer_class = PlayerCharacterLevelSerializer
    permission_classes = GAME_MASTER_ONLY
    queryset = PlayerCharacter.objects.select_related("owner")
