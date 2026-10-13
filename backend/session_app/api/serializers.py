"""Serializers for sessions and everything that happens while a group plays."""

from rest_framework import serializers

from character_app.models import PlayerCharacter
from character_app.utils import MAX_DAMAGE_DICE
from session_app.models import Comment, Message, Note, Session, SessionEntry
from session_app.utils import characters_in_other_sessions

MAX_AMOUNT = 9999
MAX_CHECK_VALUE = 300
# What a session may have different about a quest, and the type of each value. None takes a link away.
QUEST_CHANGES = {"name": str, "goal": str, "giver": int, "location": int, "scene": int}


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
        """Reject characters that already play in another running session."""
        taken = characters_in_other_sessions(characters, self.instance)
        if taken:
            names = ", ".join(character.name for character in taken)
            raise serializers.ValidationError(f"Schon in einer anderen laufenden Runde: {names}.")
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
        fields = ["id", "kind", "entry_id", "done", "revealed", "pinned", "steps", "known", "changes"]
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

    def validate_changes(self, changes):
        """Accept what a session may have different about a quest: name, goal, giver, place and scene."""
        fits = isinstance(changes, dict) and all(
            key in QUEST_CHANGES and (value is None or isinstance(value, QUEST_CHANGES[key]))
            for key, value in changes.items()
        )
        if not fits:
            raise serializers.ValidationError("Erlaubt sind name, goal, giver, location und scene.")
        return changes


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
