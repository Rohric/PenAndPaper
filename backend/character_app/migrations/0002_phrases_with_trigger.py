"""Give every example phrase of an NPC an optional trigger."""

from django.db import migrations


def add_triggers(apps, schema_editor):
    """Turn plain phrase texts into entries with trigger and text."""
    Npc = apps.get_model("character_app", "Npc")
    for npc in Npc.objects.exclude(phrases=[]):
        npc.phrases = [
            phrase if isinstance(phrase, dict) else {"trigger": "", "text": phrase} for phrase in npc.phrases
        ]
        npc.save(update_fields=["phrases"])


class Migration(migrations.Migration):

    dependencies = [
        ("character_app", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_triggers, migrations.RunPython.noop),
    ]
