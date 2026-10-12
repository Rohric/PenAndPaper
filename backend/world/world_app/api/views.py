"""Endpoints for worlds and everything a game master writes in them."""

from functools import cached_property

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from auth_app.api.permissions import IsGameMaster
from world.world_app.models import Chapter, Event, Location, Quest, Scene, Trivia, WorldNpc
from world.world_app.utils import chapter_for_user, delete_world, world_for_user, worlds_for_user

from .serializers import (
    ChapterSerializer,
    EventSerializer,
    LocationSerializer,
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


class WorldChildList(generics.ListCreateAPIView):
    """
    Base for the lists inside one world; subclasses name the relation and the serializer.

    - GET: all entries of that kind in the world.
    - POST: create an entry in the world.
    """

    permission_classes = GAME_MASTER_ONLY
    related_name = None

    @cached_property
    def world(self):
        """Return the world from the URL, or raise a 404 when it is not the user's."""
        return world_for_user(self.request.user, self.kwargs["world_id"])

    def get_queryset(self):
        """Return the entries of the world."""
        return getattr(self.world, self.related_name).all()

    def get_serializer_context(self):
        """Pass the world to the serializer so it can check links."""
        return {**super().get_serializer_context(), "world": self.world}

    def perform_create(self, serializer):
        """Save the new entry inside the world."""
        serializer.save(world=self.world)


class WorldChildDetail(generics.RetrieveUpdateDestroyAPIView):
    """Base for one entry inside a world; subclasses name the model and the serializer."""

    permission_classes = GAME_MASTER_ONLY
    model = None

    def get_queryset(self):
        """Return only entries from worlds the requesting user owns."""
        return self.model.objects.filter(world__owner=self.request.user)


class LocationList(WorldChildList):
    """List and create the locations of a world."""

    serializer_class = LocationSerializer
    related_name = "locations"


class LocationDetail(WorldChildDetail):
    """Retrieve, update or delete one location."""

    serializer_class = LocationSerializer
    model = Location


class WorldNpcList(WorldChildList):
    """List the NPCs of a world and create a new NPC inside it."""

    serializer_class = WorldNpcSerializer
    related_name = "world_npcs"


class WorldNpcDetail(WorldChildDetail):
    """Retrieve an NPC link, change its place, or delete the NPC from the world."""

    serializer_class = WorldNpcSerializer
    model = WorldNpc

    def perform_destroy(self, instance):
        """Delete the NPC itself; its link to the world goes with it."""
        instance.npc.delete()


class QuestList(WorldChildList):
    """List and create the quests of a world."""

    serializer_class = QuestSerializer
    related_name = "quests"


class QuestDetail(WorldChildDetail):
    """Retrieve, update or delete one quest."""

    serializer_class = QuestSerializer
    model = Quest


class EventList(WorldChildList):
    """List and create the events of a world."""

    serializer_class = EventSerializer
    related_name = "events"


class EventDetail(WorldChildDetail):
    """Retrieve, update or delete one event."""

    serializer_class = EventSerializer
    model = Event


class TriviaList(WorldChildList):
    """List and create the knowledge entries of a world."""

    serializer_class = TriviaSerializer
    related_name = "trivia"


class TriviaDetail(WorldChildDetail):
    """Retrieve, update or delete one knowledge entry."""

    serializer_class = TriviaSerializer
    model = Trivia


class ChapterList(WorldChildList):
    """List and create the chapters of a world."""

    serializer_class = ChapterSerializer
    related_name = "chapters"


class ChapterDetail(WorldChildDetail):
    """Retrieve, update or delete one chapter."""

    serializer_class = ChapterSerializer
    model = Chapter


class WorldSceneList(generics.ListAPIView):
    """List the scenes of all chapters of a world, so entries can show where they appear."""

    serializer_class = SceneSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return the scenes of the user's world in chapter and thread order."""
        world = world_for_user(self.request.user, self.kwargs["world_id"])
        scenes = Scene.objects.filter(chapter__world=world).prefetch_related(*SCENE_LINKS)
        return scenes.order_by("chapter__number", "position", "id")


class SceneList(generics.ListCreateAPIView):
    """
    List and create the scenes of a chapter.

    - GET: all scenes of the chapter.
    - POST: create a scene in the chapter.
    """

    serializer_class = SceneSerializer
    permission_classes = GAME_MASTER_ONLY

    @cached_property
    def chapter(self):
        """Return the chapter from the URL, or raise a 404 when it is not the user's."""
        return chapter_for_user(self.request.user, self.kwargs["chapter_id"])

    def get_queryset(self):
        """Return the scenes of the chapter."""
        return self.chapter.scenes.all()

    def get_serializer_context(self):
        """Pass the chapter to the serializer so it can check links."""
        return {**super().get_serializer_context(), "chapter": self.chapter}

    def perform_create(self, serializer):
        """Save the new scene inside the chapter."""
        serializer.save(chapter=self.chapter)


class SceneDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one scene."""

    serializer_class = SceneSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only scenes from worlds the requesting user owns."""
        return Scene.objects.filter(chapter__world__owner=self.request.user)
