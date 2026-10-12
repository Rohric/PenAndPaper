from rest_framework import serializers
from .models import Ability


class AbilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Ability
        fields = '__all__'

    def update(self, instance, validated_data):
        request = self.context.get('request')

        # 1. Prüfen, ob versucht wird, die Caps zu verändern
        max_grund_neu = validated_data.get(
            'max_grund_punkte', instance.max_grund_punkte)
        max_bonus_neu = validated_data.get(
            'max_bonus_punkte', instance.max_bonus_punkte)

        caps_changed = (max_grund_neu != instance.max_grund_punkte) or (
            max_bonus_neu != instance.max_bonus_punkte)

        # 2. Wenn Caps verändert wurden, Rolle überprüfen
        if caps_changed and request and hasattr(request, 'user'):
            # Prüft über das related_name 'player_profiles', ob der User ein Profil mit Rolle 'MASTER' hat
            is_master = request.user.player_profiles.filter(
                role='MASTER').exists()

            if not is_master:
                raise serializers.ValidationError(
                    {"berechtigung": "Nur ein Game Master darf die Cap-Werte (max_grund_punkte, max_bonus_punkte) anpassen."}
                )

        return super().update(instance, validated_data)
