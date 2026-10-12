"""Import a campaign book written in Markdown as a new world.

Expected layout of the book:
- "# 3 · ..."        islands (##) with their places (####)
- "# 5 · ..."        characters (###)
- "# N · Kapitel X"  chapters with "## Szenen", "## Quests", "## Ereignisse", "## Weltuhr"
- everything else becomes lore of the world
"""

import re
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from auth_app.models import User
from world.world_app.models import Chapter, Event, Location, Quest, Scene, TimelineEntry, World
from world.world_app.utils import create_world_npc

HEADING = re.compile(r"^(#{1,4})\s+(.+)$")
FIELD = re.compile(r"^-\s+\*\*(.+?)\*\*\s*(.*)$")
CHAPTER = re.compile(r"Kapitel\s+(\d+)\s*·?\s*(.*)$")
NAME_LENGTH = 200
STOP_WORDS = {"jarl", "könig", "krieger", "stimmen", "markt", "wirtin", "bruder", "tochter", "stadt", "taverne", "kneipe"}


def split_sections(text):
    """Return the document as a list of [level, title, body lines]."""
    sections = [[0, "", []]]
    for line in text.splitlines():
        match = HEADING.match(line)
        if match:
            sections.append([len(match.group(1)), match.group(2).strip(), []])
        else:
            sections[-1][2].append(line)
    return sections


def field(body, label):
    """Return the text of the first bullet whose bold label starts with the given word."""
    for line in body:
        match = FIELD.match(line.strip())
        if match and match.group(1).rstrip(":").lower().startswith(label.lower()):
            return match.group(2).strip()
    return ""


def clean_name(title, part=0):
    """Return one part of a heading split at " · ", without markers and numbering."""
    parts = title.replace("°", "").split(" · ")
    name = " · ".join(parts[part:]) if part else parts[0]
    return re.sub(r"^[\d.]+\s+", "", name).strip()[:NAME_LENGTH]


def table_rows(body):
    """Return the cells of every table row below the header."""
    rows = [line.strip().strip("|").split("|") for line in body if line.strip().startswith("|")]
    return [[cell.strip() for cell in row] for row in rows[2:]]


def telling_words(name):
    """Return the words of a name that are specific enough to recognise it."""
    return [word for word in re.findall(r"\w+", name.lower()) if len(word) > 3 and word not in STOP_WORDS]


def find_all(entries, text):
    """Return the entries whose name shares a telling word with the text."""
    low = text.lower()
    return [entry for entry in entries if any(word in low for word in telling_words(entry.name))]


def find_one(entries, text):
    """Return the entry named in the text, preferring a full name over single words."""
    low = text.lower()
    exact = [entry for entry in entries if entry.name.lower() in low]
    matches = sorted(exact, key=lambda entry: -len(entry.name)) or find_all(entries, text)
    return matches[0] if text and matches else None


