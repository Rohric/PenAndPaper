"""Give every character a maximum of life points next to its current life points."""

from django.db import migrations, models

START_LIFE_POINTS = 100


def set_maximum(apps, schema_editor):
    """Start the maximum at the current life points, but not below a fresh character's life points."""
    for model in ("Npc", "PlayerCharacter"):
        for character in apps.get_model("character_app", model).objects.all():
            character.max_life_points = max(character.life_points, START_LIFE_POINTS)
            character.save(update_fields=["max_life_points"])


class Migration(migrations.Migration):

    dependencies = [
        ("character_app", "0004_npc_knowledge"),
    ]

    operations = [
        migrations.AddField("npc", "max_life_points", models.PositiveIntegerField(default=START_LIFE_POINTS)),
        migrations.AddField("playercharacter", "max_life_points", models.PositiveIntegerField(default=START_LIFE_POINTS)),
        migrations.RunPython(set_maximum, migrations.RunPython.noop),
    ]
