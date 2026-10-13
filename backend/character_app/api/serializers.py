"""Serializers for NPCs and player characters, including the checks for their lists."""

from rest_framework import serializers

from character_app.models import START_LIFE_POINTS, START_SKILL_POINTS, BaseCharacter, Npc, PlayerCharacter
from character_app.utils import (
    MAX_DAMAGE_DICE,
    MAX_SKILL_POINTS,
    base_points_left,
    inspiration_left,
    talent_summary,
    with_ids,
)
from character_app.house_rules import bonus_points_left, credit_left, skill_problems
from core.knowledge import clean_knowledge

MAX_AMOUNT = 9999
# What every character has, in the order the API returns it.
CHARACTER_FIELDS = [
    "id", "name", "age", "gender", "profession", "description",
    "life_points", "max_life_points", "skill_points_total", "bonus_points_total",
    "skills", "inventory", "special_abilities", "talents", "points_left",
    "symbol", "image", "shows_image", "created_at", "updated_at",
]
ADVENTURE_FIELDS = ["backstory", "player", "adventure"]
# What only the game master changes on a player character.
LEVEL_FIELDS = ["life_points", "max_life_points", "skill_points_total", "bonus_points_total"]
# What only the player changes on a player character.
PLAYER_FIELDS = [
    "name", "age", "gender", "profession", "description",
    "skills", "inventory", "special_abilities", "backstory", "symbol", "shows_image",
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
        "id": _clean_link(entry, "id"),
        "name": name,
        "talent": entry["talent"],
        "points": _clean_number(entry, "points", 0, MAX_SKILL_POINTS),
        "bonus_points": _clean_number(entry, "bonus_points", 0, MAX_SKILL_POINTS),
        "credit_points": _clean_number(entry, "credit_points", 0, MAX_SKILL_POINTS),
        "description": _clean_text(entry, "description"),
    }


def _clean_link(entry, key):
    """Return the id stored under key, or None when the entry is not linked."""
    value = entry.get(key)
    if value is not None and (isinstance(value, bool) or not isinstance(value, int) or value < 1):
        raise serializers.ValidationError(f"{key} muss eine Id sein oder fehlen.")
    return value


