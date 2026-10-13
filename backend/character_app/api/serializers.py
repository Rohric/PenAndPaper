"""Serializers for NPCs and player characters, including the checks for their lists."""

from rest_framework import serializers

from character_app.models import START_SKILL_POINTS, BaseCharacter, Npc, PlayerCharacter
from character_app.utils import (
    MAX_DAMAGE_DICE,
    MAX_SKILL_POINTS,
    base_points_left,
    bonus_points_left,
    talent_summary,
)

MAX_AMOUNT = 9999
# What every character has, in the order the API returns it.
CHARACTER_FIELDS = [
    "id", "name", "age", "gender", "profession", "description",
    "life_points", "skill_points_total", "bonus_points_total",
    "skills", "inventory", "special_abilities", "talents", "points_left",
]
# What only the game master changes on a player character.
LEVEL_FIELDS = ["life_points", "skill_points_total", "bonus_points_total"]
# What only the player changes on a player character.
PLAYER_FIELDS = [
    "name", "age", "gender", "profession", "description",
    "skills", "inventory", "special_abilities", "backstory",
]


def _as_list(value):
    """Return the value when it is a list, otherwise raise a validation error."""
    if not isinstance(value, list):
        raise serializers.ValidationError("Hier wird eine Liste erwartet.")
    return value


def _clean_name(entry):
    """Return the trimmed name of a list entry, or raise when it is missing."""
    name = entry.get("name") if isinstance(entry, dict) else None
    if not isinstance(name, str) or not name.strip():
        raise serializers.ValidationError("Jeder Eintrag braucht einen Namen.")
    return name.strip()


def _clean_text(entry, key):
    """Return the trimmed text stored under key; a missing text becomes empty."""
    value = entry.get(key, "")
    if not isinstance(value, str):
        raise serializers.ValidationError(f"{key} muss ein Text sein.")
    return value.strip()


def _clean_number(entry, key, default, high):
    """Return the whole number stored under key, or raise when it is out of range."""
    value = entry.get(key, default)
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= high:
        raise serializers.ValidationError(f"{key} muss eine ganze Zahl von 0 bis {high} sein.")
    return value


def _clean_skill(entry):
    """Return one skill entry with every field checked and filled."""
    name = _clean_name(entry)
    if entry.get("talent") not in BaseCharacter.Talent.values:
        raise serializers.ValidationError(f"{name}: unbekannte Begabung.")
    return {
        "name": name,
        "talent": entry["talent"],
        "points": _clean_number(entry, "points", 0, MAX_SKILL_POINTS),
        "bonus_points": _clean_number(entry, "bonus_points", 0, MAX_AMOUNT),
        "description": _clean_text(entry, "description"),
    }


def _clean_item(entry):
    """Return one inventory entry with every field checked and filled."""
    return {
        "name": _clean_name(entry),
        "quantity": _clean_number(entry, "quantity", 1, MAX_AMOUNT),
        "damage_dice": _clean_number(entry, "damage_dice", 0, MAX_DAMAGE_DICE),
        "damage_bonus": _clean_number(entry, "damage_bonus", 0, MAX_AMOUNT),
        "description": _clean_text(entry, "description"),
    }


def _clean_phrase(phrase):
    """Return one phrase with its optional trigger; a plain text is a phrase without trigger."""
    entry = {"text": phrase} if isinstance(phrase, str) else phrase
    if not isinstance(entry, dict):
        raise serializers.ValidationError("Jeder Beispielsatz braucht einen Text.")
    return {"trigger": _clean_text(entry, "trigger"), "text": _clean_text(entry, "text")}


def _clean_ability(entry):
    """Return one special ability with every field checked and filled."""
    return {
        "name": _clean_name(entry),
        "description": _clean_text(entry, "description"),
        "roll_condition": _clean_text(entry, "roll_condition"),
    }


class CharacterSerializer(serializers.ModelSerializer):
    """Base for both kinds of characters: check the lists against the rules and add the calculated values."""

    talents = serializers.SerializerMethodField()
    points_left = serializers.SerializerMethodField()

    def get_talents(self, character):
        """Return talent value and inspiration points for each talent."""
        return talent_summary(character.skills)

    def get_points_left(self, character):
        """Return the unspent points of both budgets."""
        return {
            "base": base_points_left(character.skills, character.skill_points_total),
            "bonus": bonus_points_left(character.skills, character.bonus_points_total),
        }

    def validate_skills(self, skills):
        """Check and complete every skill entry."""
        return [_clean_skill(entry) for entry in _as_list(skills)]

    def validate_inventory(self, items):
        """Check and complete every inventory entry."""
        return [_clean_item(entry) for entry in _as_list(items)]

    def validate_special_abilities(self, abilities):
        """Check and complete every special ability."""
        return [_clean_ability(entry) for entry in _as_list(abilities)]

    def _current(self, data, field, default):
        """Return the new value of a field, or the stored one on a partial update."""
        return data.get(field, getattr(self.instance, field, default))

    def validate(self, data):
        """Check that the skills do not cost more than the two budgets allow."""
        skills = self._current(data, "skills", [])
        if base_points_left(skills, self._current(data, "skill_points_total", START_SKILL_POINTS)) < 0:
            raise serializers.ValidationError("Die Grundpunkte der Fähigkeiten übersteigen das Budget.")
        if bonus_points_left(skills, self._current(data, "bonus_points_total", 0)) < 0:
            raise serializers.ValidationError("Die Bonuspunkte der Fähigkeiten übersteigen das Budget.")
        return data


class NpcSerializer(CharacterSerializer):
    """Serialize an NPC with the phrases it might say."""

    class Meta:
        model = Npc
        fields = CHARACTER_FIELDS + ["phrases"]

    def validate_phrases(self, phrases):
        """Check every phrase and drop the ones without text."""
        return [phrase for phrase in map(_clean_phrase, _as_list(phrases)) if phrase["text"]]


class PlayerCharacterSerializer(CharacterSerializer):
    """Serialize a player character for its player; budgets and life points belong to the game master."""

    player = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = PlayerCharacter
        fields = CHARACTER_FIELDS + ["backstory", "player"]
        read_only_fields = LEVEL_FIELDS


class PlayerCharacterLevelSerializer(PlayerCharacterSerializer):
    """Serialize a player character for the game master, who reads it all and may only level it."""

    class Meta(PlayerCharacterSerializer.Meta):
        read_only_fields = PLAYER_FIELDS
