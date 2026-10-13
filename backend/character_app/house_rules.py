"""House rules of the group, which the official rules of How to be a Hero do not know.

Leveling: a point won after the creation costs bonus points by tiers. Above 100: a skill stays at
the maximum and gives credit to its talent. Credit is a pot of its own with its own counter on every skill:
it pays by the same tiers, but only for skills of its talent, and it never mixes with bonus points.
In an adventure the base points of a character are locked.
The official rules are in utils.py; this module builds on them, never the other way round.
"""

from character_app.models import BaseCharacter
from character_app.utils import MAX_SKILL_VALUE, raw_value, skill_rule_problems, talent_label

# What one point won by leveling costs, by the points the skill has after it: (up to, cost). Above: LEVEL_TOP_COST.
LEVEL_STEPS = [(30, 1), (50, 2), (70, 3)]
LEVEL_TOP_COST = 4
# Points above the maximum of a skill that give one point of credit for the same talent.
OVERFLOW_RATE = 2


def level_cost(points):
    """Return what the point that brings a skill to the given points costs."""
    return next((cost for limit, cost in LEVEL_STEPS if points <= limit), LEVEL_TOP_COST)


def bonus_cost(skill):
    """Return what the points a skill won by leveling cost in bonus points."""
    start = skill["points"]
    return sum(level_cost(points) for points in range(start + 1, start + skill["bonus_points"] + 1))


def credit_cost(skill):
    """Return what the points a skill bought with credit cost in credit; they lie above its bonus points."""
    start = skill["points"] + skill["bonus_points"]
    return sum(level_cost(points) for points in range(start + 1, start + skill.get("credit_points", 0) + 1))


def refund(skills, talent):
    """Return the credit of a talent: half of the points its skills have above the maximum."""
    over = sum(max(0, raw_value(skill, skills) - MAX_SKILL_VALUE) for skill in skills if skill["talent"] == talent)
    return over // OVERFLOW_RATE


def bonus_points_left(skills, total, leveling=False):
    """Return how many bonus points are still unspent.

    A character with the leveling rule pays by the tiers; any other character pays one bonus point for one point.
    Credit is a pot of its own and never pays for bonus points.
    """
    if not leveling:
        return total - sum(skill["bonus_points"] for skill in skills)
    return total - sum(bonus_cost(skill) for skill in skills)


def credit_left(skills):
    """Return for each talent the credit that is not spent yet; below zero when more is spent than it has."""
    left = {}
    for talent in BaseCharacter.Talent.values:
        spent = sum(credit_cost(skill) for skill in skills if skill["talent"] == talent)
        left[talent] = refund(skills, talent) - spent
    return left


def _locked_problems(skill, skills, old):
    """Return what the lock of an adventure objects to in one skill; old is the stored skill with the same id."""
    name = skill["name"]
    problems = []
    if old and (skill["points"] < old["points"] or skill["talent"] != old["talent"]):
        problems.append(f"„{name}“: Grundpunkte und Begabung sind im Abenteuer fest.")
    if raw_value(skill, skills) > MAX_SKILL_VALUE and _bought(skill) > _bought(old or {}):
        problems.append(f"„{name}“ ist schon bei {MAX_SKILL_VALUE}. Mehr geht nicht.")
    return problems


def _bought(skill):
    """Return the points of a skill that were bought with bonus points or credit."""
    return skill.get("bonus_points", 0) + skill.get("credit_points", 0)


def _removed_problems(skills, stored):
    """Return a problem for every stored skill with base points that is gone."""
    kept = {skill["id"] for skill in skills}
    return [f"„{old['name']}“ hat Grundpunkte und bleibt bestehen." for old in stored if old["points"] and old["id"] not in kept]


def _credit_problems(skills):
    """Return a problem for every talent in which more credit is spent than it has."""
    return [
        f"In {talent_label(talent)} ist mehr Guthaben eingesetzt, als die Begabung hat: {-left} zu viel. Nimm Guthaben-Punkte zurück."
        for talent, left in credit_left(skills).items()
        if left < 0
    ]


def skill_problems(skills, stored, locked):
    """Return what is wrong with the skills of a player character, as texts.

    stored are the skills before the change. While the character plays in an adventure (locked)
    its base points stay, a skill above the maximum stays at it instead of being refused, and the
    credit is checked. The creation of a character knows only the official rules.
    """
    old = {skill["id"]: skill for skill in stored}
    problems = []
    for skill in skills:
        problems += skill_rule_problems(skill, skills, capped=locked)
        problems += _locked_problems(skill, skills, old.get(skill["id"])) if locked else []
    return problems + (_removed_problems(skills, stored) + _credit_problems(skills) if locked else [])
