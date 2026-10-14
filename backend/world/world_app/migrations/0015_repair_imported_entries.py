"""Repair entries that were imported with their lists and texts wrapped in an object.

Some places, events and scenes of an imported world hold {"known": "..."} where a list of knowledge
belongs, {"dialogues": []} where a list belongs, and texts like '{"trigger":"Start"}'. Here they get
their plain form; entries that are already right stay as they are.
"""

import json

from django.db import migrations

# The lists of every kind of entry, and which of them hold knowledge.
LISTS = {
    "Location": ["player_knowledge", "gm_knowledge"],
    "Quest": ["player_knowledge", "gm_knowledge", "checklist", "dialogues"],
    "Event": ["player_knowledge", "gm_knowledge", "dialogues"],
    "Trivia": ["player_knowledge", "gm_knowledge"],
    "Scene": ["dialogues"],
}
KNOWLEDGE = ["player_knowledge", "gm_knowledge"]
TEXTS = {"Event": ["trigger", "happening"]}


def unwrap_list(value):
    """Return the list inside a wrapping object, or an empty list when there is none."""
    if isinstance(value, list):
        return value
    inner = list(value.values()) if isinstance(value, dict) else []
    return next((item for item in inner if isinstance(item, list)), [])


def unwrap_knowledge(value):
    """Return knowledge as a list of pieces; a wrapped text becomes one piece without a title."""
    if isinstance(value, list):
        return value
    texts = [item.strip() for item in value.values() if isinstance(item, str)] if isinstance(value, dict) else []
    pieces = [{"title": "", "text": text} for text in texts if text]
    return pieces or unwrap_list(value)


def unwrap_text(text):
    """Return the plain text of a text that holds a wrapping object; any other text stays as it is."""
    try:
        wrapped = json.loads(text) if text.startswith("{") else None
    except ValueError:
        return text
    if not isinstance(wrapped, dict):
        return text
    parts = [item for value in wrapped.values() for item in (value if isinstance(value, list) else [value])]
    return "\n".join(str(part) for part in parts if part)


def repaired(entry, model_name):
    """Unwrap the lists and texts of one entry and return whether anything changed."""
    before = {field: getattr(entry, field) for field in LISTS[model_name] + TEXTS.get(model_name, [])}
    for field in LISTS[model_name]:
        unwrap = unwrap_knowledge if field in KNOWLEDGE else unwrap_list
        setattr(entry, field, unwrap(getattr(entry, field)))
    for field in TEXTS.get(model_name, []):
        setattr(entry, field, unwrap_text(getattr(entry, field)))
    return any(getattr(entry, field) != value for field, value in before.items())


def repair_entries(apps, schema_editor):
    """Repair every entry of every kind whose lists or texts are wrapped."""
    for model_name, fields in LISTS.items():
        model = apps.get_model("world_app", model_name)
        for entry in model.objects.all():
            if repaired(entry, model_name):
                entry.save(update_fields=fields + TEXTS.get(model_name, []))


class Migration(migrations.Migration):
    dependencies = [("world_app", "0014_category_note_and_session_entries")]

    operations = [migrations.RunPython(repair_entries, migrations.RunPython.noop)]
