"""Split the texts of world entries into what players may see and what only the game master knows.

The texts written so far move into the knowledge of the game master, so nothing becomes visible by accident.
"""

from django.db import migrations, models


def as_knowledge(text):
    """Return a text as a list with one knowledge piece, or an empty list."""
    return [{"title": "", "text": text}] if text.strip() else []


def move_texts(apps, schema_editor):
    """Move the old texts of places, knowledge and events, and the old goal of quests."""
    for model, field in [("Location", "lore"), ("Trivia", "text"), ("Event", "text"), ("Quest", "goal")]:
        for entry in apps.get_model("world_app", model).objects.all():
            entry.gm_knowledge = as_knowledge(getattr(entry, field))
            setattr(entry, field, "")
            entry.save()


def knowledge_fields(model):
    """Return the operations that give one model its two knowledge lists."""
    return [
        migrations.AddField(model, "player_knowledge", models.JSONField(blank=True, default=list)),
        migrations.AddField(model, "gm_knowledge", models.JSONField(blank=True, default=list)),
    ]


class Migration(migrations.Migration):

    dependencies = [
        ("world_app", "0002_trivia_scene_links_no_timeline"),
    ]

    operations = [
        migrations.AddField("location", "description", models.TextField(blank=True)),
        migrations.AddField("trivia", "description", models.TextField(blank=True)),
        migrations.AddField("event", "description", models.TextField(blank=True)),
        migrations.RenameField("quest", "text", "description"),
        *knowledge_fields("location"),
        *knowledge_fields("trivia"),
        *knowledge_fields("event"),
        *knowledge_fields("quest"),
        migrations.RunPython(move_texts, migrations.RunPython.noop),
        migrations.RemoveField("location", "lore"),
        migrations.RemoveField("trivia", "text"),
        migrations.RemoveField("event", "text"),
    ]
