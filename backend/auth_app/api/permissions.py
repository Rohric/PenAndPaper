"""Custom permissions shared by all apps."""

from rest_framework.permissions import BasePermission


class IsGameMaster(BasePermission):
    """Allow access only to accounts an admin has marked as game master."""

    message = "Nur Spielleiter dürfen diesen Bereich nutzen."

    def has_permission(self, request, view):
        """Return True when the requesting user is a game master."""
        return bool(request.user and request.user.is_authenticated and request.user.is_game_master)
