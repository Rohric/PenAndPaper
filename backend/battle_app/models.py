"""Models for a fight: the battle a game master runs and the combatants in it."""

from django.conf import settings
from django.db import models

from character_app.models import START_LIFE_POINTS, Npc, PlayerCharacter
from session_app.models import Session


class Battle(models.Model):
    """Store one fight a game master runs: the round it is in and whose turn it is."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="battles")
    # A fight can belong to a session; then the characters of the session take part.
    session = models.ForeignKey(Session, on_delete=models.CASCADE, null=True, blank=True, related_name="battles")
    name = models.CharField(max_length=200)
    # Round 0 means the fight has not begun.
    round = models.PositiveIntegerField(default=0)
    # The combatant whose turn it is.
    current = models.ForeignKey("Combatant", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    finished = models.BooleanField(default=False)
    # An attack that is rolled but not closed yet: who attacks whom, the rolls so far and its stage.
    # It waits for the parry of the defender, then for the game master to close the turn.
    pending = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        """Return the battle's name for admin and shell."""
        return self.name


class Combatant(models.Model):
    """Store one participant of a battle with its initiative and its life points in this fight."""

    battle = models.ForeignKey(Battle, on_delete=models.CASCADE, related_name="combatants")
    # A combatant is an NPC, a player character, or just a name like "Goblin 2".
    npc = models.ForeignKey(Npc, on_delete=models.SET_NULL, null=True, blank=True, related_name="combatants")
    player_character = models.ForeignKey(
        PlayerCharacter, on_delete=models.SET_NULL, null=True, blank=True, related_name="combatants"
    )
    name = models.CharField(max_length=200)
    # Value of the talent Handeln, used for the initiative.
    action_value = models.PositiveIntegerField(default=0)
    # W10 plus action value; 0 means not rolled yet.
    initiative = models.PositiveIntegerField(default=0)
    # Life points in this fight; those of a player character are written onto the character with every change.
    life_points = models.IntegerField(default=START_LIFE_POINTS)
    # A surprised combatant sits out the first round.
    surprised = models.BooleanField(default=False)
    # A combatant can parry once per round.
    has_parried = models.BooleanField(default=False)

    class Meta:
        ordering = ["-initiative", "id"]

    def __str__(self):
        """Return the combatant's name for admin and shell."""
        return self.name
