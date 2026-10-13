"""Keep what the players see today, now that every part of an entry is shown one by one.

Until now a revealed entry showed its description, and a shared quest also its goal, its giver and
its whole checklist. A shared quest that is not done counts as started.
"""

from django.db import migrations

QUEST = "quest"


def parts_of(entry, checklists):
    """Return the parts the players saw of a revealed entry before parts could be shown one by one."""
    if entry.kind != QUEST:
        return ["description"]
    steps = len(checklists.get(entry.entry_id) or [])
    return ["description", "goal", "giver"] + [f"step:{position}" for position in range(steps)]


def keep_visible(apps, schema_editor):
    """Write into every revealed entry what the players see of it, and start the shared quests."""
    SessionEntry = apps.get_model("session_app", "SessionEntry")
    Quest = apps.get_model("world_app", "Quest")
    checklists = dict(Quest.objects.values_list("pk", "checklist"))
    for entry in SessionEntry.objects.filter(revealed=True):
        entry.shown = parts_of(entry, checklists)
        entry.started = entry.kind == QUEST and not entry.done
        entry.save(update_fields=["shown", "started"])


class Migration(migrations.Migration):
    dependencies = [
        ("session_app", "0003_started_table_shown_log"),
        ("world_app", "0007_event_trigger_and_happening"),
    ]

    operations = [migrations.RunPython(keep_visible, migrations.RunPython.noop)]
