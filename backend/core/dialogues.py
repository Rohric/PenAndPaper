"""Check the dialogues a scene, a quest or an event carries: titled lists of lines, each with an optional speaker."""

from rest_framework import serializers

MALFORMED = "Ein Gespräch braucht Zeilen mit Text; wer spricht, ist freiwillig."


def _clean_line(line):
    """Return one line with the id of its speaker (or None) and its trimmed text, or raise when it is malformed."""
    if not isinstance(line, dict) or not isinstance(line.get("text", ""), str):
        raise serializers.ValidationError(MALFORMED)
    npc = line.get("npc")
    if npc is not None and (isinstance(npc, bool) or not isinstance(npc, int)):
        raise serializers.ValidationError(MALFORMED)
    return {"npc": npc, "text": line.get("text", "").strip()}


def _clean_dialogue(dialogue):
    """Return one dialogue with its title and its lines; lines without a text are dropped."""
    if not isinstance(dialogue, dict) or not isinstance(dialogue.get("lines", []), list):
        raise serializers.ValidationError(MALFORMED)
    title = dialogue.get("title", "")
    if not isinstance(title, str):
        raise serializers.ValidationError(MALFORMED)
    lines = [_clean_line(line) for line in dialogue.get("lines", [])]
    return {"title": title.strip(), "lines": [line for line in lines if line["text"]]}


def clean_dialogues(dialogues):
    """Return the list of dialogues; dialogues without a line are dropped."""
    if not isinstance(dialogues, list):
        raise serializers.ValidationError("Hier wird eine Liste erwartet.")
    return [dialogue for dialogue in map(_clean_dialogue, dialogues) if dialogue["lines"]]


def speakers(dialogues):
    """Return the ids of all characters that speak in the given dialogues."""
    return {line["npc"] for dialogue in dialogues for line in dialogue["lines"] if line["npc"] is not None}
