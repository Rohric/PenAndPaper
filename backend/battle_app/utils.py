"""The course of a fight: who takes part, whose turn it is, attacks, parries, other actions, statuses and the end."""

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
# An open exchange is an attack on somebody, or another action with or without a roll.
ATTACK = "attack"
ACTION = "action"
# What the players see of an open exchange.
SHOWN_TO_PLAYERS = (
    "kind", "label", "stage", "attacker", "defender", "attacker_name", "defender_name", "attack", "parry", "damage",
)
# How many combatants in a row can sit out before the fight stops and waits for the game master.
MAX_SKIPS = 50


def battles_for_user(user):
    """Return the battles the given game master runs."""
    return Battle.objects.filter(owner=user)


def running_battle(session):
    """Return the battle a session is fighting right now, or None."""
    return session.battles.filter(finished=False).first()


def current_battle(session):
    """Return the running battle with the life points the player characters have right now, or None."""
    battle = running_battle(session)
    return follow_characters(battle) if battle else None


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


def joining_initiative(battle, action_value):
    """Return the initiative of a combatant who joins now: rolled when the fight runs, 0 before it begins."""
    return rules.initiative(action_value) if battle.round else 0


def add_character(battle, npc=None, player_character=None):
    """Add an NPC or a player character with its name, Handeln value and life points.

    Who joins a fight that already runs rolls the initiative right away.
    """
    character = npc or player_character
    action_value = talent_value(character.skills, BaseCharacter.Talent.ACTION)
    return Combatant.objects.create(
        battle=battle, npc=npc, player_character=player_character, name=character.name, action_value=action_value,
        life_points=character.life_points, initiative=joining_initiative(battle, action_value),
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


def set_turn(battle, combatant):
    """Give the turn to a combatant, or to nobody (None)."""
    battle.current = combatant
    battle.save(update_fields=["round", "current"])
    if combatant:
        write_log(battle, f"{combatant.name} ist dran.")


def tick(battle, combatant, status):
    """Return a status with one turn less; None when it has run out, the same status when it has no end."""
    if status["rounds"] is None:
        return status
    if status["rounds"] <= 1:
        write_log(battle, f"{combatant.name} ist nicht mehr {status['name']}.")
        return None
    return {**status, "rounds": status["rounds"] - 1}


def sits_out(battle, combatant):
    """Count the statuses of a combatant down by one turn and return whether it sits this turn out."""
    skipping = [status["name"] for status in combatant.statuses if status["skips"]]
    if skipping:
        write_log(battle, f"{combatant.name} setzt aus: {', '.join(skipping)}.")
    ticked = [tick(battle, combatant, status) for status in combatant.statuses]
    combatant.statuses = [status for status in ticked if status]
    combatant.save(update_fields=["statuses"])
    return bool(skipping)


def new_round(battle):
    """Begin the next round, in which parries are free again, and return who fights in it."""
    battle.round += 1
    battle.combatants.update(has_parried=False)
    write_log(battle, f"Runde {battle.round} beginnt.")
    return fighters(battle)


def advance(battle, order):
    """Give the turn to the first of the given combatants who does not sit out.

    When all of them sit out, the next rounds follow. When nobody can act at all, nobody is on turn.
    """
    for _ in range(MAX_SKIPS):
        order = order or new_round(battle)
        if not order:
            break
        candidate = order.pop(0)
        if not sits_out(battle, candidate):
            return set_turn(battle, candidate)
    set_turn(battle, None)


def upcoming(battle):
    """Return the combatants whose turn still comes in this round; in round 1 the surprised ones wait."""
    current = battle.current
    later = [c for c in fighters(battle) if current and (-c.initiative, c.pk) > (-current.initiative, current.pk)]
    return [combatant for combatant in later if not (battle.round == 1 and combatant.surprised)]


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
    advance(battle, [combatant for combatant in fighters(battle) if not combatant.surprised] or fighters(battle))


@transaction.atomic
def next_turn(battle):
    """Give the turn to the next combatant who does not sit out; after the last one a new round begins."""
    advance(battle, upcoming(battle))


def log_new_statuses(combatant, before):
    """Write every status into the log that the combatant has now and did not have before."""
    for status in combatant.statuses:
        if status["name"] not in before:
            turns = f" für {status['rounds']} Züge" if status["rounds"] else ""
            write_log(combatant.battle, f"{combatant.name} ist jetzt {status['name']}{turns}.")


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
        "kind": ATTACK, "label": "", "stage": CLOSE, "attacker": attacker.pk, "defender": defender.pk,
        "attacker_name": attacker.name, "defender_name": defender.name, "attack": hit, "parry": None,
        "damage": None, "dice": dice, "bonus": bonus,
        "lines": [check_line(f"{attacker.name} greift {defender.name} an", hit)],
    }
    if hit["result"] == rules.SUCCESS and not defender.has_parried:
        exchange["stage"] = PARRY
    elif hit["result"] in HITS:
        add_damage(exchange, hit["result"] == rules.CRITICAL)
    keep(battle, exchange)


def act(battle, actor, label, value=None):
    """Keep an action open that is no attack: what the combatant does and, when a value is given, the check on it."""
    rolled = rules.check(value) if value is not None else None
    line = check_line(f"{actor.name}: {label}", rolled) if rolled else f"{actor.name}: {label}."
    keep(battle, {
        "kind": ACTION, "label": label, "stage": CLOSE, "attacker": actor.pk, "defender": None,
        "attacker_name": actor.name, "defender_name": "", "attack": rolled, "parry": None, "damage": None,
        "lines": [line],
    })


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


def symbol_of(combatant):
    """Return the symbol of the character behind a combatant; empty for a combatant that is only a name."""
    character = combatant.player_character or combatant.npc
    return character.symbol if character else ""


def combatant_for_players(combatant, user):
    """Return what players see of a combatant: the group with life points, enemies without."""
    character = combatant.player_character
    return {
        "id": combatant.pk, "name": combatant.name, "initiative": combatant.initiative,
        "is_player": character is not None, "mine": bool(character and character.owner_id == user.pk),
        "life_points": combatant.life_points if character else None,
        "out": combatant.life_points <= 0, "has_parried": combatant.has_parried,
        "statuses": combatant.statuses, "symbol": symbol_of(combatant),
    }


def battle_for_players(battle, user):
    """Return a battle as the players of its session see it."""
    combatants = battle.combatants.select_related("player_character", "npc")
    exchange = battle.pending
    return {
        "id": battle.pk, "name": battle.name, "round": battle.round, "current": battle.current_id,
        "combatants": [combatant_for_players(combatant, user) for combatant in combatants],
        "pending": {key: exchange.get(key) for key in SHOWN_TO_PLAYERS} if exchange else None,
        "log": battle_log(battle),
    }
