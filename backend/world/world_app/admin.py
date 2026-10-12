"""Admin registration for the world models."""

from django.contrib import admin

from .models import Chapter, Event, Location, Quest, Scene, TimelineEntry, World, WorldNpc

admin.site.register([World, Location, WorldNpc, Quest, Event, TimelineEntry, Chapter, Scene])
