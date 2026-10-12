from rest_framework import permissions


class IsMaster(permissions.BasePermission):
    """
    Erlaubt den Zugriff nur, wenn der User ein Profil mit der Rolle 'MASTER' hat.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.player_profiles.filter(role='MASTER').exists()


class IsPlayer(permissions.BasePermission):
    """
    Erlaubt den Zugriff nur, wenn der User ein Profil mit der Rolle 'HERO' hat.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.player_profiles.filter(role='HERO').exists()
