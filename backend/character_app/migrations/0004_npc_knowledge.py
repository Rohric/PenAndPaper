"""Give NPCs knowledge for players and for the game master.

The description written so far moves into the knowledge of the game master, so nothing becomes visible by accident.
"""

from django.db import migrations, models


def move_descriptions(apps, schema_editor):
    """Move the old description of every NPC into the knowledge of the game master."""
    Npc = apps.get_model("character_app", "Npc")
    for npc in Npc.objects.exclude(description=""):
        npc.gm_knowledge = [{"title": "", "text": npc.description}]
        npc.description = ""
        npc.save()


class Migration(migrations.Migration):

    dependencies = [
        ("character_app", "0003_player_character_special_abilities"),
    ]

    operations = [
        migrations.AddField("npc", "player_knowledge", models.JSONField(blank=True, default=list)),
        migrations.AddField("npc", "gm_knowledge", models.JSONField(blank=True, default=list)),
        migrations.RunPython(move_descriptions, migrations.RunPython.noop),
    ]
