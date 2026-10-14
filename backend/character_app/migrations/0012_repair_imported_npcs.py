"""Repair NPCs that were imported with a missing owner and with their lists wrapped in an object.

Some NPCs of an imported world belong to a user that does not exist, and their lists look like
{"skills": [...]} instead of [...]. SQLite refuses to rebuild the table while an owner is missing,
so this runs before the next change of the NPCs. NPCs that are already right stay as they are.
"""

from django.conf import settings
from django.db import migrations

LISTS = ["skills", "inventory", "special_abilities", "phrases"]
KNOWLEDGE = ["player_knowledge", "gm_knowledge"]


def unwrap_list(value):
    """Return the list inside a wrapping object, or an empty list when there is none."""
    if isinstance(value, list):
        return value
    inner = list(value.values()) if isinstance(value, dict) else []
    return next((item for item in inner if isinstance(item, list)), [])


def unwrap_knowledge(value):
    """Return knowledge as a list of pieces; a wrapped text becomes one piece without a title."""
    if isinstance(value, list):
        return value
    texts = [item.strip() for item in value.values() if isinstance(item, str)] if isinstance(value, dict) else []
    pieces = [{"title": "", "text": text} for text in texts if text]
    return pieces or unwrap_list(value)


def repair_npc(npc, owners):
    """Give an NPC the owner of its world when its own is missing, and unwrap its lists."""
    if npc.owner_id not in owners and hasattr(npc, "world_link"):
        npc.owner_id = npc.world_link.world.owner_id
    for field in LISTS:
        setattr(npc, field, unwrap_list(getattr(npc, field)))
    for field in KNOWLEDGE:
        setattr(npc, field, unwrap_knowledge(getattr(npc, field)))
    npc.save()


def repair_npcs(apps, schema_editor):
    """Repair every NPC whose owner is missing or whose lists are wrapped."""
    Npc = apps.get_model("character_app", "Npc")
    User = apps.get_model(settings.AUTH_USER_MODEL)
    owners = set(User.objects.values_list("pk", flat=True))
    for npc in Npc.objects.select_related("world_link__world"):
        wrapped = any(not isinstance(getattr(npc, field), list) for field in LISTS + KNOWLEDGE)
        if wrapped or npc.owner_id not in owners:
            repair_npc(npc, owners)


class Migration(migrations.Migration):
    dependencies = [
        ("character_app", "0011_second_bar"),
        ("world_app", "0013_event_npcs_and_leads_to"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [migrations.RunPython(repair_npcs, migrations.RunPython.noop)]
