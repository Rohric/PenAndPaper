"""Models for playing: a group that plays a world, and everything that happens while it plays.

The world itself stays untouched. What a session did with an entry of the world is stored here.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone

from character_app.models import PlayerCharacter
from world.world_app.models import Chapter, World


class Session(models.Model):
    """Store one group that plays a world over several evenings."""

    # The game master who runs the session.
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="game_sessions")
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="sessions")
    name = models.CharField(max_length=200)
    # The day the group started.
    date = models.DateField(default=timezone.localdate)
    characters = models.ManyToManyField(PlayerCharacter, blank=True, related_name="sessions")
    # The chapter the group is in.
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    finished = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        """Return the session's name for admin and shell."""
        return self.name


class SessionEntry(models.Model):
    """Store what a session did with one entry of the world.

    Whether it is done, started, shown to the players and how much of it, pinned, on the table of
    the master mode, changed for this session, what the group wrote down about it, and the note of the game master.
    """

    class Kind(models.TextChoices):
        """Name the kinds of world entries a session keeps a state for."""

        SCENE = "scene", "Szene"
        QUEST = "quest", "Quest"
        EVENT = "event", "Ereignis"
        LOCATION = "location", "Ort"
        NPC = "npc", "Figur"
        TRIVIA = "trivia", "Wissen"

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="entries")
    kind = models.CharField(max_length=10, choices=Kind.choices)
    # Id of the entry in the world; an NPC is named by the id of the character.
    entry_id = models.PositiveIntegerField()
    done = models.BooleanField(default=False)
    # Players see name and description of a revealed entry.
    revealed = models.BooleanField(default=False)
    pinned = models.BooleanField(default=False)
    # Positions of the checked steps of a quest's checklist.
    steps = models.JSONField(default=list, blank=True)
    # Positions of the pieces of player knowledge the group knows.
    known = models.JSONField(default=list, blank=True)
    # What this session has different about the entry than the world, like {"giver": 12, "location": 4} for a quest.
    changes = models.JSONField(default=dict, blank=True)
    # A quest the group has accepted and is working on. Open: neither started nor done. Finished: done.
    started = models.BooleanField(default=False)
    # Whether the entry lies on the table of the master mode, and in which group of the game master's own.
    on_table = models.BooleanField(default=False)
    table_group = models.CharField(max_length=60, blank=True)
    # What the players see of a revealed entry, piece by piece: "description", "goal", "giver", "location",
    # "trigger", "happening", and "step:0", "step:3" for single points of a quest's checklist.
    shown = models.JSONField(default=list, blank=True)
    # What the group itself adds to a quest: notes (text), tags (list of words), points (each: text, done)
    # and order (keys of all points in the order of the group: "g0" is a given point, "p0" one of its own).
    log = models.JSONField(default=dict, blank=True)
    # What the game master noted about the entry in this session; the players never see it.
    gm_note = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["session", "kind", "entry_id"], name="unique_entry_per_session"),
        ]

    def __str__(self):
        """Return kind and id of the entry for admin and shell."""
        return f"{self.get_kind_display()} {self.entry_id} in {self.session}"


class Note(models.Model):
    """Store a note of a session: personal for its author, or in the notepad of the group."""

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="session_notes")
    title = models.CharField(max_length=200)
    text = models.TextField(blank=True)
    # False: only the author sees it. True: it lies in the notepad of the group.
    shared = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        """Return the note's title for admin and shell."""
        return self.title


class Comment(models.Model):
    """Store a comment on a note in the notepad of the group."""

    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        """Return the beginning of the comment for admin and shell."""
        return self.text[:50]


class ChatMessage(models.Model):
    """Store one message in the chat of the whole group of a session."""

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="chat")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        """Return the beginning of the message for admin and shell."""
        return self.text[:50]


class Message(models.Model):
    """Store a secret message between the game master and one player character of a session."""

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="messages")
    character = models.ForeignKey(PlayerCharacter, on_delete=models.CASCADE, related_name="messages")
    # True: written by the game master. False: the answer of the player.
    from_gm = models.BooleanField(default=True)
    text = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        """Return the beginning of the message for admin and shell."""
        return self.text[:50]
