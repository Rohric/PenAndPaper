from rest_framework import serializers
from .models import CharacterProfile
from talents_app.models import Talent
from talents_app.serializers import TalentSerializer


class CharacterSerializer(serializers.ModelSerializer):
    # Verschachtelte Talente bei einer GET-Anfrage anzeigen
    talents = TalentSerializer(source='talent_set', many=True, read_only=True)

    class Meta:
        model = CharacterProfile
        fields = '__all__'

    def create(self, validated_data):
        character = CharacterProfile.objects.create(**validated_data)

        base_talents = ['WISSEN', 'SOZIAL', 'HANDELN']
        for talent_name in base_talents:
            Talent.objects.create(
                character=character,
                name=talent_name,
                grund_punkte=0,
                bonus_punkte=0
            )

        return character
