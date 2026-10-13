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


class Entry(models.Model):
    """Hold what every entry of a world shares: what players may see and what only the game master knows."""

    name = models.CharField(max_length=200)
    # Players see name and description once a session revealed the entry.
    description = models.TextField(blank=True)
    # Each piece: title, text. A session reveals these pieces one by one.
    player_knowledge = models.JSONField(default=list, blank=True)
    # Each piece: title, text. Only the game master reads these.
    gm_knowledge = models.JSONField(default=list, blank=True)

    class Meta:
        abstract = True
        ordering = ["name"]

    def __str__(self):
        """Return the entry's name for admin and shell."""
        return self.name


class Location(Entry):
    """Store a place inside a world; places can lie inside other places."""

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="locations")
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children")


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


class Quest(Entry):
    """Store a quest of a world; players of a session see its description, goal and checklist."""

    class Kind(models.TextChoices):
        """Tell main quests and side quests apart."""

        MAIN = "main", "Hauptquest"
        SIDE = "side", "Nebenquest"

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="quests")
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="quests")
    giver = models.ForeignKey(Npc, on_delete=models.SET_NULL, null=True, blank=True, related_name="given_quests")
    # The scene in which the quest comes up; optional like the place and the giver.
    scene = models.ForeignKey("Scene", on_delete=models.SET_NULL, null=True, blank=True, related_name="started_quests")
    npcs = models.ManyToManyField(Npc, blank=True, related_name="quests")
    goal = models.TextField(blank=True)
    checklist = models.JSONField(default=list, blank=True)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.SIDE)
    # The number of a main quest; side quests have none.
    number = models.PositiveIntegerField(null=True, blank=True)


class Event(Entry):
    """Store something that can happen in a world, optionally at a place."""

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="events")
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")


class Trivia(Entry):
    """Store a piece of knowledge about a world, on its own or attached to other entries."""

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="trivia")
    # Free text, so the game master forms his own groups: "Tier", "Gegenstand", "Volk".
    category = models.CharField(max_length=100, blank=True)
    locations = models.ManyToManyField(Location, blank=True, related_name="trivia")
    npcs = models.ManyToManyField(Npc, blank=True, related_name="trivia")
    quests = models.ManyToManyField(Quest, blank=True, related_name="trivia")
    events = models.ManyToManyField(Event, blank=True, related_name="trivia")

    class Meta(Entry.Meta):
        verbose_name_plural = "trivia"


class Chapter(models.Model):
    """Store one chapter of a world's story; its scenes form the thread of the story."""

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
    """Store one scene of a chapter: numbered on the thread of the story, or optional beside it."""

    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="scenes")
    # The order on the thread of the chapter; there is no day and no date.
    position = models.PositiveIntegerField(default=0)
    # An optional scene has no place on the thread and can be used wherever it fits.
    optional = models.BooleanField(default=False)
    name = models.CharField(max_length=200)
    text = models.TextField(blank=True)
    to_read = models.TextField(blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="scenes")
    npcs = models.ManyToManyField(Npc, blank=True, related_name="scenes")
    # One-way: this scene can lead to the others; the way back is "comes_from".
    leads_to = models.ManyToManyField("self", symmetrical=False, blank=True, related_name="comes_from")
    quests = models.ManyToManyField(Quest, blank=True, related_name="scenes")
    events = models.ManyToManyField(Event, blank=True, related_name="scenes")
    trivia = models.ManyToManyField(Trivia, blank=True, related_name="scenes")

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        """Return the scene's name for admin and shell."""
        return self.name
