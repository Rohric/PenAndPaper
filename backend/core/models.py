"""Abstract base for everything that is written for a world."""

from django.db import models


class BaseEntry(models.Model):
    """Hold what everything written for a world has.

    A name, a text, a category, the game master's own note, its dates and whether players see it from the start.
    """

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    # Free text, so the game master forms his own groups to sort and filter by: "Tier", "Gegenstand", "Volk".
    category = models.CharField(max_length=100, blank=True)
    # The game master's own note on the entry ("Notiz (nur für dich)"); players never receive it.
    note = models.TextField(blank=True)
    # Whether a new session shows it to its players right away; a running session keeps its own state.
    visible_from_start = models.BooleanField(default=False)
    # When it was written and when it was changed last; Django fills both.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
