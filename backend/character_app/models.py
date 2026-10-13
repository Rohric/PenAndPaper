"""Models for characters: a shared template, the NPCs of a game master and the characters of the players."""

from django.conf import settings
from django.db import models

START_LIFE_POINTS = 100
START_SKILL_POINTS = 400


class BaseCharacter(models.Model):
    """Hold the fields every character shares; it creates no table of its own."""

    class Talent(models.TextChoices):
        """List the three talents of the rule set."""

        ACTION = "action", "Handeln"
        KNOWLEDGE = "knowledge", "Wissen"
        SOCIAL = "social", "Soziales"

    name = models.CharField(max_length=200)
    age = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=100, blank=True)
    profession = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    # The life points right now, and the most the character can have.
    life_points = models.PositiveIntegerField(default=START_LIFE_POINTS)
    max_life_points = models.PositiveIntegerField(default=START_LIFE_POINTS)
    # Two budgets: base points from character creation, bonus points from leveling.
    skill_points_total = models.PositiveIntegerField(default=START_SKILL_POINTS)
    bonus_points_total = models.PositiveIntegerField(default=0)
    # Each skill: name, talent, points, bonus_points, description.
    skills = models.JSONField(default=list, blank=True)
    # Each item: name, quantity, damage_dice, damage_bonus, description. Optional: item (id of the
    # world item it comes from) and hidden (then only its owner and the game master see it).
    inventory = models.JSONField(default=list, blank=True)
    # Each special ability: name, description, roll_condition.
    special_abilities = models.JSONField(default=list, blank=True)
    # Name of the symbol shown for the character; empty means the usual symbol.
    symbol = models.CharField(max_length=40, blank=True)
    # A picture of the character, and whether it is shown instead of the symbol.
    image = models.ImageField(upload_to="characters/", blank=True)
    shows_image = models.BooleanField(default=False)
    # When it was written and when it was changed last; Django fills both.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def __str__(self):
        """Return the character's name for admin and shell."""
        return self.name


class Npc(BaseCharacter):
    """Store a character the game master writes and plays."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="npcs")
    phrases = models.JSONField(default=list, blank=True)
    # Players see name and description once a session revealed the NPC.
    # Each knowledge piece: title, text. A session reveals the pieces for players one by one.
    player_knowledge = models.JSONField(default=list, blank=True)
    # Only the game master reads these pieces.
    gm_knowledge = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["name"]


class PlayerCharacter(BaseCharacter):
    """Store a character a player creates and plays."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="player_characters")
    backstory = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]
