"""Endpoints for worlds and everything a game master writes in them.

The views of a world show only the entries of the world itself. With "?session=<id>" naming one of
the game master's sessions, they also show what he made up in that session, and a new entry is made
up in that session instead of being written into the world.
"""

from functools import cached_property

from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated

from auth_app.api.permissions import IsGameMaster
from core.images import ENTRY_PICTURE, shrink_image
from world.world_app.models import Chapter, Event, Location, Quest, Scene, Trivia, WorldNpc
from world.world_app.utils import (
    MAX_PICTURES,
    chapter_for_user,
    delete_world,
    in_scope,
    pictures_for_user,
    session_scope,
    tag_chapter,
    world_for_user,
    worlds_for_user,
)

from .serializers import (
    ChapterSerializer,
    EventSerializer,
    LocationSerializer,
    PictureSerializer,
    QuestSerializer,
    SceneSerializer,
    TriviaSerializer,
    WorldNpcSerializer,
    WorldSerializer,
)

GAME_MASTER_ONLY = [IsAuthenticated, IsGameMaster]
SCENE_LINKS = ["npcs", "leads_to", "quests", "events", "trivia"]


class WorldList(generics.ListCreateAPIView):
    """
    List and create worlds.

    - GET: worlds the requesting game master owns.
    - POST: create a new world owned by the requesting game master.
    """

    serializer_class = WorldSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only the worlds the requesting user owns."""
        return worlds_for_user(self.request.user)

    def perform_create(self, serializer):
        """Save the new world with the requesting user as owner."""
        serializer.save(owner=self.request.user)


class WorldDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one world of the requesting game master."""

    serializer_class = WorldSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only the worlds the requesting user owns."""
        return worlds_for_user(self.request.user)

    def perform_destroy(self, instance):
        """Delete the world together with its NPCs."""
        delete_world(instance)


class SessionScopeMixin:
    """Let a view also cover what the game master made up in one of his sessions, named by "?session="."""

    def scope_world(self):
        """Return the world the named session has to play; None where the address names no world."""
        return None

    @cached_property
    def session(self):
        """Return the session from "?session=" or None; raise a 404 when it is not the user's or plays another world."""
        return session_scope(self.request.user, self.request.query_params.get("session"), self.scope_world())

    def get_serializer_context(self):
        """Pass the session to the serializer, so the links of a new entry may point to what it made up."""
        return {**super().get_serializer_context(), "session": self.session}


class WorldChildList(generics.ListCreateAPIView):
    """
    Base for the lists inside one world; subclasses name the relation and the serializer.

    - GET: all entries of that kind in the world.
    - POST: create an entry in the world.
    """

    permission_classes = GAME_MASTER_ONLY
    related_name = None
    # Relations the serializer reads for every entry; loading them at once saves one query per entry.
    select = []
    prefetch = []

    @cached_property
    def world(self):
        """Return the world from the URL, or raise a 404 when it is not the user's."""
        return world_for_user(self.request.user, self.kwargs["world_id"])

    def get_queryset(self):
        """Return the entries of the world together with the relations their serializer reads."""
        entries = getattr(self.world, self.related_name)
        return entries.select_related(*self.select).prefetch_related(*self.prefetch)

    def get_serializer_context(self):
        """Pass the world to the serializer so it can check links."""
        return {**super().get_serializer_context(), "world": self.world}

    def perform_create(self, serializer):
        """Save the new entry inside the world."""
        serializer.save(world=self.world)


class SessionChildList(SessionScopeMixin, WorldChildList):
    """
    Base for the lists of the kinds of entries a session can make up as well.

    - GET: the entries of the world; with "?session=" also those made up in that session.
    - POST: with "?session=" the new entry is made up in that session and stays out of the world.
    """

    def scope_world(self):
        """Return the world from the URL, which the named session has to play."""
        return self.world

    def get_queryset(self):
        """Return the entries of the world and those made up in the named session."""
        return in_scope(super().get_queryset(), self.session)

    def perform_create(self, serializer):
        """Save the new entry inside the world and, with "?session=", inside that session."""
        serializer.save(world=self.world, session=self.session)


class WorldChildDetail(generics.RetrieveUpdateDestroyAPIView):
    """Base for one entry inside a world; subclasses name the model and the serializer."""

    permission_classes = GAME_MASTER_ONLY
    model = None

    def get_queryset(self):
        """Return only entries from worlds the requesting user owns."""
        return self.model.objects.filter(world__owner=self.request.user)


class SessionChildDetail(SessionScopeMixin, WorldChildDetail):
    """Base for one entry of a kind a session can make up as well; one made up in a session needs "?session="."""

    def get_queryset(self):
        """Return the entries of the user's worlds and those made up in the named session."""
        return in_scope(super().get_queryset(), self.session)


class LocationList(SessionChildList):
    """List and create the locations of a world."""

    serializer_class = LocationSerializer
    related_name = "locations"
    prefetch = ["chapters"]


class LocationDetail(SessionChildDetail):
    """Retrieve, update or delete one location."""

    serializer_class = LocationSerializer
    model = Location


class WorldNpcList(SessionChildList):
    """List the NPCs of a world and create a new NPC inside it."""

    serializer_class = WorldNpcSerializer
    related_name = "world_npcs"
    select = ["npc"]
    prefetch = ["npc__chapters"]


class WorldNpcDetail(SessionChildDetail):
    """Retrieve an NPC link, change its place, or delete the NPC from the world."""

    serializer_class = WorldNpcSerializer
    model = WorldNpc

    def perform_destroy(self, instance):
        """Delete the NPC itself; its link to the world goes with it."""
        instance.npc.delete()


