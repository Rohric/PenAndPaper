"""Import a world written as JSON for one game master.

Entries are linked by name: a place names its "parent", a character its "location",
quests, events, knowledge and scenes name what they point to, a chapter its quests and events.
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from auth_app.models import User
from world.world_app.models import Chapter, Event, Location, Quest, Scene, Trivia, World
from world.world_app.utils import create_world_npc


def read_world(path):
    """Return the content of the JSON file or stop with a clear message."""
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise CommandError(f"Die Datei lässt sich nicht lesen: {error}")


def pick(entries, name, kind):
    """Return the entry with this name; no name means no link."""
    if not name:
        return None
    if name not in entries:
        raise CommandError(f"{kind} „{name}“ steht nicht in der Datei.")
    return entries[name]


def pick_all(entries, names, kind):
    """Return the entries with these names."""
    return [pick(entries, name, kind) for name in names or []]


def texts(entry):
    """Return what an entry says: its description and its knowledge for players and for the game master."""
    return {
        "description": entry.get("description", ""),
        "player_knowledge": entry.get("player_knowledge", []),
        "gm_knowledge": entry.get("gm_knowledge", []),
    }


def as_phrase(phrase):
    """Return an example phrase with trigger and text; a plain text has no trigger."""
    if isinstance(phrase, str):
        return {"trigger": "", "text": phrase}
    return {"trigger": phrase.get("trigger", ""), "text": phrase["text"]}


class Command(BaseCommand):
    """Create a world with places, characters, quests, events, knowledge and chapters from a JSON file."""

    help = "Import a world (JSON) for the given game master."

    def add_arguments(self, parser):
        """Take the file and the name of the owning account."""
        parser.add_argument("file")
        parser.add_argument("--owner", required=True, help="Username of the game master who gets the world.")

    @transaction.atomic
    def handle(self, *args, **options):
        """Read the file and build the world; nothing is saved when something fails."""
        owner = User.objects.filter(username=options["owner"]).first()
        if owner is None:
            raise CommandError("Dieses Konto gibt es nicht.")
        data = read_world(options["file"])
        try:
            self._build(owner, data)
        except KeyError as missing:
            raise CommandError(f"In der Datei fehlt das Feld {missing}.")
        self._report()

    def _build(self, owner, data):
        """Create the world and everything in it, in the order the links need."""
        if World.objects.filter(owner=owner, name=data["name"]).exists():
            raise CommandError(f"Die Welt „{data['name']}“ gibt es bei diesem Konto schon.")
        self.world = World.objects.create(owner=owner, name=data["name"], lore=data.get("lore", ""))
        self.locations, self.npcs, self.quests, self.events, self.trivia = {}, {}, {}, {}, {}
        self._locations(data.get("locations", []))
        self._npcs(data.get("npcs", []))
        self._quests(data.get("quests", []))
        self._events(data.get("events", []))
        self._trivia(data.get("trivia", []))
        self._chapters(data.get("chapters", []))

    def _locations(self, entries):
        """Create all places first, then put each one inside its parent."""
        for entry in entries:
            self.locations[entry["name"]] = Location.objects.create(world=self.world, name=entry["name"], **texts(entry))
        for entry in entries:
            if entry.get("parent"):
                place = self.locations[entry["name"]]
                place.parent = pick(self.locations, entry["parent"], "Der Ort")
                place.save()

    def _npcs(self, entries):
        """Create the characters of the world with profession, phrases and what is known about them."""
        for entry in entries:
            place = pick(self.locations, entry.get("location"), "Der Ort")
            npc = create_world_npc(self.world, entry["name"], place).npc
            npc.profession = entry.get("profession", "")
            npc.phrases = [as_phrase(phrase) for phrase in entry.get("phrases", [])]
            for field, value in texts(entry).items():
                setattr(npc, field, value)
            npc.save()
            self.npcs[entry["name"]] = npc

    def _quests(self, entries):
        """Create the quests and link their place, their giver and their characters."""
        for entry in entries:
            quest = Quest.objects.create(
                world=self.world, name=entry["name"], kind=entry.get("kind", Quest.Kind.SIDE),
                number=entry.get("number"), goal=entry.get("goal", ""), checklist=entry.get("checklist", []),
                **texts(entry),
                location=pick(self.locations, entry.get("location"), "Der Ort"),
                giver=pick(self.npcs, entry.get("giver"), "Die Figur"),
            )
            quest.npcs.set(pick_all(self.npcs, entry.get("npcs"), "Die Figur"))
            self.quests[entry["name"]] = quest

    def _events(self, entries):
        """Create the events and link their place."""
        for entry in entries:
            place = pick(self.locations, entry.get("location"), "Der Ort")
            self.events[entry["name"]] = Event.objects.create(
                world=self.world, name=entry["name"], location=place, **texts(entry)
            )

    def _trivia(self, entries):
        """Create the knowledge entries and attach them to places, characters, quests and events."""
        for entry in entries:
            trivia = Trivia.objects.create(
                world=self.world, name=entry["name"], category=entry.get("category", ""), **texts(entry)
            )
            trivia.locations.set(pick_all(self.locations, entry.get("locations"), "Der Ort"))
            trivia.npcs.set(pick_all(self.npcs, entry.get("npcs"), "Die Figur"))
            trivia.quests.set(pick_all(self.quests, entry.get("quests"), "Die Quest"))
            trivia.events.set(pick_all(self.events, entry.get("events"), "Das Ereignis"))
            self.trivia[entry["name"]] = trivia

    def _chapters(self, entries):
        """Create the chapters with their quests, their events and their scenes."""
        for entry in entries:
            chapter = Chapter.objects.create(
                world=self.world, number=entry["number"], name=entry["name"],
                text=entry.get("text", ""), to_read=entry.get("to_read", ""),
            )
            chapter.quests.set(pick_all(self.quests, entry.get("quests"), "Die Quest"))
            chapter.events.set(pick_all(self.events, entry.get("events"), "Das Ereignis"))
            self._scenes(chapter, entry.get("scenes", []))

    def _scenes(self, chapter, entries):
        """Create the scenes of a chapter in the order of the file, then link them to each other."""
        scenes = {}
        for position, entry in enumerate(entries):
            scenes[entry["name"]] = self._scene(chapter, position, entry)
        for entry in entries:
            scenes[entry["name"]].leads_to.set(pick_all(scenes, entry.get("leads_to"), "Die Szene"))

    def _scene(self, chapter, position, entry):
        """Create one scene with its place, characters, quests, events and knowledge."""
        scene = Scene.objects.create(
            chapter=chapter, position=position, optional=entry.get("optional", False), name=entry["name"],
            text=entry.get("text", ""), to_read=entry.get("to_read", ""),
            location=pick(self.locations, entry.get("location"), "Der Ort"),
        )
        scene.npcs.set(pick_all(self.npcs, entry.get("npcs"), "Die Figur"))
        scene.quests.set(pick_all(self.quests, entry.get("quests"), "Die Quest"))
        scene.events.set(pick_all(self.events, entry.get("events"), "Das Ereignis"))
        scene.trivia.set(pick_all(self.trivia, entry.get("trivia"), "Das Wissen"))
        return scene

    def _report(self):
        """Tell the user what was created."""
        world = self.world
        counts = (
            f"{world.locations.count()} Orte, {world.world_npcs.count()} Figuren, {world.chapters.count()} Kapitel, "
            f"{Scene.objects.filter(chapter__world=world).count()} Szenen, {world.quests.count()} Quests, "
            f"{world.events.count()} Ereignisse, {world.trivia.count()} Wissens-Einträge"
        )
        self.stdout.write(self.style.SUCCESS(f"Welt „{world.name}“ angelegt: {counts}."))
