"""Rule calculations for How to be a Hero characters and query helpers.

The rules follow the official wiki. The house rules (leveling, credit, the lock in an adventure)
are in house_rules.py. Wherever the rules say "points", base points and bonus points count together.
"""

from character_app.models import BaseCharacter, Npc, PlayerCharacter

MAX_SKILL_POINTS = 100
MAX_SKILL_VALUE = 100
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


def raw_value(skill, skills):
    """Return the points of a skill plus the talent value, which may be above the maximum."""
    return skill_points(skill) + talent_value(skills, skill["talent"])


def skill_value(skill, skills):
    """Return the value a skill is rolled against: its points plus the talent value, at most 100."""
    return min(MAX_SKILL_VALUE, raw_value(skill, skills))


def inspiration_points(skills, talent):
    """Return the inspiration points of a talent: a tenth of the talent value."""
    return round_half_up(talent_value(skills, talent) / 10)


def base_points_left(skills, total):
    """Return how many base points of the creation budget are still unspent."""
    return total - sum(skill["points"] for skill in skills)


def talent_summary(skills):
    """Return talent value and inspiration points for each of the three talents."""
    return {
        talent: {"value": talent_value(skills, talent), "inspiration": inspiration_points(skills, talent)}
        for talent in BaseCharacter.Talent.values
    }


def with_ids(skills, stored):
    """Return the skills, each with an id; a new skill gets the next number after all that are known."""
    last = max((skill.get("id") or 0 for skill in [*stored, *skills]), default=0)
    result = []
    for skill in skills:
        if not skill.get("id"):
            last += 1
            skill = {**skill, "id": last}
        result.append(skill)
    return result


def _talent_label(talent):
    """Return the name of a talent."""
    return dict(BaseCharacter.Talent.choices)[talent]


def skill_rule_problems(skill, skills, capped=False):
    """Return what the official rules object to in one skill: at least 1 point, at most the maximum value.

    A capped skill may stand above the maximum; its value is cut to it instead of being refused.
    """
    name = skill["name"]
    problems = []
    if skill_points(skill) < 1:
        problems.append(f"„{name}“ braucht mindestens 1 Punkt.")
    value = raw_value(skill, skills)
    if not capped and value > MAX_SKILL_VALUE:
        problems.append(
            f"„{name}“ hat Wert {value}. Höchstwert ist {MAX_SKILL_VALUE}: Verteile {value - MAX_SKILL_VALUE} Punkte in {_talent_label(skill['talent'])} um."
        )
    return problems


def inspiration_left(character, talent):
    """Return how many inspiration points of a talent a player character has left."""
    used = character.inspiration_used.get(talent, 0)
    return max(0, inspiration_points(character.skills, talent) - used)


def use_inspiration(character, talent):
    """Spend one inspiration point of a talent and return True; return False when none is left."""
    if inspiration_left(character, talent) < 1:
        return False
    character.inspiration_used = {**character.inspiration_used, talent: character.inspiration_used.get(talent, 0) + 1}
    character.save(update_fields=["inspiration_used"])
    return True


def refill_inspiration(characters):
    """Give the characters all their inspiration points back, for a new evening."""
    PlayerCharacter.objects.filter(pk__in=[character.pk for character in characters]).update(inspiration_used={})


def npcs_for_user(user):
    """Return the NPCs the given game master owns."""
    return Npc.objects.filter(owner=user)


def player_characters_for_user(user):
    """Return the characters the given player owns."""
    return PlayerCharacter.objects.filter(owner=user)


def set_image(character, image):
    """Replace the picture of a character and return the character; None removes the picture.

    The file of the picture before is deleted. A new picture is shown right away instead of the symbol.
    """
    if character.image:
        character.image.delete(save=False)
    character.image = image
    character.shows_image = image is not None
    character.save(update_fields=["image", "shows_image"])
    return character
