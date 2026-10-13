"""Let a character be visible for the players from the start of a session."""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("character_app", "0009_skill_ids")]

    operations = [
        migrations.AddField(model_name=model, name="visible_from_start", field=models.BooleanField(default=False))
        for model in ["npc", "playercharacter"]
    ]
