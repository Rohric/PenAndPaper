"""Endpoints for worlds and everything a game master writes in them."""

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
    pictures_for_user,
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
    prefetch = ["chapters"]


class LocationDetail(WorldChildDetail):
    """Retrieve, update or delete one location."""

    serializer_class = LocationSerializer
    model = Location


class WorldNpcList(WorldChildList):
    """List the NPCs of a world and create a new NPC inside it."""

    serializer_class = WorldNpcSerializer
    related_name = "world_npcs"
    select = ["npc"]
    prefetch = ["npc__chapters"]


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
    prefetch = ["npcs", "chapters"]


class QuestDetail(WorldChildDetail):
    """Retrieve, update or delete one quest."""

    serializer_class = QuestSerializer
    model = Quest


class EventList(WorldChildList):
    """List and create the events of a world."""

    serializer_class = EventSerializer
    related_name = "events"
    prefetch = ["chapters"]


class EventDetail(WorldChildDetail):
    """Retrieve, update or delete one event."""

    serializer_class = EventSerializer
    model = Event


class TriviaList(WorldChildList):
    """List and create the knowledge entries of a world."""

    serializer_class = TriviaSerializer
    related_name = "trivia"
    prefetch = ["locations", "npcs", "quests", "events", "chapters"]


class TriviaDetail(WorldChildDetail):
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
        """Save the new scene inside the chapter and tag what hangs on it with the chapter."""
        tag_chapter(serializer.save(chapter=self.chapter))


class SceneDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one scene."""

    serializer_class = SceneSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only scenes from worlds the requesting user owns."""
        return Scene.objects.filter(chapter__world__owner=self.request.user)

    def perform_update(self, serializer):
        """Save the scene and tag what hangs on it now with its chapter."""
        tag_chapter(serializer.save())


class PictureList(generics.ListCreateAPIView):
    """
    Base for the pictures of one entry; subclasses name the model the pictures hang on.

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
        return get_object_or_404(self.model.objects.filter(world__owner=self.request.user), pk=self.kwargs["pk"])

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
