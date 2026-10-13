"""Admin registration for the world models."""

from django.contrib import admin

from .models import Chapter, Event, Location, Picture, Quest, Scene, Trivia, World, WorldNpc

admin.site.register([World, Location, WorldNpc, Quest, Event, Trivia, Chapter, Scene, Picture])
