"""Serializers for a world and everything written in it."""

from rest_framework import serializers

from core.dialogues import clean_dialogues, speakers
from core.knowledge import clean_knowledge
from world.world_app.models import Chapter, Event, Location, Picture, Quest, Scene, Trivia, World, WorldNpc
from world.world_app.utils import create_world_npc, lies_inside, next_chapter_number, npcs_in_world

OTHER_WORLD = "Dieser Eintrag gehört zu einer anderen Welt."
OTHER_SESSION = "Dieser Eintrag gehört zu einer anderen Runde."
OTHER_NPC = "Diese Figur gehört zu einer anderen Welt oder Runde."


class WorldSerializer(serializers.ModelSerializer):
    """Serialize a world for list, detail and write requests."""

    class Meta:
        model = World
        fields = ["id", "name", "lore", "second_bar_name", "created_at", "updated_at"]


class WorldScopedSerializer(serializers.ModelSerializer):
    """Base for everything inside a world: links may only point into the same world.

    An entry of the world links only to entries of the world. An entry made up in a session links to
    entries of the world and to what the same session made up, never to what another session made up.
    """

    # Set by the view on creation ("?session="); it never changes afterwards.
    session = serializers.PrimaryKeyRelatedField(read_only=True)

    def get_world(self):
        """Return the world of the edited entry, or the one the view passes for a new entry."""
        return self.instance.world if self.instance else self.context["world"]

    def get_session(self):
        """Return the session the entry was made up in, or the one the view passes for a new entry; None: the world."""
        if self.instance:
            return getattr(self.instance, "session", None)
        return self.context.get("session")

    def _check_same_world(self, entries):
        """Raise when one of the given entries belongs to another world or was made up in another session."""
        if any(entry.world_id != self.get_world().pk for entry in entries):
            raise serializers.ValidationError(OTHER_WORLD)
        self._check_session(entries)

    def _check_session(self, entries):
        """Raise when one of the given entries was made up in a session other than the one of this entry."""
        own = getattr(self.get_session(), "pk", None)
        if any(getattr(entry, "session_id", None) not in (None, own) for entry in entries):
            raise serializers.ValidationError(OTHER_SESSION)

    def _check_scenes(self, scenes):
        """Raise when one of the given scenes belongs to another world or was made up in another session."""
        if any(scene.chapter.world_id != self.get_world().pk for scene in scenes):
            raise serializers.ValidationError(OTHER_WORLD)
        self._check_session(scenes)

    def _npc_ids(self):
        """Return the ids of the NPCs links may point to: those of the world and those of the entry's session."""
        return set(npcs_in_world(self.get_world(), self.get_session()).values_list("pk", flat=True))

    def _check_npcs(self, npcs):
        """Raise when one of the given NPCs is not attached to this world or was made up in another session."""
        allowed = self._npc_ids()
        if any(npc.pk not in allowed for npc in npcs):
            raise serializers.ValidationError(OTHER_NPC)

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

    def validate_chapters(self, chapters):
        """Accept only chapters of the same world as tags; an entry made up in a session carries none."""
        self._check_same_world(chapters)
        if chapters and self.get_session():
            raise serializers.ValidationError("Einträge einer Runde tragen keine Kapitel.")
        return chapters

    def validate_player_knowledge(self, pieces):
        """Check the knowledge pieces players can learn."""
        return clean_knowledge(pieces)

    def validate_gm_knowledge(self, pieces):
        """Check the knowledge pieces only the game master reads."""
        return clean_knowledge(pieces)

    def validate_dialogues(self, dialogues):
        """Check the dialogues; whoever speaks in them must be an NPC of the same world."""
        cleaned = clean_dialogues(dialogues)
        if not speakers(cleaned) <= self._npc_ids():
            raise serializers.ValidationError(OTHER_NPC)
        return cleaned


class ChapterTagged(serializers.Serializer):
    """Give an entry the chapters it is tagged with; a new entry needs none."""

    chapters = serializers.PrimaryKeyRelatedField(many=True, queryset=Chapter.objects.all(), required=False)


class LocationSerializer(ChapterTagged, WorldScopedSerializer):
    """Serialize a location; its parent must be another place of the same world."""

    class Meta:
        model = Location
        fields = [
            "id", "parent", "name", "symbol", "category", "description", "visible_from_start", "player_knowledge",
            "gm_knowledge", "note", "chapters", "session", "created_at", "updated_at",
        ]

    def validate_parent(self, parent):
        """Reject a parent from another world and a place that would contain itself."""
        self._check_same_world([parent] if parent else [])
        if parent and self.instance and lies_inside(parent, self.instance):
            raise serializers.ValidationError("Ein Ort kann nicht in sich selbst liegen.")
        return parent