class Command(BaseCommand):
    """Create a world with places, characters, chapters, scenes, quests and events from a Markdown file."""

    help = "Import a campaign book (Markdown) as a new world of the given game master."

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
        sections = split_sections(Path(options["file"]).read_text(encoding="utf-8"))
        self._start(owner, sections[1][1] if len(sections) > 1 else "Neue Welt")
        for level, title, body in sections[1:]:
            self._route(level, title, body)
        self.world.save()
        self._report()

    def _start(self, owner, name):
        """Create the empty world and the lists the import links against."""
        if World.objects.filter(owner=owner, name=name).exists():
            raise CommandError(f"Die Welt „{name}“ gibt es bei diesem Konto schon.")
        self.world = World.objects.create(owner=owner, name=name[:NAME_LENGTH])
        self.kind, self.h2, self.island, self.chapter = "lore", "", None, None
        self.locations, self.npcs, self.scene_count = [], [], 0

    def _route(self, level, title, body):
        """Send one section to the handler that fits its place in the book."""
        text = "\n".join(body).strip()
        if level == 1:
            self._top(title, text)
        elif level == 2:
            self._second(title, text, body)
        else:
            self._entry(level, title, text, body)

    def _top(self, title, text):
        """Start a main part: places, characters, a chapter or plain lore."""
        self.h2, chapter = "", CHAPTER.search(title)
        if chapter:
            self.kind = "chapter"
            self.chapter = Chapter.objects.create(
                world=self.world, number=int(chapter.group(1)), name=chapter.group(2)[:NAME_LENGTH] or title, text=text
            )
        elif title.startswith("3"):
            self.kind = "places"
        elif title.startswith("5"):
            self.kind = "npcs"
        else:
            self.kind = "lore"
            self._lore(1, title, text)

    def _second(self, title, text, body):
        """Handle a second-level heading inside the current main part."""
        self.h2 = title
        if self.kind == "places":
            self.island = self._location(title, text, None)
        elif self.kind == "chapter" and title.startswith("Weltuhr"):
            self._timeline(body)
        elif self.kind == "chapter" and title.startswith("Ereignisse"):
            self._event_table(body)
        elif self.kind == "chapter" and title not in ("Szenen", "Quests"):
            self._chapter_text(2, title, text)
        elif self.kind == "lore":
            self._lore(2, title, text)

    def _entry(self, level, title, text, body):
        """Handle a third- or fourth-level heading: one place, character, scene, quest or event."""
        if self.kind == "places" and level == 4:
            self._location(title, text, self.island)
        elif self.kind == "places":
            self._island_text(title, text)
        elif self.kind == "npcs" and level == 3:
            self._npc(title, text, body)
        elif self.kind == "chapter":
            self._chapter_entry(title, text, body)
        elif self.kind == "lore":
            self._lore(level, title, text)

    def _chapter_entry(self, title, text, body):
        """Create what the current chapter block holds: a scene, a quest or an event."""
        if self.h2 == "Szenen":
            self._scene(title, text, body)
        elif self.h2 == "Quests":
            self._quest(title, text, body)
        elif self.h2.startswith("Ereignisse"):
            self._event(clean_name(title), text, body)
        else:
            self._chapter_text(3, title, text)

    def _lore(self, level, title, text):
        """Append a block to the lore of the world."""
        self.world.lore += f"\n\n{'#' * level} {title}\n{text}"

    def _chapter_text(self, level, title, text):
        """Append a block to the text of the current chapter."""
        self.chapter.text += f"\n\n{'#' * level} {title}\n{text}"
        self.chapter.save()

    def _island_text(self, title, text):
        """Append a block about peoples or regions to the island it belongs to."""
        if self.island is None:
            return self._lore(3, title, text)
        self.island.lore += f"\n\n### {title}\n{text}"
        self.island.save()

    def _location(self, title, text, parent):
        """Create a place and remember it for linking."""
        location = Location.objects.create(world=self.world, parent=parent, name=clean_name(title), lore=text)
        self.locations.append(location)
        return location

    def _npc(self, title, text, body):
        """Create a character of the world with its description and phrases."""
        npc = create_world_npc(self.world, clean_name(title)).npc
        quotes = field(body, "Zitat")
        npc.description, npc.profession = text, field(body, "Rolle")[:NAME_LENGTH]
        npc.phrases = [quote.strip() for quote in quotes.split(" · ") if quote.strip()]
        npc.save()
        self.npcs.append(npc)

    def _scene(self, title, text, body):
        """Create a scene of the current chapter and link its place and characters."""
        scene = Scene.objects.create(
            chapter=self.chapter, position=self.scene_count, name=clean_name(title, 1) or clean_name(title),
            text=text, to_read=field(body, "Vorlesen"), location=find_one(self.locations, field(body, "Ort")),
        )
        scene.npcs.set(find_all(self.npcs, field(body, "Figuren")))
        self.scene_count += 1

    def _quest(self, title, text, body):
        """Create a quest, link it to the current chapter, its place and its characters."""
        steps = [step.strip("☑☐ ").strip() for step in field(body, "Schritte").split(" · ")]
        quest = Quest.objects.create(
            world=self.world, name=clean_name(title), kind="main" if "Hauptquest" in title else "side",
            text=field(body, "Spielertext") or text, goal=field(body, "SL-Ziel"), checklist=[s for s in steps if s],
            location=find_one(self.locations, field(body, "Ort")), giver=find_one(self.npcs, field(body, "Auftraggeber")),
        )
        quest.npcs.set(find_all(self.npcs, field(body, "Figuren")))
        self.chapter.quests.add(quest)

    def _event(self, name, text, body):
        """Create an event and link it to the current chapter and its place."""
        place = find_one(self.locations, field(body, "Ort"))
        event = Event.objects.create(world=self.world, name=name[:NAME_LENGTH], text=text, location=place)
        self.chapter.events.add(event)

    def _event_table(self, body):
        """Create one event per table row (name, type, what happens, consequences)."""
        for row in table_rows(body):
            cells = row + [""] * 4
            self._event(cells[0], f"{cells[1]}. {cells[2]} Folgen: {cells[3]}", [])

    def _timeline(self, body):
        """Create one timeline entry per table row (day, title, text)."""
        for row in table_rows(body):
            cells = row + [""] * 3
            day = int(cells[0]) if cells[0].isdigit() else 0
            TimelineEntry.objects.create(world=self.world, day=day, title=cells[1][:NAME_LENGTH], text=cells[2])

    def _report(self):
        """Tell the user what was created."""
        world = self.world
        counts = (
            f"{world.locations.count()} Orte, {world.world_npcs.count()} Figuren, {world.chapters.count()} Kapitel, "
            f"{Scene.objects.filter(chapter__world=world).count()} Szenen, {world.quests.count()} Quests, "
            f"{world.events.count()} Ereignisse, {world.timeline_entries.count()} Zeitleisten-Einträge"
        )
        self.stdout.write(self.style.SUCCESS(f"Welt „{world.name}“ angelegt: {counts}."))
