"""Rule calculations for How to be a Hero characters and query helpers.

The rules follow the official wiki. Leveling with bonus points is a house rule:
wherever the rules say "points", base points and bonus points count together.
"""

from character_app.models import BaseCharacter, Npc, PlayerCharacter

MAX_SKILL_POINTS = 100
MAX_SKILL_VALUE = 100
MAX_DAMAGE_DICE = 10
# What one point won by leveling costs, by the points the skill has after it: (up to, cost). Above: LEVEL_TOP_COST.
LEVEL_STEPS = [(30, 1), (50, 2), (70, 3)]
LEVEL_TOP_COST = 4
# Points above the maximum of a skill that give one point of credit for the same talent.
OVERFLOW_RATE = 2


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


def level_cost(points):
    """Return what the point that brings a skill to the given points costs in bonus points."""
    return next((cost for limit, cost in LEVEL_STEPS if points <= limit), LEVEL_TOP_COST)


def bonus_cost(skill):
    """Return what the points a skill won by leveling cost in bonus points."""
    start = skill["points"]
    return sum(level_cost(points) for points in range(start + 1, start + skill["bonus_points"] + 1))


def refund(skills, talent):
    """Return the credit of a talent: half of the points its skills have above the maximum."""
    over = sum(max(0, raw_value(skill, skills) - MAX_SKILL_VALUE) for skill in skills if skill["talent"] == talent)
    return over // OVERFLOW_RATE


def inspiration_points(skills, talent):
    """Return the inspiration points of a talent: a tenth of the talent value."""
    return round_half_up(talent_value(skills, talent) / 10)


def base_points_left(skills, total):
    """Return how many base points of the creation budget are still unspent."""
    return total - sum(skill["points"] for skill in skills)


def bonus_points_left(skills, total, leveling=False):
    """Return how many bonus points are still unspent.

    A character with the leveling rule pays by the tiers and gets the credit of its talents back;
    any other character pays one bonus point for one point.
    """
    if not leveling:
        return total - sum(skill["bonus_points"] for skill in skills)
    spent = 0
    for talent in BaseCharacter.Talent.values:
        cost = sum(bonus_cost(skill) for skill in skills if skill["talent"] == talent)
        spent += max(0, cost - refund(skills, talent))
    return total - spent


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


def _skill_problems(skill, skills, old, locked):
    """Return the problems of one skill; old is the stored skill with the same id, if there is one."""
    name = skill["name"]
    problems = []
    if skill_points(skill) < 1:
        problems.append(f"„{name}“ braucht mindestens 1 Punkt.")
    value = raw_value(skill, skills)
    if not locked and value > MAX_SKILL_VALUE:
        over = value - MAX_SKILL_VALUE
        problems.append(
            f"„{name}“ hat Wert {value}. Höchstwert ist {MAX_SKILL_VALUE}: Verteile {over} Punkte in {_talent_label(skill['talent'])} um."
        )
    if locked and old and (skill["points"] < old["points"] or skill["talent"] != old["talent"]):
        problems.append(f"„{name}“: Grundpunkte und Begabung sind im Abenteuer fest.")
    if locked and value > MAX_SKILL_VALUE and skill["bonus_points"] > (old or {}).get("bonus_points", 0):
        problems.append(f"„{name}“ ist schon bei {MAX_SKILL_VALUE}. Mehr geht nicht.")
    return problems


def skill_problems(skills, stored, locked):
    """Return what is wrong with the skills of a player character, as texts.

    stored are the skills before the change. While the character plays in an adventure (locked)
    its base points stay and no skill can be bought above the maximum.
    """
    old = {skill["id"]: skill for skill in stored}
    problems = [text for skill in skills for text in _skill_problems(skill, skills, old.get(skill["id"]), locked)]
    if locked:
        kept = {skill["id"] for skill in skills}
        problems += [f"„{skill['name']}“ hat Grundpunkte und bleibt bestehen." for skill in stored if skill["points"] and skill["id"] not in kept]
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
