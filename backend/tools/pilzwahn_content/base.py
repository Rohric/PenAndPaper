"""Small helpers that keep the content files short and readable."""


def K(*pairs):
    """Return knowledge pieces from (title, text) pairs."""
    return [{"title": title, "text": text} for title, text in pairs]


def P(*pairs):
    """Return NPC phrases from (trigger, text) pairs."""
    return [{"trigger": trigger, "text": text} for trigger, text in pairs]


def D(title, *lines):
    """Return one dialogue; each line is (speaker name or None, text)."""
    return {"title": title, "lines": [{"npc": speaker, "text": text} for speaker, text in lines]}


def S(name, talent, points, description=""):
    """Return one skill of How to be a Hero."""
    return {"name": name, "talent": talent, "points": points, "bonus_points": 0, "description": description}


def I(name, dice=0, bonus=0, description="", quantity=1):
    """Return one inventory item; damage is counted in W10 plus a bonus."""
    return {"name": name, "quantity": quantity, "damage_dice": dice, "damage_bonus": bonus, "description": description}


def A(name, description, roll_condition=""):
    """Return one special ability."""
    return {"name": name, "description": description, "roll_condition": roll_condition}


ACT, KNOW, SOC = "action", "knowledge", "social"
