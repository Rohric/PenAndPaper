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
    life_points = models.PositiveIntegerField(default=START_LIFE_POINTS)
    # Two budgets: base points from character creation, bonus points from leveling.
    skill_points_total = models.PositiveIntegerField(default=START_SKILL_POINTS)
    bonus_points_total = models.PositiveIntegerField(default=0)
    # Each skill: name, talent, points, bonus_points, description.
    skills = models.JSONField(default=list, blank=True)
    # Each item: name, quantity, damage_dice, damage_bonus, description.
    inventory = models.JSONField(default=list, blank=True)
    # Each special ability: name, description, roll_condition.
    special_abilities = models.JSONField(default=list, blank=True)

    class Meta:
        abstract = True

    def __str__(self):
        """Return the character's name for admin and shell."""
        return self.name


class Npc(BaseCharacter):
    """Store a character the game master writes and plays."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="npcs")
    phrases = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["name"]


class PlayerCharacter(BaseCharacter):
    """Store a character a player creates and plays."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="player_characters")
    backstory = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]
