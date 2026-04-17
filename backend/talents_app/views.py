from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Talent
from .serializers import TalentSerializer


class TalentViewSet(viewsets.ModelViewSet):
    queryset = Talent.objects.all()
    serializer_class = TalentSerializer
    permission_classes = [IsAuthenticated]
