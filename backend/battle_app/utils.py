"""The course of a fight: who takes part, whose turn it is, attacks, parries and the end."""

from collections import defaultdict, deque

from django.db import transaction

from battle_app import rules
from battle_app.models import Battle, Combatant
from character_app.models import BaseCharacter
from character_app.utils import skill_value, talent_value

KEPT_LINES = 30
# What happened in every battle, newest first. It lives only in the memory of the server.
LOGS = defaultdict(lambda: deque(maxlen=KEPT_LINES))
RESULT_WORDS = {
    rules.CRITICAL: "kritischer Erfolg",
    rules.SUCCESS: "Erfolg",
    rules.FAILURE: "Fehlschlag",
    rules.FUMBLE: "Patzer",
}
HITS = (rules.CRITICAL, rules.SUCCESS)
# Without a weapon a character does the damage of one W10.
UNARMED = (1, 0)
# The stages of an open exchange: it waits for the parry of the defender,
# then for the game master to close the turn. Nothing of it counts before that.
PARRY = "parry"
CLOSE = "close"
# What the players see of an open exchange.
SHOWN_TO_PLAYERS = ("stage", "attacker", "defender", "attacker_name", "defender_name", "attack", "parry", "damage")


def battles_for_user(user):
    """Return the battles the given game master runs."""
    return Battle.objects.filter(owner=user)


def running_battle(session):
    """Return the battle a session is fighting right now, or None."""
    return session.battles.filter(finished=False).first()


def own_combatant(battle, user):
    """Return the combatant that is a character of the given player, or None."""
    return battle.combatants.filter(player_character__owner=user).first()


def stage_of(battle):
    """Return the stage of the open exchange of a battle, or None when nothing is open."""
    return battle.pending["stage"] if battle.pending else None


def write_log(battle, line):
    """Add a line to what happened in the battle."""
    LOGS[battle.pk].appendleft(line)


def battle_log(battle):
    """Return what happened in the battle, newest first."""
    return list(LOGS[battle.pk])


def check_line(text, roll):
    """Return a check as one line for the log."""
    return f"{text}: {roll['rolled']} gegen {roll['value']}, {RESULT_WORDS[roll['result']]}."


def add_character(battle, npc=None, player_character=None):
    """Add an NPC or a player character with its name, Handeln value and life points.

    Who joins a fight that already runs rolls the initiative right away.
    """
    character = npc or player_character
    action_value = talent_value(character.skills, BaseCharacter.Talent.ACTION)
    return Combatant.objects.create(
        battle=battle, npc=npc, player_character=player_character, name=character.name, action_value=action_value,
        life_points=character.life_points, initiative=rules.initiative(action_value) if battle.round else 0,
    )


@transaction.atomic
def create_battle(owner, name, session=None, scene=None):
    """Create a battle; it brings the characters of its session and the NPCs of its scene along."""
    battle = Battle.objects.create(owner=owner, name=name, session=session)
    for character in session.characters.all() if session else []:
        add_character(battle, player_character=character)
    for npc in scene.npcs.all() if scene else []:
        add_character(battle, npc=npc)
    return battle


def carry_life(combatant):
    """Write the life points of a combatant onto its player character; an NPC stays as the world has it."""
    character = combatant.player_character
    if character:
        character.life_points = min(max(0, combatant.life_points), character.max_life_points)
        character.save(update_fields=["life_points"])


def follow_characters(battle):
    """Take over the life points the player characters have right now, then return the battle.

    The game master can change them outside the fight at any time.
    """
    linked = battle.combatants.exclude(player_character=None).select_related("player_character")
    for combatant in [] if battle.finished else linked:
        if combatant.life_points != combatant.player_character.life_points:
            combatant.life_points = combatant.player_character.life_points
            combatant.save(update_fields=["life_points"])
    return battle


def attack_value(character, skill_name):
    """Return the value a character attacks or parries with: a named skill, otherwise the talent Handeln."""
    skill = next((skill for skill in character.skills if skill["name"] == skill_name), None)
    if skill:
        return skill_value(skill, character.skills)
    return talent_value(character.skills, BaseCharacter.Talent.ACTION)


def weapon_damage(character, weapon_name):
    """Return dice and bonus of a weapon in the character's inventory; without one it is one W10."""
    weapons = [item for item in character.inventory if item["damage_dice"] > 0 and item["name"] == weapon_name]
    return (weapons[0]["damage_dice"], weapons[0]["damage_bonus"]) if weapons else UNARMED


def fighters(battle):
    """Return the combatants that can still act, in the order of their initiative."""
    return [combatant for combatant in battle.combatants.all() if combatant.life_points > 0]


def set_turn(battle, order, index):
    """Give the turn to the combatant at the given place of the order; nobody when the order is empty."""
    battle.current = order[index] if order else None
    battle.save(update_fields=["round", "current"])
    if battle.current:
        write_log(battle, f"{battle.current.name} ist dran.")


