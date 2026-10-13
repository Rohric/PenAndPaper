"""Check the knowledge lists every entry of a world carries: pieces with a title and a text."""

from rest_framework import serializers


def _clean_piece(piece):
    """Return one knowledge piece with trimmed title and text, or raise when it is malformed."""
    if not isinstance(piece, dict):
        raise serializers.ValidationError("Jedes Stück Wissen braucht einen Text.")
    title, text = piece.get("title", ""), piece.get("text", "")
    if not isinstance(title, str) or not isinstance(text, str):
        raise serializers.ValidationError("Titel und Text eines Stücks Wissen müssen Texte sein.")
    return {"title": title.strip(), "text": text.strip()}


def clean_knowledge(pieces):
    """Return the list of knowledge pieces; pieces without a text are dropped."""
    if not isinstance(pieces, list):
        raise serializers.ValidationError("Hier wird eine Liste erwartet.")
    return [piece for piece in map(_clean_piece, pieces) if piece["text"]]