class WorldNpcSerializer(WorldScopedSerializer):
    """Serialize the link between a world and one of its NPCs, with what the NPC carries."""

    name = serializers.CharField(source="npc.name", max_length=200)
    profession = serializers.CharField(source="npc.profession", read_only=True)
    symbol = serializers.CharField(source="npc.symbol", read_only=True)
    # Like profession and symbol, these two are written at the NPC itself (npcs/<id>/).
    category = serializers.CharField(source="npc.category", read_only=True)
    note = serializers.CharField(source="npc.note", read_only=True)
    created_at = serializers.DateTimeField(source="npc.created_at", read_only=True)
    updated_at = serializers.DateTimeField(source="npc.updated_at", read_only=True)
    # Read only: the glossary lists the items of all characters; they are edited at the character.
    inventory = serializers.JSONField(source="npc.inventory", read_only=True)
    # The chapter tags hang on the NPC itself, like the tags of every other entry.
    chapters = serializers.PrimaryKeyRelatedField(
        source="npc.chapters", many=True, queryset=Chapter.objects.all(), required=False
    )

    class Meta:
        model = WorldNpc
        fields = [
            "id", "npc", "name", "profession", "symbol", "category", "note", "location", "inventory", "chapters",
            "session", "created_at", "updated_at",
        ]
        read_only_fields = ["npc"]

    def create(self, validated_data):
        """Create the NPC together with its link to the world and, with "?session=", to that session."""
        name = validated_data.pop("npc")["name"]
        location, session = validated_data.get("location"), validated_data.get("session")
        return create_world_npc(validated_data["world"], name, location, session)

    def update(self, instance, validated_data):
        """Change the place and the chapter tags; the NPC itself is edited through its own endpoint."""
        chapters = validated_data.pop("npc", {}).get("chapters")
        if chapters is not None:
            instance.npc.chapters.set(chapters)
        return super().update(instance, validated_data)


class QuestSerializer(ChapterTagged, WorldScopedSerializer):
    """Serialize a quest with its goal, its checklist and its links to a place, a scene and NPCs."""

    class Meta:
        model = Quest
        fields = [
            "id", "name", "symbol", "category", "kind", "number", "description", "goal", "checklist",
            "visible_from_start", "player_knowledge", "gm_knowledge", "note", "dialogues", "location", "giver", "scene",
            "npcs", "chapters", "session", "created_at", "updated_at",
        ]

    def validate_scene(self, scene):
        """Accept only a scene of the same world as the origin of the quest."""
        self._check_scenes([scene] if scene else [])
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


class EventSerializer(ChapterTagged, WorldScopedSerializer):
    """Serialize an event: what sets it off and happens, its characters, where it leads, its dialogues."""

    class Meta:
        model = Event
        fields = [
            "id", "name", "symbol", "category", "trigger", "happening", "description", "visible_from_start",
            "player_knowledge", "gm_knowledge", "note", "dialogues", "location", "npcs", "leads_to", "chapters",
            "session", "created_at", "updated_at",
        ]

    def validate_leads_to(self, scenes):
        """Accept only scenes of the same world as where the event can lead."""
        self._check_scenes(scenes)
        return scenes


class TriviaSerializer(ChapterTagged, WorldScopedSerializer):
    """Serialize a piece of knowledge with its links to places, NPCs, quests and events."""

    class Meta:
        model = Trivia
        fields = [
            "id", "name", "symbol", "category", "description", "visible_from_start", "player_knowledge",
            "gm_knowledge", "note", "locations", "npcs", "quests", "events", "chapters", "session", "created_at",
            "updated_at",
        ]


class ChapterSerializer(WorldScopedSerializer):
    """Serialize a chapter with the entries tagged with it; a new chapter gets the next free number by default."""

    number = serializers.IntegerField(min_value=1, required=False)

    class Meta:
        model = Chapter
        fields = [
            "id", "number", "name", "category", "description", "to_read", "note", "locations", "npcs", "quests",
            "events", "trivia", "created_at", "updated_at",
        ]

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
            "id", "chapter", "position", "optional", "name", "category", "description", "to_read", "note", "dialogues",
            "location", "npcs", "leads_to", "quests", "events", "trivia", "session", "created_at", "updated_at",
        ]
        read_only_fields = ["chapter"]

    def get_world(self):
        """Return the world of the scene's chapter."""
        chapter = self.instance.chapter if self.instance else self.context["chapter"]
        return chapter.world

    def validate_leads_to(self, scenes):
        """Accept only other scenes of the same world."""
        self._check_scenes(scenes)
        if self.instance and self.instance in scenes:
            raise serializers.ValidationError("Eine Szene kann nicht zu sich selbst führen.")
        return scenes


class PictureSerializer(serializers.ModelSerializer):
    """Serialize one picture of a place or an item; the address says where it hangs."""

    class Meta:
        model = Picture
        fields = ["id", "image", "position"]