@transaction.atomic
def start(battle):
    """Roll the initiative for everybody and begin round 1; surprised combatants sit this round out."""
    for combatant in battle.combatants.all():
        combatant.initiative = rules.initiative(combatant.action_value)
        combatant.has_parried = False
        combatant.save(update_fields=["initiative", "has_parried"])
    battle.round = 1
    LOGS[battle.pk].clear()
    write_log(battle, "Runde 1 beginnt.")
    order = [combatant for combatant in fighters(battle) if not combatant.surprised] or fighters(battle)
    set_turn(battle, order, 0)


@transaction.atomic
def next_turn(battle):
    """Give the turn to the next combatant; after the last one a new round begins and parries are free again."""
    order = fighters(battle)
    later = [c for c in order if battle.current and (-c.initiative, c.pk) > (-battle.current.initiative, battle.current.pk)]
    if battle.round == 1:
        later = [combatant for combatant in later if not combatant.surprised]
    if later:
        return set_turn(battle, later, 0)
    battle.round += 1
    battle.combatants.update(has_parried=False)
    write_log(battle, f"Runde {battle.round} beginnt.")
    set_turn(battle, order, 0)


def keep(battle, exchange):
    """Keep an open exchange on the battle, or nothing (None)."""
    battle.pending = exchange
    battle.save(update_fields=["pending"])


def add_damage(exchange, critical):
    """Roll the damage of an open hit and note it; the defender loses it when the turn is closed."""
    rolled = rules.damage(exchange["dice"], exchange["bonus"], critical)
    exchange["damage"] = rolled
    exchange["lines"].append(f"{exchange['defender_name']} verliert {rolled['total']} Lebenspunkte.")


def attack(battle, attacker, defender, value, dice, bonus):
    """Roll an attack and keep it open. A plain hit first waits for the parry of the defender."""
    hit = rules.check(value)
    exchange = {
        "stage": CLOSE, "attacker": attacker.pk, "defender": defender.pk, "attacker_name": attacker.name,
        "defender_name": defender.name, "attack": hit, "parry": None, "damage": None, "dice": dice, "bonus": bonus,
        "lines": [check_line(f"{attacker.name} greift {defender.name} an", hit)],
    }
    if hit["result"] == rules.SUCCESS and not defender.has_parried:
        exchange["stage"] = PARRY
    elif hit["result"] in HITS:
        add_damage(exchange, hit["result"] == rules.CRITICAL)
    keep(battle, exchange)


def resolve(battle, parry_value):
    """Settle the parry of the open hit: the defender parries with a value, or takes the damage (None)."""
    exchange = battle.pending
    name = exchange["defender_name"]
    if parry_value is None:
        exchange["lines"].append(f"{name} pariert nicht.")
    else:
        exchange["parry"] = rules.check(parry_value)
        exchange["lines"].append(check_line(f"{name} pariert", exchange["parry"]))
    if not exchange["parry"] or exchange["parry"]["result"] not in HITS:
        add_damage(exchange, False)
    exchange["stage"] = CLOSE
    keep(battle, exchange)


def settle(defender, exchange):
    """Take the damage of a closed exchange off the defender and note the parry it used."""
    defender.has_parried = defender.has_parried or exchange["parry"] is not None
    defender.life_points -= exchange["damage"]["total"] if exchange["damage"] else 0
    defender.save(update_fields=["life_points", "has_parried"])
    carry_life(defender)


@transaction.atomic
def close_turn(battle):
    """Close the open exchange: write it into the log, take the damage off the defender, move the turn on.

    The turn only moves on when the attacker was the one whose turn it is.
    """
    exchange = battle.pending
    keep(battle, None)
    for line in exchange["lines"]:
        write_log(battle, line)
    defender = battle.combatants.filter(pk=exchange["defender"]).first()
    if defender:
        settle(defender, exchange)
    if battle.current_id == exchange["attacker"]:
        next_turn(battle)


def discard(battle):
    """Throw the open exchange away: nothing of it is saved, and the roll can be made again."""
    keep(battle, None)


def finish(battle):
    """End the battle; an exchange that is still open is thrown away."""
    battle.finished = True
    battle.current = None
    battle.pending = None
    battle.save(update_fields=["finished", "current", "pending"])
    write_log(battle, "Der Kampf ist vorbei.")


def combatant_for_players(combatant, user):
    """Return what players see of a combatant: the group with life points, enemies without."""
    character = combatant.player_character
    return {
        "id": combatant.pk, "name": combatant.name, "initiative": combatant.initiative,
        "is_player": character is not None, "mine": bool(character and character.owner_id == user.pk),
        "life_points": combatant.life_points if character else None,
        "out": combatant.life_points <= 0, "has_parried": combatant.has_parried,
    }


def battle_for_players(battle, user):
    """Return a battle as the players of its session see it."""
    combatants = battle.combatants.select_related("player_character")
    exchange = battle.pending
    return {
        "id": battle.pk, "name": battle.name, "round": battle.round, "current": battle.current_id,
        "combatants": [combatant_for_players(combatant, user) for combatant in combatants],
        "pending": {key: exchange[key] for key in SHOWN_TO_PLAYERS} if exchange else None,
        "log": battle_log(battle),
    }
