"""Serializers for battles, their combatants and an attack."""

from rest_framework import serializers

from battle_app.models import Battle, Combatant
from battle_app.utils import add_character, battle_log, create_battle
from character_app.utils import MAX_DAMAGE_DICE
from world.world_app.models import Scene

MAX_AMOUNT = 9999
MAX_CHECK_VALUE = 300
NOT_YOURS = "Dieser Eintrag gehört dir nicht."


class CombatantSerializer(serializers.ModelSerializer):
    """Serialize one participant of a battle; a linked character brings its own values."""

    class Meta:
        model = Combatant
        fields = [
            "id", "npc", "player_character", "name", "action_value", "initiative",
            "life_points", "surprised", "has_parried",
        ]
        extra_kwargs = {"name": {"required": False}}

    def validate_npc(self, npc):
        """Accept only an NPC of the requesting game master."""
        if npc and npc.owner_id != self.context["request"].user.pk:
            raise serializers.ValidationError(NOT_YOURS)
        return npc

    def validate(self, data):
        """Ask for a name when a new combatant is not linked to a character."""
        linked = data.get("npc") or data.get("player_character")
        if not self.instance and not linked and not data.get("name"):
            raise serializers.ValidationError("Ein Teilnehmer braucht einen Namen oder eine Figur.")
        return data

    def create(self, validated_data):
        """Create the combatant; a linked character fills name, Handeln value and life points."""
        npc, player_character = validated_data.get("npc"), validated_data.get("player_character")
        if npc or player_character:
            return add_character(validated_data["battle"], npc=npc, player_character=player_character)
        return super().create(validated_data)


class BattleSerializer(serializers.ModelSerializer):
    """Serialize a battle with its combatants and its log; a scene named on creation brings its NPCs along."""

    combatants = CombatantSerializer(many=True, read_only=True)
    log = serializers.SerializerMethodField()
    scene = serializers.PrimaryKeyRelatedField(
        queryset=Scene.objects.all(), write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Battle
        fields = [
            "id", "name", "session", "scene", "round", "current", "finished", "pending",
            "created_at", "combatants", "log",
        ]
        read_only_fields = ["round", "current", "finished", "pending"]

    def get_log(self, battle):
        """Return what happened in the battle, newest first."""
        return battle_log(battle)

    def validate_session(self, session):
        """Accept only a session the requesting game master runs."""
        if session and session.owner_id != self.context["request"].user.pk:
            raise serializers.ValidationError(NOT_YOURS)
        return session

    def validate_scene(self, scene):
        """Accept only a scene from a world of the requesting game master."""
        if scene and scene.chapter.world.owner_id != self.context["request"].user.pk:
            raise serializers.ValidationError(NOT_YOURS)
        return scene

    def create(self, validated_data):
        """Create the battle with the characters of its session and the NPCs of its scene."""
        return create_battle(
            validated_data["owner"], validated_data["name"],
            validated_data.get("session"), validated_data.get("scene"),
        )

    def update(self, instance, validated_data):
        """Change the battle itself; a scene only matters when the battle is created."""
        validated_data.pop("scene", None)
        return super().update(instance, validated_data)


class AttackSerializer(serializers.Serializer):
    """Read an attack of the game master: who attacks whom, the value of the attack and the weapon."""

    attacker = serializers.PrimaryKeyRelatedField(queryset=Combatant.objects.all())
    defender = serializers.PrimaryKeyRelatedField(queryset=Combatant.objects.all())
    value = serializers.IntegerField(min_value=0, max_value=MAX_CHECK_VALUE)
    damage_dice = serializers.IntegerField(min_value=0, max_value=MAX_DAMAGE_DICE)
    damage_bonus = serializers.IntegerField(min_value=0, max_value=MAX_AMOUNT, default=0)


class ParrySerializer(serializers.Serializer):
    """Read how the game master decides the parry of an open hit: a value to parry with, or none to take the hit."""

    parry_value = serializers.IntegerField(min_value=0, max_value=MAX_CHECK_VALUE, required=False, allow_null=True)


class PlayerAttackSerializer(serializers.Serializer):
    """Read the attack of a player: the target, and skill and weapon by their names on the own sheet."""

    defender = serializers.PrimaryKeyRelatedField(queryset=Combatant.objects.all())
    skill = serializers.CharField(max_length=200, allow_blank=True, default="")
    weapon = serializers.CharField(max_length=200, allow_blank=True, default="")


class PlayerParrySerializer(serializers.Serializer):
    """Read whether a player parries a hit, and with which skill of the own sheet."""

    parry = serializers.BooleanField()
    skill = serializers.CharField(max_length=200, allow_blank=True, default="")
