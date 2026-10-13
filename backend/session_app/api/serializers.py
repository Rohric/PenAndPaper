"""Serializers for sessions and everything that happens while a group plays."""

import re

from rest_framework import serializers

from character_app.models import PlayerCharacter
from character_app.utils import MAX_DAMAGE_DICE
from session_app.models import Comment, Message, Note, Session, SessionEntry
from session_app.utils import characters_in_other_sessions

MAX_AMOUNT = 9999
MAX_CHECK_VALUE = 300
# What a session may have different about a quest, and the type of each value. None takes a link away.
QUEST_CHANGES = {"name": str, "goal": str, "giver": int, "location": int, "scene": int}
# What can be shown to the players piece by piece: a part of the entry, or one point of a checklist.
SHOWN_PART = re.compile(r"^(description|goal|giver|location|trigger|happening|step:\d+)$")
# The key of a point in the order of the group: a given point by its position, or a point of its own.
POINT_KEY = re.compile(r"^[gp]\d+$")
MAX_TAGS = 20


def _texts(values, pattern=None):
    """Return a list of trimmed, different texts; with a pattern every text has to match it."""
    if not isinstance(values, list) or not all(isinstance(value, str) for value in values):
        raise serializers.ValidationError("Hier wird eine Liste von Texten erwartet.")
    cleaned = list(dict.fromkeys(value.strip() for value in values if value.strip()))
    if pattern and not all(pattern.match(value) for value in cleaned):
        raise serializers.ValidationError("Einer der Einträge ist nicht bekannt.")
    return cleaned


def _clean_point(point):
    """Return one point the group added to a checklist: its text and whether it is done."""
    text = point.get("text") if isinstance(point, dict) else None
    if not isinstance(text, str):
        raise serializers.ValidationError("Jeder eigene Punkt braucht einen Text.")
    return {"text": text.strip(), "done": point.get("done") is True}


def clean_log(log):
    """Return what a group wrote about a quest: notes, tags, points of its own and the order of all points."""
    if not isinstance(log, dict) or not isinstance(log.get("notes", ""), str):
        raise serializers.ValidationError("Das Questlog braucht Notizen, Tags, Punkte und eine Reihenfolge.")
    points = log.get("points", [])
    if not isinstance(points, list):
        raise serializers.ValidationError("Die eigenen Punkte müssen eine Liste sein.")
    return {
        "notes": log.get("notes", "").strip(), "tags": _texts(log.get("tags", []))[:MAX_TAGS],
        "points": [_clean_point(point) for point in points], "order": _texts(log.get("order", []), POINT_KEY),
    }


class SessionSerializer(serializers.ModelSerializer):
    """Serialize a session with its world, its characters and the chapter the group is in."""

    world_name = serializers.CharField(source="world.name", read_only=True)

    class Meta:
        model = Session
        fields = ["id", "name", "date", "world", "world_name", "characters", "chapter", "finished"]

    def validate_world(self, world):
        """Accept only a world the requesting game master owns."""
        if world.owner_id != self.context["request"].user.pk:
            raise serializers.ValidationError("Diese Welt gehört dir nicht.")
        return world

    def validate_characters(self, characters):
        """Reject new characters that already play in another adventure; those already in the group stay."""
        members = self.instance.characters.all() if self.instance else []
        taken = characters_in_other_sessions([c for c in characters if c not in members], self.instance)
        if taken:
            names = ", ".join(character.name for character in taken)
            raise serializers.ValidationError(f"Spielt schon in einem anderen laufenden Abenteuer: {names}.")
        return characters

    def validate(self, data):
        """Check that the chapter belongs to the world of the session."""
        world = data.get("world", getattr(self.instance, "world", None))
        chapter = data.get("chapter")
        if chapter and chapter.world_id != world.pk:
            raise serializers.ValidationError("Dieses Kapitel gehört zu einer anderen Welt.")
        return data


