"""Tests for the world endpoints: rights, ownership and links inside a world."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from auth_app.models import User
from character_app.models import Npc
from world.world_app.models import Chapter, Location, Quest, Scene, World, WorldNpc
from world.world_app.utils import create_world_npc, locations_in_chapter, npcs_in_chapter


class WorldTestCase(APITestCase):
    """Create two game masters with one world each and log the first one in."""

    def setUp(self):
        """Prepare accounts and worlds."""
        self.master = User.objects.create_user(username="master", password="x", is_game_master=True)
        self.other = User.objects.create_user(username="other", password="x", is_game_master=True)
        self.world = World.objects.create(owner=self.master, name="Meine Welt")
        self.foreign_world = World.objects.create(owner=self.other, name="Fremde Welt")
        self.client.force_authenticate(self.master)

    def post(self, name, args, data):
        """Send a JSON POST to the named URL."""
        return self.client.post(reverse(name, args=args), data, format="json")

    def patch(self, name, pk, data):
        """Send a JSON PATCH to the named detail URL."""
        return self.client.patch(reverse(name, args=[pk]), data, format="json")


class WorldAccessTests(WorldTestCase):
    """Check who may see and change which world."""

    def test_list_shows_only_own_worlds(self):
        """Expect the world of another game master to stay hidden."""
        names = [world["name"] for world in self.client.get(reverse("world-list")).data]
        self.assertEqual(names, ["Meine Welt"])

    def test_create_sets_owner(self):
        """Expect a new world to belong to the requesting game master."""
        response = self.post("world-list", [], {"name": "Neue Welt"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(World.objects.get(pk=response.data["id"]).owner, self.master)

    def test_foreign_world_is_not_found(self):
        """Expect a 404 for a foreign world and for the lists inside it."""
        self.assertEqual(self.client.get(reverse("world-detail", args=[self.foreign_world.pk])).status_code, 404)
        self.assertEqual(self.client.get(reverse("location-list", args=[self.foreign_world.pk])).status_code, 404)

    def test_player_is_forbidden(self):
        """Expect a 403 for an account without the game master switch."""
        self.client.force_authenticate(User.objects.create_user(username="player", password="x"))
        self.assertEqual(self.client.get(reverse("world-list")).status_code, status.HTTP_403_FORBIDDEN)


class LocationTests(WorldTestCase):
    """Check locations and how they lie inside each other."""

    def setUp(self):
        """Create an island with a city on it."""
        super().setUp()
        self.island = Location.objects.create(world=self.world, name="Insel")
        self.city = Location.objects.create(world=self.world, name="Stadt", parent=self.island)

    def test_create_inside_another_location(self):
        """Expect a new place to accept a parent of the same world."""
        response = self.post("location-list", [self.world.pk], {"name": "Taverne", "parent": self.city.pk})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.city.children.count(), 1)

    def test_parent_from_other_world_is_rejected(self):
        """Expect a 400 for a parent that belongs to another world."""
        foreign = Location.objects.create(world=self.foreign_world, name="Fremder Ort")
        response = self.post("location-list", [self.world.pk], {"name": "Taverne", "parent": foreign.pk})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_location_cannot_lie_inside_itself(self):
        """Expect a 400 when the island is moved into its own city."""
        response = self.patch("location-detail", self.island.pk, {"parent": self.city.pk})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deleting_parent_keeps_children(self):
        """Expect the city to stay when the island is deleted."""
        self.client.delete(reverse("location-detail", args=[self.island.pk]))
        self.city.refresh_from_db()
        self.assertIsNone(self.city.parent)


class WorldNpcTests(WorldTestCase):
    """Check that NPCs are created inside a world and belong only to it."""

    def test_create_makes_npc_and_link(self):
        """Expect one NPC owned by the game master and attached to the world."""
        response = self.post("world-npc-list", [self.world.pk], {"name": "Wirtin"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        npc = Npc.objects.get(pk=response.data["npc"])
        self.assertEqual((npc.name, npc.owner, npc.world_link.world), ("Wirtin", self.master, self.world))

    def test_place_can_be_changed(self):
        """Expect the meeting place of an NPC to be editable."""
        link = create_world_npc(self.world, "Wirtin")
        tavern = Location.objects.create(world=self.world, name="Taverne")
        response = self.patch("world-npc-detail", link.pk, {"location": tavern.pk})
        self.assertEqual(response.data["location"], tavern.pk)

    def test_delete_removes_the_npc(self):
        """Expect the NPC itself to be gone after it was removed from the world."""
        link = create_world_npc(self.world, "Wirtin")
        self.client.delete(reverse("world-npc-detail", args=[link.pk]))
        self.assertFalse(Npc.objects.exists())
        self.assertFalse(WorldNpc.objects.exists())


class QuestAndChapterTests(WorldTestCase):
    """Check quests, chapters and scenes with their links."""

    def setUp(self):
        """Create a place, an NPC of this world and an NPC of the foreign world."""
        super().setUp()
        self.tavern = Location.objects.create(world=self.world, name="Taverne")
        self.host = create_world_npc(self.world, "Wirtin").npc
        self.stranger = create_world_npc(self.foreign_world, "Fremder").npc

    def test_quest_with_links_and_checklist(self):
        """Expect a quest to keep its place, giver, NPCs and cleaned checklist."""
        data = {"name": "Der Auftrag", "kind": "main", "location": self.tavern.pk, "giver": self.host.pk,
                "npcs": [self.host.pk], "goal": "Das Ziel", "checklist": ["Erster Punkt", "  ", "Zweiter Punkt"]}
        response = self.post("quest-list", [self.world.pk], data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["checklist"], ["Erster Punkt", "Zweiter Punkt"])
        self.assertEqual(response.data["giver"], self.host.pk)

    def test_quest_rejects_npc_of_other_world(self):
        """Expect a 400 when a quest names an NPC of another world."""
        response = self.post("quest-list", [self.world.pk], {"name": "Der Auftrag", "npcs": [self.stranger.pk]})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_chapters_are_numbered_automatically(self):
        """Expect the first two chapters to get the numbers 1 and 2."""
        first = self.post("chapter-list", [self.world.pk], {"name": "Ankunft"})
        second = self.post("chapter-list", [self.world.pk], {"name": "Das Dorf"})
        self.assertEqual((first.data["number"], second.data["number"]), (1, 2))

    def test_chapter_number_must_be_unique(self):
        """Expect a 400 when a number is used twice in one world."""
        Chapter.objects.create(world=self.world, number=1, name="Ankunft")
        response = self.post("chapter-list", [self.world.pk], {"name": "Doppelt", "number": 1})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_chapter_links_quests_of_its_world(self):
        """Expect a chapter to accept a quest of its world and reject a foreign one."""
        own = Quest.objects.create(world=self.world, name="Eigene")
        foreign = Quest.objects.create(world=self.foreign_world, name="Fremde")
        self.assertEqual(self.post("chapter-list", [self.world.pk], {"name": "A", "quests": [own.pk]}).status_code, 201)
        self.assertEqual(self.post("chapter-list", [self.world.pk], {"name": "B", "quests": [foreign.pk]}).status_code, 400)

    def test_scene_belongs_to_chapter_and_feeds_its_collections(self):
        """Expect the chapter to collect places and NPCs from its scenes."""
        chapter = Chapter.objects.create(world=self.world, number=1, name="Ankunft")
        data = {"name": "In der Taverne", "location": self.tavern.pk, "npcs": [self.host.pk]}
        response = self.post("scene-list", [chapter.pk], data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(list(npcs_in_chapter(chapter)), [self.host])
        self.assertEqual(list(locations_in_chapter(chapter)), [self.tavern])

    def test_scene_rejects_place_of_other_world(self):
        """Expect a 400 when a scene is set at a place of another world."""
        chapter = Chapter.objects.create(world=self.world, number=1, name="Ankunft")
        foreign = Location.objects.create(world=self.foreign_world, name="Fremder Ort")
        response = self.post("scene-list", [chapter.pk], {"name": "Falsch", "location": foreign.pk})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_foreign_scene_is_not_found(self):
        """Expect a 404 for a scene in the world of another game master."""
        chapter = Chapter.objects.create(world=self.foreign_world, number=1, name="Fremd")
        scene = Scene.objects.create(chapter=chapter, name="Fremde Szene")
        self.assertEqual(self.client.get(reverse("scene-detail", args=[scene.pk])).status_code, 404)