def _clean_item(entry):
    """Return one inventory entry with every field checked and filled.

    "item" is the id of the world item it comes from, "hidden" keeps it from the rest of the group.
    """
    return {
        "name": _clean_name(entry),
        "quantity": _clean_number(entry, "quantity", 1, MAX_AMOUNT),
        "damage_dice": _clean_number(entry, "damage_dice", 0, MAX_DAMAGE_DICE),
        "damage_bonus": _clean_number(entry, "damage_bonus", 0, MAX_AMOUNT),
        "description": _clean_text(entry, "description"),
        "item": _clean_link(entry, "item"),
        "hidden": entry.get("hidden") is True,
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

    # Whether leveling costs bonus points by tiers; only player characters pay that way.
    leveling = False
    talents = serializers.SerializerMethodField()
    points_left = serializers.SerializerMethodField()
    # The picture is uploaded through its own endpoint; here it is only shown.
    image = serializers.ImageField(read_only=True)

    def get_talents(self, character):
        """Return talent value and inspiration points for each talent; a player character also what is left."""
        summary = talent_summary(character.skills)
        if hasattr(character, "inspiration_used"):
            for talent, values in summary.items():
                values["left"] = inspiration_left(character, talent)
        return summary

    def get_points_left(self, character):
        """Return the unspent points of both budgets and, with leveling, the open credit of each talent."""
        skills, total = character.skills, character.bonus_points_total
        return {
            "base": base_points_left(skills, character.skill_points_total),
            "bonus": bonus_points_left(skills, total, self.leveling),
            "credit": credit_left(skills) if self.leveling else {},
        }

    def validate_skills(self, skills):
        """Check and complete every skill entry; only characters with the leveling rule have credit."""
        cleaned = [_clean_skill(entry) for entry in _as_list(skills)]
        return cleaned if self.leveling else [{**skill, "credit_points": 0} for skill in cleaned]

    def validate_inventory(self, items):
        """Check and complete every inventory entry."""
        return [_clean_item(entry) for entry in _as_list(items)]

    def validate_shows_image(self, shows):
        """Show the picture instead of the symbol only when the character has a picture."""
        return bool(shows and self.instance and self.instance.image)

    def validate_special_abilities(self, abilities):
        """Check and complete every special ability."""
        return [_clean_ability(entry) for entry in _as_list(abilities)]

    def _current(self, data, field, default):
        """Return the new value of a field, or the stored one on a partial update."""
        return data.get(field, getattr(self.instance, field, default))

    def validate(self, data):
        """Give every skill an id and check that the skills do not cost more than the two budgets allow."""
        stored = with_ids(getattr(self.instance, "skills", []), [])
        if "skills" in data:
            data["skills"] = with_ids(data["skills"], stored)
        skills = self._current(data, "skills", [])
        base = base_points_left(skills, self._current(data, "skill_points_total", START_SKILL_POINTS))
        if base < 0:
            raise serializers.ValidationError(f"Es sind {-base} Grundpunkte zu viel verteilt.")
        bonus = bonus_points_left(skills, self._current(data, "bonus_points_total", 0), self.leveling)
        if bonus < 0:
            raise serializers.ValidationError(f"Es sind {-bonus} Bonuspunkte zu viel ausgegeben.")
        return self._within_maximum(data)

    def _within_maximum(self, data):
        """Keep the life points at or below the maximum whenever one of the two changes."""
        if "life_points" in data or "max_life_points" in data:
            maximum = self._current(data, "max_life_points", START_LIFE_POINTS)
            data["life_points"] = min(self._current(data, "life_points", maximum), maximum)
        return data


class NpcSerializer(CharacterSerializer):
    """Serialize an NPC with the phrases it might say and the knowledge about it."""

    class Meta:
        model = Npc
        fields = CHARACTER_FIELDS + ["visible_from_start", "phrases", "player_knowledge", "gm_knowledge"]

    def validate_player_knowledge(self, pieces):
        """Check the knowledge pieces players can learn."""
        return clean_knowledge(pieces)

    def validate_gm_knowledge(self, pieces):
        """Check the knowledge pieces only the game master reads."""
        return clean_knowledge(pieces)

    def validate_phrases(self, phrases):
        """Check every phrase and drop the ones without text."""
        return [phrase for phrase in map(_clean_phrase, _as_list(phrases)) if phrase["text"]]


class PlayerCharacterSerializer(CharacterSerializer):
    """Serialize a player character for its player; budgets and life points belong to the game master."""

    leveling = True
    player = serializers.CharField(source="owner.username", read_only=True)
    adventure = serializers.SerializerMethodField()

    class Meta:
        model = PlayerCharacter
        fields = CHARACTER_FIELDS + ADVENTURE_FIELDS + ["inspiration_used"]
        read_only_fields = LEVEL_FIELDS + ["inspiration_used"]

    def validate(self, data):
        """Check the skills against the rules of the player: the maximum, the minimum and the base points."""
        if "skills" in data:
            stored = with_ids(getattr(self.instance, "skills", []), [])
            data["skills"] = with_ids(data["skills"], stored)
            locked = bool(self.instance and self.instance.sessions.filter(finished=False).exists())
            problems = skill_problems(data["skills"], stored, locked)
            if problems:
                raise serializers.ValidationError({"skills": problems})
        return super().validate(data)

    def get_adventure(self, character):
        """Return the running adventure the character plays in, or None while it is free."""
        session = next((session for session in character.sessions.all() if not session.finished), None)
        return {"id": session.pk, "name": session.name, "finished": session.finished} if session else None


class PlayerCharacterLevelSerializer(PlayerCharacterSerializer):
    """Serialize a player character for the game master, who reads it all and may only level it."""

    class Meta(PlayerCharacterSerializer.Meta):
        read_only_fields = PLAYER_FIELDS


class CharacterImageSerializer(serializers.Serializer):
    """Read the uploaded picture of a character."""

    image = serializers.ImageField()
