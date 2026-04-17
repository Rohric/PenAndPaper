from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import PlayerProfile
from .serializers import PlayerProfileSerializer


class PlayerProfileViewSet(viewsets.ModelViewSet):
    queryset = PlayerProfile.objects.all()
    serializer_class = PlayerProfileSerializer
    permission_classes = [IsAuthenticated]
