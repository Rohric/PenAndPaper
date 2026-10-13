"""Add the time an entry was written and the time it was changed last.

Everything that exists already gets the time of this migration as its start.
"""

import django.utils.timezone
from django.db import migrations, models

STAMPED = ["npc", "playercharacter"]


def stamps(model):
    """Return the two operations that give one model its time fields."""
    created = models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now)
    return [
        migrations.AddField(model_name=model, name="created_at", field=created, preserve_default=False),
        migrations.AddField(model_name=model, name="updated_at", field=models.DateTimeField(auto_now=True)),
    ]


class Migration(migrations.Migration):
    dependencies = [("character_app", "0006_symbol_and_image")]

    operations = [operation for model in STAMPED for operation in stamps(model)]
