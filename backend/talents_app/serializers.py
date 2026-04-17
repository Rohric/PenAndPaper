from rest_framework import serializers
from .models import Talent


class TalentSerializer(serializers.ModelSerializer):
    gesamt_punkte = serializers.ReadOnlyField()

    class Meta:
        model = Talent
        fields = '__all__'
