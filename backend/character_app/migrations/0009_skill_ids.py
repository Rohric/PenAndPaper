"""Give every stored skill a fixed id, so a change can tell which skill it concerns."""

from django.db import migrations


def number_skills(apps, schema_editor):
    """Number the skills of every NPC and player character from 1."""
    for name in ("Npc", "PlayerCharacter"):
        for character in apps.get_model("character_app", name).objects.all():
            skills = [{**skill, "id": number} for number, skill in enumerate(character.skills, start=1)]
            character.skills = skills
            character.save(update_fields=["skills"])


class Migration(migrations.Migration):
    dependencies = [("character_app", "0008_playercharacter_inspiration_used")]

    operations = [migrations.RunPython(number_skills, migrations.RunPython.noop)]
