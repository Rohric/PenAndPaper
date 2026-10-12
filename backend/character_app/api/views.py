"""Endpoints for the NPCs of a game master."""

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from auth_app.api.permissions import IsGameMaster
from character_app.utils import npcs_for_user

from .serializers import NpcSerializer


class NpcList(generics.ListCreateAPIView):
    """
    List and create NPCs.

    - GET: the NPCs the requesting game master owns.
    - POST: create a new NPC owned by the requesting game master.
    """

    serializer_class = NpcSerializer
    permission_classes = [IsAuthenticated, IsGameMaster]

    def get_queryset(self):
        """Return only the NPCs the requesting user owns."""
        return npcs_for_user(self.request.user)

    def perform_create(self, serializer):
        """Save the new NPC with the requesting user as owner."""
        serializer.save(owner=self.request.user)


class NpcDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one NPC of the requesting game master."""

    serializer_class = NpcSerializer
    permission_classes = [IsAuthenticated, IsGameMaster]

    def get_queryset(self):
        """Return only the NPCs the requesting user owns."""
        return npcs_for_user(self.request.user)
