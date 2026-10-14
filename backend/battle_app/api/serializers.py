"""Serializers for battles, their combatants and an attack."""

from rest_framework import serializers

from battle_app.models import Battle, Combatant
from battle_app.utils import (
    add_character,
    battle_log,
    create_battle,
    joining_initiative,
    npc_fits_battle,
    scene_fits_battle,
    symbol_of,
)
from character_app.utils import MAX_DAMAGE_DICE
from world.world_app.models import Scene

MAX_AMOUNT = 9999
MAX_CHECK_VALUE = 300
MAX_ROUNDS = 99
NOT_YOURS = "Dieser Eintrag gehört dir nicht."
OTHER_ROUND = "Dieser Eintrag gehört nicht zur Welt oder zur Runde dieses Kampfes."
SELF_ATTACK = "Ein Teilnehmer kann sich nicht selbst angreifen."


def clean_status(status):
    """Return one status with its name, the turns it lasts (or None) and whether the combatant sits out."""
    name = status.get("name") if isinstance(status, dict) else None
    if not isinstance(name, str) or not name.strip():
        raise serializers.ValidationError("Jeder Zustand braucht einen Namen.")
    rounds = status.get("rounds")
    if rounds is not None and (isinstance(rounds, bool) or not isinstance(rounds, int) or not 1 <= rounds <= MAX_ROUNDS):
        raise serializers.ValidationError(f"Runden: eine ganze Zahl von 1 bis {MAX_ROUNDS}, oder leer.")
    return {"name": name.strip(), "rounds": rounds, "skips": status.get("skips") is True}


class CombatantSerializer(serializers.ModelSerializer):
    """Serialize one participant of a battle; a linked character brings its own values and its symbol."""

    symbol = serializers.SerializerMethodField()

    class Meta:
        model = Combatant
        fields = [
            "id", "npc", "player_character", "name", "symbol", "action_value", "initiative",
            "life_points", "surprised", "has_parried", "statuses",
        ]
        # A linked character brings its own name; validate() asks for a name only when there is none.
        extra_kwargs = {"name": {"required": False}}

    def get_symbol(self, combatant):
        """Return the symbol of the character behind the combatant."""
        return symbol_of(combatant)

    def validate_statuses(self, statuses):
        """Check every status the game master gives."""
        if not isinstance(statuses, list):
            raise serializers.ValidationError("Hier wird eine Liste erwartet.")
        return [clean_status(status) for status in statuses]

    def validate_npc(self, npc):
        """Accept only an NPC of the requesting game master from the world or the session of the battle."""
        if npc and npc.owner_id != self.context["request"].user.pk:
            raise serializers.ValidationError(NOT_YOURS)
        if npc and not npc_fits_battle(npc, self._battle().session):
            raise serializers.ValidationError(OTHER_ROUND)
        return npc

    def _battle(self):
        """Return the battle of the combatant: its own, or the one the view passes for a new combatant."""
        return self.instance.battle if self.instance else self.context["battle"]

    def validate(self, data):
        """Ask for a name when a new combatant is not linked to a character."""
        linked = data.get("npc") or data.get("player_character")
        if not self.instance and not linked and not data.get("name"):
            raise serializers.ValidationError("Ein Teilnehmer braucht einen Namen oder eine Figur.")
        return data

    def create(self, validated_data):
        """Create the combatant; a linked character fills name, Handeln value and life points.

        A free combatant who joins a running fight rolls the initiative right away, like a character does.
        """
        battle = validated_data["battle"]
        npc, player_character = validated_data.get("npc"), validated_data.get("player_character")
        if npc or player_character:
            return add_character(battle, npc=npc, player_character=player_character)
        validated_data.setdefault("initiative", joining_initiative(battle, validated_data.get("action_value", 0)))
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

    def validate(self, data):
        """Accept a scene only from the world of the battle's session or made up in that very session."""
        scene = data.get("scene")
        session = data.get("session", getattr(self.instance, "session", None))
        if scene and not scene_fits_battle(scene, session):
            raise serializers.ValidationError({"scene": OTHER_ROUND})
        return data

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

    def validate(self, data):
        """Refuse an attack of a combatant on itself."""
        if data["attacker"] == data["defender"]:
            raise serializers.ValidationError(SELF_ATTACK)
        return data


class ActionSerializer(serializers.Serializer):
    """Read an action that is no attack: who acts, what is done and, if it needs a roll, the value to roll against."""

    actor = serializers.PrimaryKeyRelatedField(queryset=Combatant.objects.all())
    label = serializers.CharField(max_length=200)
    value = serializers.IntegerField(min_value=0, max_value=MAX_CHECK_VALUE, allow_null=True, default=None)


class PlayerActionSerializer(serializers.Serializer):
    """Read the action of a player: what the own character does and, if it needs a roll, the skill to roll on."""

    label = serializers.CharField(max_length=200)
    rolls = serializers.BooleanField(default=False)
    skill = serializers.CharField(max_length=200, allow_blank=True, default="")


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
