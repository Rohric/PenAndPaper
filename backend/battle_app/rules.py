"""Dice rules of How to be a Hero, following the official wiki.

A check is a W100 against a value. The first tenth of the value is a critical success, a 1 always.
The last tenth of what is missing to 100 is a fumble, a 100 always. Tenths are rounded down.
"""

import random

W10 = 10
W100 = 100
CRITICAL = "critical"
SUCCESS = "success"
FAILURE = "failure"
FUMBLE = "fumble"


def roll_die(sides):
    """Return one roll of a die with the given number of sides."""
    return random.randint(1, sides)


def check_result(value, rolled):
    """Return how a W100 roll against a value turns out."""
    if rolled == 1 or rolled <= value // 10:
        return CRITICAL
    if rolled >= W100 - max(0, W100 - value) // 10:
        return FUMBLE
    return SUCCESS if rolled <= value else FAILURE


def check(value):
    """Roll a check against a value and return value, roll and result."""
    rolled = roll_die(W100)
    return {"value": value, "rolled": rolled, "result": check_result(value, rolled)}


def initiative(action_value):
    """Return an initiative roll: one W10 plus the value of the talent Handeln."""
    return roll_die(W10) + action_value


def damage(dice, bonus, critical):
    """Roll the damage of a weapon: the dice count double on a critical hit, the bonus is added after."""
    rolled = [roll_die(W10) for _ in range(dice)]
    return {"dice": rolled, "total": sum(rolled) * (2 if critical else 1) + bonus}