class QuestList(SessionChildList):
    """List and create the quests of a world."""

    serializer_class = QuestSerializer
    related_name = "quests"
    prefetch = ["npcs", "chapters"]


class QuestDetail(SessionChildDetail):
    """Retrieve, update or delete one quest."""

    serializer_class = QuestSerializer
    model = Quest


class EventList(SessionChildList):
    """List and create the events of a world."""

    serializer_class = EventSerializer
    related_name = "events"
    prefetch = ["npcs", "leads_to", "chapters"]


class EventDetail(SessionChildDetail):
    """Retrieve, update or delete one event."""

    serializer_class = EventSerializer
    model = Event


class TriviaList(SessionChildList):
    """List and create the knowledge entries of a world."""

    serializer_class = TriviaSerializer
    related_name = "trivia"
    prefetch = ["locations", "npcs", "quests", "events", "chapters"]


class TriviaDetail(SessionChildDetail):
    """Retrieve, update or delete one knowledge entry."""

    serializer_class = TriviaSerializer
    model = Trivia


class ChapterList(WorldChildList):
    """List and create the chapters of a world."""

    serializer_class = ChapterSerializer
    related_name = "chapters"
    prefetch = ["locations", "npcs", "quests", "events", "trivia"]


class ChapterDetail(WorldChildDetail):
    """Retrieve, update or delete one chapter."""

    serializer_class = ChapterSerializer
    model = Chapter


class WorldSceneList(SessionScopeMixin, generics.ListAPIView):
    """List the scenes of all chapters of a world, so entries can show where they appear; "?session=" adds its own."""

    serializer_class = SceneSerializer
    permission_classes = GAME_MASTER_ONLY

    @cached_property
    def world(self):
        """Return the world from the URL, or raise a 404 when it is not the user's."""
        return world_for_user(self.request.user, self.kwargs["world_id"])

    def scope_world(self):
        """Return the world from the URL, which the named session has to play."""
        return self.world

    def get_queryset(self):
        """Return the scenes of the user's world in chapter and thread order."""
        scenes = in_scope(Scene.objects.filter(chapter__world=self.world), self.session).prefetch_related(*SCENE_LINKS)
        return scenes.order_by("chapter__number", "position", "id")


class SceneList(SessionScopeMixin, generics.ListCreateAPIView):
    """
    List and create the scenes of a chapter.

    - GET: all scenes of the chapter; with "?session=" also those made up in that session.
    - POST: create a scene in the chapter; with "?session=" it is made up in that session.
    """

    serializer_class = SceneSerializer
    permission_classes = GAME_MASTER_ONLY

    @cached_property
    def chapter(self):
        """Return the chapter from the URL, or raise a 404 when it is not the user's."""
        return chapter_for_user(self.request.user, self.kwargs["chapter_id"])

    def scope_world(self):
        """Return the world of the chapter, which the named session has to play."""
        return self.chapter.world

    def get_queryset(self):
        """Return the scenes of the chapter and those made up in the named session."""
        return in_scope(self.chapter.scenes.all(), self.session)

    def get_serializer_context(self):
        """Pass the chapter to the serializer so it can check links."""
        return {**super().get_serializer_context(), "chapter": self.chapter}

    def perform_create(self, serializer):
        """Save the new scene inside the chapter (and the named session) and tag what hangs on it with the chapter."""
        tag_chapter(serializer.save(chapter=self.chapter, session=self.session))


class SceneDetail(SessionScopeMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one scene; one made up in a session needs "?session="."""

    serializer_class = SceneSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only scenes from worlds the requesting user owns, and those made up in the named session."""
        return in_scope(Scene.objects.filter(chapter__world__owner=self.request.user), self.session)

    def perform_update(self, serializer):
        """Save the scene and tag what hangs on it now with its chapter."""
        tag_chapter(serializer.save())


class PictureList(SessionScopeMixin, generics.ListCreateAPIView):
    """
    Base for the pictures of one entry; subclasses name the model the pictures hang on.

    An entry made up in a session needs "?session=", like everywhere else.

    - GET: the pictures of the entry.
    - POST: upload one more picture (multipart, field "image"); an entry takes three at most.
    """

    serializer_class = PictureSerializer
    permission_classes = GAME_MASTER_ONLY
    parser_classes = [MultiPartParser]
    model = None
    field = None

    @cached_property
    def entry(self):
        """Return the entry from the URL, or raise a 404 when it is not the user's."""
        entries = in_scope(self.model.objects.filter(world__owner=self.request.user), self.session)
        return get_object_or_404(entries, pk=self.kwargs["pk"])

    def get_queryset(self):
        """Return the pictures of the entry."""
        return self.entry.pictures.all()

    def perform_create(self, serializer):
        """Save the picture at the entry, made smaller, unless it has three already."""
        if self.entry.pictures.count() >= MAX_PICTURES:
            raise ValidationError(f"Mehr als {MAX_PICTURES} Bilder gehen nicht.")
        image = shrink_image(serializer.validated_data["image"], ENTRY_PICTURE)
        serializer.save(image=image, **{self.field: self.entry})


class LocationPictureList(PictureList):
    """List and upload the pictures of a place."""

    model = Location
    field = "location"


class TriviaPictureList(PictureList):
    """List and upload the pictures of a knowledge entry, which is how items are stored."""

    model = Trivia
    field = "trivia"


class PictureDetail(generics.DestroyAPIView):
    """Delete one picture of a place or an item."""

    serializer_class = PictureSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only pictures from worlds the requesting user owns."""
        return pictures_for_user(self.request.user)

    def perform_destroy(self, instance):
        """Delete the file together with the picture."""
        instance.image.delete(save=False)
        instance.delete()
