"""Serializers for a world and everything written in it."""

from rest_framework import serializers

from core.knowledge import clean_knowledge
from world.world_app.models import Chapter, Event, Location, Quest, Scene, Trivia, World, WorldNpc
from world.world_app.utils import create_world_npc, lies_inside, next_chapter_number, npcs_in_world

OTHER_WORLD = "Dieser Eintrag gehört zu einer anderen Welt."


class WorldSerializer(serializers.ModelSerializer):
    """Serialize a world for list, detail and write requests."""

    class Meta:
        model = World
        fields = ["id", "name", "lore", "created_at"]


class WorldScopedSerializer(serializers.ModelSerializer):
    """Base for everything inside a world: links may only point into the same world."""

    def get_world(self):
        """Return the world of the edited entry, or the one the view passes for a new entry."""
        return self.instance.world if self.instance else self.context["world"]

    def _check_same_world(self, entries):
        """Raise when one of the given entries belongs to another world."""
        if any(entry.world_id != self.get_world().pk for entry in entries):
            raise serializers.ValidationError(OTHER_WORLD)

    def _check_npcs(self, npcs):
        """Raise when one of the given NPCs is not attached to this world."""
        allowed = set(npcs_in_world(self.get_world()).values_list("pk", flat=True))
        if any(npc.pk not in allowed for npc in npcs):
            raise serializers.ValidationError(OTHER_WORLD)

    def validate_location(self, location):
        """Accept only a location of the same world."""
        self._check_same_world([location] if location else [])
        return location

    def validate_npcs(self, npcs):
        """Accept only NPCs of the same world."""
        self._check_npcs(npcs)
        return npcs

    def validate_locations(self, locations):
        """Accept only locations of the same world."""
        self._check_same_world(locations)
        return locations

    def validate_quests(self, quests):
        """Accept only quests of the same world."""
        self._check_same_world(quests)
        return quests

    def validate_events(self, events):
        """Accept only events of the same world."""
        self._check_same_world(events)
        return events

    def validate_trivia(self, trivia):
        """Accept only knowledge entries of the same world."""
        self._check_same_world(trivia)
        return trivia

    def validate_player_knowledge(self, pieces):
        """Check the knowledge pieces players can learn."""
        return clean_knowledge(pieces)

    def validate_gm_knowledge(self, pieces):
        """Check the knowledge pieces only the game master reads."""
        return clean_knowledge(pieces)


class LocationSerializer(WorldScopedSerializer):
    """Serialize a location; its parent must be another place of the same world."""

    class Meta:
        model = Location
        fields = ["id", "parent", "name", "description", "player_knowledge", "gm_knowledge"]

    def validate_parent(self, parent):
        """Reject a parent from another world and a place that would contain itself."""
        self._check_same_world([parent] if parent else [])
        if parent and self.instance and lies_inside(parent, self.instance):
            raise serializers.ValidationError("Ein Ort kann nicht in sich selbst liegen.")
        return parent


class WorldNpcSerializer(WorldScopedSerializer):
    """Serialize the link between a world and one of its NPCs."""

    name = serializers.CharField(source="npc.name", max_length=200)
    profession = serializers.CharField(source="npc.profession", read_only=True)

    class Meta:
        model = WorldNpc
        fields = ["id", "npc", "name", "profession", "location"]
        read_only_fields = ["npc"]

    def create(self, validated_data):
        """Create the NPC together with its link to the world."""
        name = validated_data.pop("npc")["name"]
        return create_world_npc(validated_data["world"], name, validated_data.get("location"))

    def update(self, instance, validated_data):
        """Change the place only; the NPC itself is edited through its own endpoint."""
        validated_data.pop("npc", None)
        return super().update(instance, validated_data)


class QuestSerializer(WorldScopedSerializer):
    """Serialize a quest with its goal, its checklist and its links to a place, a scene and NPCs."""

    class Meta:
        model = Quest
        fields = [
            "id", "name", "kind", "number", "description", "goal", "checklist",
            "player_knowledge", "gm_knowledge", "location", "giver", "scene", "npcs",
        ]

    def validate_scene(self, scene):
        """Accept only a scene of the same world as the origin of the quest."""
        if scene and scene.chapter.world_id != self.get_world().pk:
            raise serializers.ValidationError(OTHER_WORLD)
        return scene

    def validate_giver(self, giver):
        """Accept only an NPC of the same world as quest giver."""
        self._check_npcs([giver] if giver else [])
        return giver

    def validate_checklist(self, checklist):
        """Accept a list of texts and drop empty lines."""
        if not isinstance(checklist, list) or not all(isinstance(point, str) for point in checklist):
            raise serializers.ValidationError("Die Checkliste muss eine Liste von Texten sein.")
        return [point.strip() for point in checklist if point.strip()]


class EventSerializer(WorldScopedSerializer):
    """Serialize an event."""

    class Meta:
        model = Event
        fields = ["id", "name", "description", "player_knowledge", "gm_knowledge", "location"]


class TriviaSerializer(WorldScopedSerializer):
    """Serialize a piece of knowledge with its links to places, NPCs, quests and events."""

    class Meta:
        model = Trivia
        fields = [
            "id", "name", "category", "description", "player_knowledge", "gm_knowledge",
            "locations", "npcs", "quests", "events",
        ]


class ChapterSerializer(WorldScopedSerializer):
    """Serialize a chapter; a new chapter gets the next free number by default."""

    number = serializers.IntegerField(min_value=1, required=False)

    class Meta:
        model = Chapter
        fields = ["id", "number", "name", "text", "to_read", "quests", "events"]

    def validate_number(self, number):
        """Reject a number another chapter of the world already uses."""
        taken = self.get_world().chapters.filter(number=number)
        if taken.exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError("Diese Kapitelnummer gibt es in der Welt schon.")
        return number

    def create(self, validated_data):
        """Create the chapter, numbering it automatically when no number was sent."""
        validated_data.setdefault("number", next_chapter_number(validated_data["world"]))
        return super().create(validated_data)


class SceneSerializer(WorldScopedSerializer):
    """Serialize a scene of a chapter with everything it points to."""

    class Meta:
        model = Scene
        fields = [
            "id", "chapter", "position", "optional", "name", "text", "to_read",
            "location", "npcs", "leads_to", "quests", "events", "trivia",
        ]
        read_only_fields = ["chapter"]

    def get_world(self):
        """Return the world of the scene's chapter."""
        chapter = self.instance.chapter if self.instance else self.context["chapter"]
        return chapter.world

    def validate_leads_to(self, scenes):
        """Accept only other scenes of the same world."""
        if any(scene.chapter.world_id != self.get_world().pk for scene in scenes):
            raise serializers.ValidationError(OTHER_WORLD)
        if self.instance and self.instance in scenes:
            raise serializers.ValidationError("Eine Szene kann nicht zu sich selbst führen.")
        return scenes
