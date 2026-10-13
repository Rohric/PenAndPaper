"""Move name, text and dates into the base entry: chapters and scenes call their text a description.

Every entry also gets the choice to be visible for the players from the start of a session.
"""

from django.db import migrations, models

VISIBLE = ["location", "quest", "event", "trivia", "chapter", "scene"]


class Migration(migrations.Migration):
    dependencies = [("world_app", "0008_created_and_updated")]

    operations = [
        migrations.RenameField(model_name="chapter", old_name="text", new_name="description"),
        migrations.RenameField(model_name="scene", old_name="text", new_name="description"),
        *[
            migrations.AddField(model_name=model, name="visible_from_start", field=models.BooleanField(default=False))
            for model in VISIBLE
        ],
    ]
