"""Rule calculations for How to be a Hero characters and query helpers.

The rules follow the official wiki. Leveling with bonus points is a house rule:
wherever the rules say "points", base points and bonus points count together.
"""

from character_app.models import BaseCharacter, Npc, PlayerCharacter

MAX_SKILL_POINTS = 100
MAX_DAMAGE_DICE = 10


def round_half_up(value):
    """Round to the nearest whole number, with .5 always going up."""
    return int(value + 0.5)


def skill_points(skill):
    """Return base points plus bonus points of one skill."""
    return skill["points"] + skill["bonus_points"]


def talent_points(skills, talent):
    """Return the sum of all skill points that belong to the given talent."""
    return sum(skill_points(skill) for skill in skills if skill["talent"] == talent)


def talent_value(skills, talent):
    """Return the talent value: a tenth of the talent's skill points."""
    return round_half_up(talent_points(skills, talent) / 10)


def skill_value(skill, skills):
    """Return the value a skill is rolled against: its points plus the talent value."""
    return skill_points(skill) + talent_value(skills, skill["talent"])


def inspiration_points(skills, talent):
    """Return the inspiration points of a talent: a tenth of the talent value."""
    return round_half_up(talent_value(skills, talent) / 10)


def base_points_left(skills, total):
    """Return how many base points of the creation budget are still unspent."""
    return total - sum(skill["points"] for skill in skills)


def bonus_points_left(skills, total):
    """Return how many bonus points of the leveling budget are still unspent."""
    return total - sum(skill["bonus_points"] for skill in skills)


def talent_summary(skills):
    """Return talent value and inspiration points for each of the three talents."""
    return {
        talent: {"value": talent_value(skills, talent), "inspiration": inspiration_points(skills, talent)}
        for talent in BaseCharacter.Talent.values
    }


def npcs_for_user(user):
    """Return the NPCs the given game master owns."""
    return Npc.objects.filter(owner=user)


def player_characters_for_user(user):
    """Return the characters the given player owns."""
    return PlayerCharacter.objects.filter(owner=user)
