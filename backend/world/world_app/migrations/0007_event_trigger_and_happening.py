"""Fill the new fields of the events from the knowledge of the game master.

Until now the trigger of an event and what happens were two knowledge pieces, told apart by their title.
"""

from django.db import migrations

TRIGGER_TITLES = ("Einsetzen, wenn", "Auslöser")
HAPPENING_TITLES = ("Was passiert",)


def text_of(pieces, titles):
    """Return the text of the first piece with one of the titles, or an empty text."""
    return next((piece["text"] for piece in pieces if piece.get("title") in titles), "")


def fill_fields(apps, schema_editor):
    """Move the two pieces of every event into its own fields."""
    Event = apps.get_model("world_app", "Event")
    for event in Event.objects.all():
        pieces = event.gm_knowledge
        event.trigger = text_of(pieces, TRIGGER_TITLES)
        event.happening = text_of(pieces, HAPPENING_TITLES)
        event.gm_knowledge = [piece for piece in pieces if piece.get("title") not in TRIGGER_TITLES + HAPPENING_TITLES]
        event.save(update_fields=["trigger", "happening", "gm_knowledge"])


def put_back(apps, schema_editor):
    """Write the two fields back as knowledge pieces, so the step can be undone."""
    Event = apps.get_model("world_app", "Event")
    for event in Event.objects.all():
        texts = {TRIGGER_TITLES[0]: event.trigger, HAPPENING_TITLES[0]: event.happening}
        pieces = [{"title": title, "text": text} for title, text in texts.items() if text]
        event.gm_knowledge = pieces + event.gm_knowledge
        event.save(update_fields=["gm_knowledge"])


class Migration(migrations.Migration):
    dependencies = [("world_app", "0006_event_fields_dialogues_symbols_pictures")]

    operations = [migrations.RunPython(fill_fields, put_back)]
