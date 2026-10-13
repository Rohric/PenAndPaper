"""Abstract base for everything that is written for a world."""

from django.db import models


class BaseEntry(models.Model):
    """Hold what everything written for a world has: a name, a text, its dates and whether players see it from the start."""

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    # Whether a new session shows it to its players right away; a running session keeps its own state.
    visible_from_start = models.BooleanField(default=False)
    # When it was written and when it was changed last; Django fills both.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