class SessionEntrySerializer(serializers.ModelSerializer):
    """Serialize what a session did with one entry of the world."""

    class Meta:
        model = SessionEntry
        fields = [
            "id", "kind", "entry_id", "done", "started", "revealed", "shown", "pinned", "on_table", "table_group",
            "steps", "known", "changes", "log",
        ]
        read_only_fields = ["kind", "entry_id"]

    def _positions(self, value):
        """Accept a list of positions: whole numbers from 0."""
        if not isinstance(value, list) or not all(isinstance(item, int) and item >= 0 for item in value):
            raise serializers.ValidationError("Hier wird eine Liste von Positionen erwartet.")
        return sorted(set(value))

    def validate_steps(self, steps):
        """Check the positions of the checked quest steps."""
        return self._positions(steps)

    def validate_known(self, known):
        """Check the positions of the known pieces of player knowledge."""
        return self._positions(known)

    def validate_shown(self, shown):
        """Check what the players see of the entry piece by piece."""
        return _texts(shown, SHOWN_PART)

    def validate_log(self, log):
        """Check what the group wrote about the quest."""
        return clean_log(log)

    def validate_changes(self, changes):
        """Accept what a session may have different about a quest: name, goal, giver, place and scene."""
        fits = isinstance(changes, dict) and all(
            key in QUEST_CHANGES and (value is None or isinstance(value, QUEST_CHANGES[key]))
            for key, value in changes.items()
        )
        if not fits:
            raise serializers.ValidationError("Erlaubt sind name, goal, giver, location und scene.")
        return changes


class QuestLogSerializer(serializers.ModelSerializer):
    """Serialize what the players of a session may change about a shared quest: its log and its checked points.

    A player can only check the points of the game master that are shown to the group.
    """

    class Meta:
        model = SessionEntry
        fields = ["steps", "log"]

    def validate_log(self, log):
        """Check what the group wrote about the quest."""
        return clean_log(log)

    def validate_steps(self, steps):
        """Take over the checks of the shown points; the checks of hidden points stay as they are."""
        if not isinstance(steps, list) or not all(isinstance(step, int) for step in steps):
            raise serializers.ValidationError("Hier wird eine Liste von Positionen erwartet.")
        visible = {int(part.split(":")[1]) for part in self.instance.shown if part.startswith("step:")}
        return sorted((set(steps) & visible) | (set(self.instance.steps) - visible))


class CommentSerializer(serializers.ModelSerializer):
    """Serialize a comment with the name of its author."""

    author = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "text", "created_at"]


class NoteSerializer(serializers.ModelSerializer):
    """Serialize a note with its comments; "mine" tells the reader whether it is his own."""

    author = serializers.CharField(source="author.username", read_only=True)
    mine = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = ["id", "title", "text", "shared", "author", "mine", "comments", "created_at"]

    def get_mine(self, note):
        """Return True when the requesting user wrote the note."""
        return note.author_id == self.context["request"].user.pk


class MessageSerializer(serializers.ModelSerializer):
    """Serialize a secret message; who wrote it is set by the server."""

    class Meta:
        model = Message
        fields = ["id", "character", "from_gm", "text", "read", "created_at"]
        read_only_fields = ["from_gm", "read"]


class RollSerializer(serializers.Serializer):
    """Read a roll: a check against a value, or free dice when no value is given.

    A player rolls for the own character. The game master names whoever the roll is for and may keep it secret.
    """

    character = serializers.PrimaryKeyRelatedField(queryset=PlayerCharacter.objects.all(), required=False, allow_null=True)
    who = serializers.CharField(max_length=200, allow_blank=True, default="")
    label = serializers.CharField(max_length=200, allow_blank=True, default="")
    value = serializers.IntegerField(min_value=0, max_value=MAX_CHECK_VALUE, allow_null=True, default=None)
    sides = serializers.ChoiceField(choices=[10, 100], default=100)
    count = serializers.IntegerField(min_value=1, max_value=10, default=1)
    secret = serializers.BooleanField(default=False)


class ItemSerializer(serializers.Serializer):
    """Read an item the game master hands to a character."""

    character = serializers.PrimaryKeyRelatedField(queryset=PlayerCharacter.objects.all())
    name = serializers.CharField(max_length=200)
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_AMOUNT, default=1)
    damage_dice = serializers.IntegerField(min_value=0, max_value=MAX_DAMAGE_DICE, default=0)
    damage_bonus = serializers.IntegerField(min_value=0, max_value=MAX_AMOUNT, default=0)
    description = serializers.CharField(allow_blank=True, default="")
    # Id of the world item it comes from, and whether the rest of the group does not see it.
    item = serializers.IntegerField(min_value=1, allow_null=True, default=None)
    hidden = serializers.BooleanField(default=False)


class LevelSerializer(serializers.Serializer):
    """Read the bonus points for a closed chapter: one number per character id."""

    bonus_points = serializers.DictField(
        child=serializers.IntegerField(min_value=0, max_value=MAX_AMOUNT), required=False, default=dict
    )
