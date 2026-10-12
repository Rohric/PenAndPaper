from rest_framework import permissions


class IsCampaignMaster(permissions.BasePermission):
    """
    Prüft, ob der zugreifende User der Game Master dieser speziellen Kampagne ist.
    """

    def has_object_permission(self, request, view, obj):
        # obj ist in diesem Fall die Kampagne
        if not request.user or not request.user.is_authenticated:
            return False

        if obj.game_master and obj.game_master.user == request.user:
            return True

        return False


class IsCampaignMember(permissions.BasePermission):
    """
    Hier würdest du später prüfen, ob einer der Charaktere des Users 
    in der 'characters' ManyToMany-Beziehung der Kampagne existiert.
    """
