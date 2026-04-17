from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import CharacterProfile
from .serializers import CharacterSerializer


class CharacterViewSet(viewsets.ModelViewSet):
    queryset = CharacterProfile.objects.all()
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]
