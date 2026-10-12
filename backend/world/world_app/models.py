"""Models for the world the game master writes and the players experience."""

from django.conf import settings
from django.db import models

from character_app.models import Npc


class World(models.Model):
    """Store a world, which is one adventure the game master writes."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="worlds")
    name = models.CharField(max_length=200)
    lore = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        """Return the world's name for admin and shell."""
        return self.name


class Location(models.Model):
    """Store a place inside a world; places can lie inside other places."""

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="locations")
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children")
    name = models.CharField(max_length=200)
    lore = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        """Return the location's name for admin and shell."""
        return self.name


class WorldNpc(models.Model):
    """Attach an NPC to its world and to the place where the players can meet it."""

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="world_npcs")
    # One-to-one: an NPC belongs to exactly one world.
    npc = models.OneToOneField(Npc, on_delete=models.CASCADE, related_name="world_link")
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="world_npcs")

    class Meta:
        ordering = ["npc__name"]

    def __str__(self):
        """Return the NPC together with its world for admin and shell."""
        return f"{self.npc} in {self.world}"


class Quest(models.Model):
    """Store a quest of a world with its checklist."""

    class Kind(models.TextChoices):
        """Tell main quests and side quests apart."""

        MAIN = "main", "Hauptquest"
        SIDE = "side", "Nebenquest"

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="quests")
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="quests")
    giver = models.ForeignKey(Npc, on_delete=models.SET_NULL, null=True, blank=True, related_name="given_quests")
    npcs = models.ManyToManyField(Npc, blank=True, related_name="quests")
    name = models.CharField(max_length=200)
    text = models.TextField(blank=True)
    goal = models.TextField(blank=True)
    checklist = models.JSONField(default=list, blank=True)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.SIDE)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        """Return the quest's name for admin and shell."""
        return self.name


class Event(models.Model):
    """Store something that can happen in a world, optionally at a place."""

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="events")
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    name = models.CharField(max_length=200)
    text = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        """Return the event's name for admin and shell."""
        return self.name


class TimelineEntry(models.Model):
    """Store one day on the timeline of a world."""

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="timeline_entries")
    day = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=200)
    text = models.TextField(blank=True)

    class Meta:
        ordering = ["day", "id"]

    def __str__(self):
        """Return day and title for admin and shell."""
        return f"Tag {self.day}: {self.title}"


class Chapter(models.Model):
    """Store one chapter of a world's story."""

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="chapters")
    number = models.PositiveIntegerField()
    name = models.CharField(max_length=200)
    text = models.TextField(blank=True)
    to_read = models.TextField(blank=True)
    quests = models.ManyToManyField(Quest, blank=True, related_name="chapters")
    events = models.ManyToManyField(Event, blank=True, related_name="chapters")

    class Meta:
        ordering = ["number"]
        constraints = [
            models.UniqueConstraint(fields=["world", "number"], name="unique_chapter_number_per_world"),
        ]

    def __str__(self):
        """Return number and name for admin and shell."""
        return f"Kapitel {self.number}: {self.name}"


class Scene(models.Model):
    """Store one scene of a chapter; scenes happen in any order or not at all."""

    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="scenes")
    # Only the order in which the scenes are listed, not the order in which they are played.
    position = models.PositiveIntegerField(default=0)
    name = models.CharField(max_length=200)
    text = models.TextField(blank=True)
    to_read = models.TextField(blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="scenes")
    npcs = models.ManyToManyField(Npc, blank=True, related_name="scenes")

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        """Return the scene's name for admin and shell."""
        return self.name
