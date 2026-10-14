"""Query helpers for worlds: ownership filters, collections across relations and what a session made up."""

from django.db import transaction
from django.db.models import Max, Q
from django.http import Http404
from django.shortcuts import get_object_or_404

from character_app.models import Npc
from session_app.models import Session
from world.world_app.models import Chapter, Location, Picture, World, WorldNpc

# How many pictures a place or an item can have.
MAX_PICTURES = 3


def worlds_for_user(user):
    """Return the worlds the given game master owns."""
    return World.objects.filter(owner=user)


def world_for_user(user, world_id):
    """Return the user's world with the given id or raise a 404."""
    return get_object_or_404(worlds_for_user(user), pk=world_id)


def chapter_for_user(user, chapter_id):
    """Return the chapter with the given id from one of the user's worlds or raise a 404."""
    return get_object_or_404(Chapter.objects.filter(world__owner=user), pk=chapter_id)


def session_scope(user, session_id, world=None):
    """Return the game master's session named by "?session=", or None when none is named.

    Raise a 404 when the session is not his or, with a world given, when it plays another world.
    """
    if not session_id:
        return None
    if not str(session_id).isdigit():
        raise Http404
    sessions = Session.objects.filter(owner=user)
    if world is not None:
        sessions = sessions.filter(world=world)
    return get_object_or_404(sessions, pk=session_id)


def in_scope(entries, session=None, path="session"):
    """Return the entries of the world itself and, with a session, also the ones made up in that session.

    The path leads from an entry to its session, like "world_link__session" for NPCs. A session is
    named by itself or by its id; entries of every other session always stay out.
    """
    world_only = Q(**{f"{path}__isnull": True})
    return entries.filter((world_only | Q(**{path: session})) if session else world_only)


def pictures_for_user(user):
    """Return the pictures of places and items in the worlds the given game master owns."""
    return Picture.objects.filter(Q(location__world__owner=user) | Q(trivia__world__owner=user))


def npcs_in_world(world, session=None):
    """Return the NPCs of the given world and, with a session, also the ones made up in that session."""
    return in_scope(Npc.objects.filter(world_link__world=world), session, "world_link__session")


def npcs_in_chapter(chapter):
    """Return all NPCs that appear in the scenes of the given chapter; scenes made up in a session do not count."""
    return Npc.objects.filter(scenes__chapter=chapter, scenes__session__isnull=True).distinct()


def locations_in_chapter(chapter):
    """Return all locations where scenes of the given chapter take place; scenes made up in a session do not count."""
    return Location.objects.filter(scenes__chapter=chapter, scenes__session__isnull=True).distinct()


def lies_inside(location, other):
    """Return True when the location is the other one or lies somewhere inside it."""
    seen = set()
    while location is not None and location.pk not in seen:
        if location.pk == other.pk:
            return True
        seen.add(location.pk)
        location = location.parent
    return False


def tag_chapter(scene):
    """Tag everything that hangs on the scene with the chapter of the scene.

    A scene made up in a session tags nothing: playing never changes the chapters of the world.
    """
    if scene.session_id:
        return
    chapter = scene.chapter
    if scene.location_id:
        chapter.locations.add(scene.location_id)
    chapter.npcs.add(*scene.npcs.all())
    chapter.quests.add(*scene.quests.all())
    chapter.events.add(*scene.events.all())
    chapter.trivia.add(*scene.trivia.all())


def next_chapter_number(world):
    """Return the number a new chapter of the given world gets by default."""
    highest = world.chapters.aggregate(highest=Max("number"))["highest"]
    return (highest or 0) + 1


@transaction.atomic
def delete_world(world):
    """Delete a world together with its NPCs, also those made up in its sessions; they would stay behind otherwise."""
    Npc.objects.filter(world_link__world=world).delete()
    world.delete()


@transaction.atomic
def create_world_npc(world, name, location=None, session=None):
    """Create an NPC and attach it to the world in one step; with a session, it is made up in that session."""
    npc = Npc.objects.create(owner=world.owner, name=name)
    return WorldNpc.objects.create(world=world, npc=npc, location=location, session=session)
