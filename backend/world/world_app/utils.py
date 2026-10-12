"""Query helpers for worlds: ownership filters and collections across relations."""

from django.db import transaction
from django.db.models import Max
from django.shortcuts import get_object_or_404

from character_app.models import Npc
from world.world_app.models import Chapter, Location, World, WorldNpc


def worlds_for_user(user):
    """Return the worlds the given game master owns."""
    return World.objects.filter(owner=user)


def world_for_user(user, world_id):
    """Return the user's world with the given id or raise a 404."""
    return get_object_or_404(worlds_for_user(user), pk=world_id)


def chapter_for_user(user, chapter_id):
    """Return the chapter with the given id from one of the user's worlds or raise a 404."""
    return get_object_or_404(Chapter.objects.filter(world__owner=user), pk=chapter_id)


def npcs_in_world(world):
    """Return all NPCs that are attached to the given world."""
    return Npc.objects.filter(world_link__world=world)


def npcs_in_chapter(chapter):
    """Return all NPCs that appear in the scenes of the given chapter."""
    return Npc.objects.filter(scenes__chapter=chapter).distinct()


def locations_in_chapter(chapter):
    """Return all locations where scenes of the given chapter take place."""
    return Location.objects.filter(scenes__chapter=chapter).distinct()


def lies_inside(location, other):
    """Return True when the location is the other one or lies somewhere inside it."""
    seen = set()
    while location is not None and location.pk not in seen:
        if location.pk == other.pk:
            return True
        seen.add(location.pk)
        location = location.parent
    return False


def next_chapter_number(world):
    """Return the number a new chapter of the given world gets by default."""
    highest = world.chapters.aggregate(highest=Max("number"))["highest"]
    return (highest or 0) + 1


@transaction.atomic
def create_world_npc(world, name, location=None):
    """Create an NPC and attach it to the world in one step."""
    npc = Npc.objects.create(owner=world.owner, name=name)
    return WorldNpc.objects.create(world=world, npc=npc, location=location)
