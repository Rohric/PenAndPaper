"""One-off helper: turn the campaign book (Markdown) into the JSON the import command reads.

Usage, from backend/: python tools/build_pilzwahn.py tools/pilzwahn_book.md pilzwahn.json
The text is carried over word for word; only the links between entries are set here by hand.
"""

import json
import re
import sys
from pathlib import Path

HEADING = re.compile(r"^(#{1,4})\s+(.+)$")
LABEL = re.compile(r"^- \*\*(.+?)\*\*\s*(.*)$")
LORE_PARTS = ("1", "4", "9")
LISTS = ("Szenen", "Quests", "Ereignisse")
KNOWLEDGE = "Lore & Mächte"
# Pieces of an event that have their own field: what sets it off, and what happens then.
EVENT_FIELDS = ("Einsetzen, wenn", "Was passiert")

# ---- links set by hand ------------------------------------------------------------------------

GROUPS = {"Hafenstadt": "Die Hafenstadt", "Klippenstadt": "Klippenstadt"}
TRIVIA_CATEGORY = {"Die Jarltümer": KNOWLEDGE}
CHILD_OF = {
    "Das Langhaus von Skaldeby": "Skaldeby",
    "Das Stadttor von Björnsvig": "Björnsvig",
    "Kneipe Zum Bodenlosen Fass": "Björnsvig",
    "Das Bauernfeld vor der Stadt": "Björnsvig",
    "Der Festplatz": "Björnsvig",
    "Das Langhaus von Björnsvig": "Björnsvig",
    "Das Verlies von Björnsvig": "Björnsvig",
    "Der Brunnen von Drakkarheim": "Drakkarheim",
}
LOCATION_ALIASES = {
    "Riff & Wrackstrand": "Das Riff & der Wrackstrand",
    "Wrackstrand": "Das Riff & der Wrackstrand",
    "Verlies": "Das Verlies von Björnsvig",
}
NPC_ALIASES = {
    "Der Alchemist": "Der Alchemist (Svafnir)",
    "Alchemist": "Der Alchemist (Svafnir)",
    "Der Druide": "Der Alchemist (Svafnir)",
    "Jarl Thorgrim°": "Jarl Thorgrim° von Skaldeby",
    "Die Wirtin": "Die Wirtin vom Bodenlosen Fass",
    "Jarl Rotbart": "Jarl Rotbart Gelbrtson",
    "Stimmen auf dem Markt": "Stimmen auf dem Markt von Björnsvig",
    "Der dreibeinige Grizzly": "Der dreibeinige Grizzly (Gegner)",
    "Krieger aus Helheim": "Krieger aus Helheim (Gegner)",
    "Die Attentäter": "Die Attentäter (Gegner)",
    "Die Zurückgelassenen": "Die Zurückgelassenen (Gegner)",
    "Wirte": "Die Wirte (Gegnertyp)",
    "Sigrun": "Sigrun Hallsdóttir",
    "Hallvard": "Hallvard Silberzunge",
    "Bjarki": "König Bjarki",
    "Grimur": "Grimur Rußbart",
    "Bersi": "Bersi Einhand",
    "Ketill°": "Ketill Krummnase°",
    "Eyvind": "Eyvind Wachsfinger",
    "Hjördis": "Hjördis die Weberin",
    "Ulfr": "König Ulfr",
    "Arni": "Arni Hallsson",
}
# Linked, but the line stays in the text because it says more than the link does.
NPC_LOOSE = {
    "Der Alchemist (als „der Druide“)": "Der Alchemist (Svafnir)",
    "Jarl Reiner als letzter Krieger°": "Jarl Reiner von Drakkarheim",
}
NPC_LOCATION = {
    "Jarl Thorgrim° von Skaldeby": "Das Langhaus von Skaldeby",
    "Eddy": "Das Stadttor von Björnsvig",
    "Die Wirtin vom Bodenlosen Fass": "Kneipe Zum Bodenlosen Fass",
    "Jarl Rotbart Gelbrtson": "Der Festplatz",
    "Jira Rotbartdóttir": "Das Langhaus von Björnsvig",
    "Die Leibgardin": "Das Verlies von Björnsvig",
    "Stimmen auf dem Markt von Björnsvig": "Björnsvig",
    "Jarl Reiner von Drakkarheim": "Drakkarheim",
    "Astrid Reinersdóttir": "Drakkarheim",
    "Der dreibeinige Grizzly (Gegner)": "Der Rastplatz am Waldrand",
    "Krieger aus Helheim (Gegner)": "Die Straße nach Björnsvig",
    "Die Attentäter (Gegner)": "Das Bauernfeld vor der Stadt",
    "Die Zurückgelassenen (Gegner)": "Drakkarheim",
    "Sigrun Hallsdóttir": "Das Wachhaus°",
    "Kalle": "Das Haupttor",
    "Hallvard Silberzunge": "Die Bärenhalle",
    "König Bjarki": "Die Bärenhalle",
    "Tove": "Taverne Halbes Horn",
    "Ylva": "Taverne Halbes Horn",
    "Bersi Einhand": "Taverne Halbes Horn",
    "Grimur Rußbart": "Grimurs Schmiede",
    "Eyvind Wachsfinger": "Taverne Halbes Horn",
    "Ketill Krummnase°": "Die Hafenstadt",
    "Hjördis die Weberin": "Das Weberhaus",
    "König Ulfr": "Die Wolfshalle",
    "Arni Hallsson": "Die Senke",
    "Torvi": "Die Senke",
    "Die Schmiedin": "Ulmar",
    "Der Schneider": "Ulmar",
}
SCENE_LOCATION = {"Der Gang der Schmuggler": "Der Schmugglergang"}
EVENT_LOCATION = {
    "Der dreibeinige Grizzly": "Der Rastplatz am Waldrand",
    "Der Kopf des Bruders": "Skaldeby",
    "Aufruhr im Thing": "Das Langhaus von Skaldeby",
    "Banditen aus Helheim": "Die Straße nach Björnsvig",
    "Die Nacht auf dem Feld": "Das Bauernfeld vor der Stadt",
    "Das vergiftete Siegerbier": "Der Festplatz",
    "Die Maske fällt": "Björnsvig",
    "Ritt auf der Bestie": "Björnsvig",
    "Die Brunnen von Drakkarheim": "Der Brunnen von Drakkarheim",
}

# ---- text ------------------------------------------------------------------------------------


def clean(text):
    """Remove the Markdown marks from one line and keep the words."""
    text = re.sub(r"^\* \[x\] ", "☑ ", text)
    text = re.sub(r"^\* \[ \] ", "☐ ", text)
    text = re.sub(r"^\* ", "- ", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"\1", text)
    return text.rstrip()


def squeeze(lines):
    """Join lines and reduce runs of empty lines to one."""
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def cells(line):
    """Return the cells of one table row."""
    return [clean(cell.strip()) for cell in line.strip().strip("|").split("|")]


def table_text(rows):
    """Turn a table into plain lines: one block per row, one line per filled cell."""
    header, out = rows[0], []
    numbered = header[0] in ("W12", "#")
    start = 2 if numbered else 1
    for row in rows[2:]:
        out.append(f"{row[0]}. {row[1]}" if numbered else row[0])
        out += [f"  {label}: {cell}" for label, cell in zip(header[start:], row[start:]) if cell not in ("", "–")]
        out.append("")
    return out


def plain(body, tables=True):
    """Return a block of the book as plain text."""
    out, table = [], []
    for line in list(body) + [""]:
        if line.strip().startswith("|"):
            table.append(cells(line))
            continue
        if table:
            out += table_text(table) if tables else []
            table = []
        if line.strip() == "---":
            continue
        if line.strip().startswith(">"):
            line = line.strip()[1:].strip()
        match = LABEL.match(line)
        out.append(clean(f"{match.group(1)} {match.group(2)}" if match else line))
    return squeeze(out)


def table_rows(body):
    """Return the data rows of the first table in a block."""
    rows = [cells(line) for line in body if line.strip().startswith("|")]
    return rows[2:]


def entry_parts(body):
    """Split an entry into [label, lines] blocks; free lines get the label None."""
    parts = []
    for line in body:
        match = LABEL.match(line)
        if match:
            parts.append([match.group(1).rstrip(":"), [match.group(2)]])
        elif line.startswith("  ") and line.strip() and parts and parts[-1][0] is not None:
            parts[-1][1].append(line)
        elif line.strip() and line.strip() != "---":
            parts.append([None, [line]])
    return parts


def part(parts, *labels):
    """Return the first line of the first block with one of the labels."""
    for label, lines in parts:
        if label in labels:
            return clean(lines[0])
    return ""


def render(parts, skip=()):
    """Return the blocks as plain text, without the skipped labels."""
    out = []
    for label, lines in parts:
        if label in skip:
            continue
        first = clean(lines[0]) if label is None else f"{label}: {clean(lines[0])}".rstrip()
        out += [first] + [clean(line) for line in lines[1:]]
    return "\n".join(out)


def piece(title, text):
    """Return one piece of knowledge."""
    return {"title": title, "text": text}


def block_text(lines):
    """Return the lines of one block as text."""
    return "\n".join(clean(line) for line in lines).strip()


def sort_texts(parts, shown=(), player=None, free="description"):
    """Sort the blocks of an entry: description, knowledge for players, knowledge of the game master.

    shown: labels that belong to the description. player: label -> title of each piece; the block is
    split at " · " into single pieces. free: where lines without a label go ("description" or "gm").
    """
    description, known, secret = [], [], []
    for label, lines in parts:
        text = block_text(lines)
        hidden = re.match(r"^(SL[^:]{0,20}|Status):\s*(.+)$", text, re.S) if label is None else None
        if hidden:
            secret.append(piece(hidden.group(1), hidden.group(2).strip()))
        elif label is None:
            (description if free == "description" else secret).append(text if free == "description" else piece("", text))
        elif label in shown:
            description.append(text)
        elif label in (player or {}):
            known += [piece(player[label], part.strip()) for part in text.split(" · ") if part.strip()]
        elif text:
            secret.append(piece(label, text))
    return {"description": "\n\n".join(description), "player_knowledge": known, "gm_knowledge": secret}


def phrase(quote):
    """Split what stands before a quotation off as its trigger."""
    match = re.match(r"^([^„“]+?):\s*(„.+)$", quote)
    return {"trigger": match.group(1), "text": match.group(2)} if match else {"trigger": "", "text": quote}


def sections(text):
    """Return the book as a list of [level, title, body lines]."""
    found = [[0, "", []]]
    for line in text.splitlines():
        match = HEADING.match(line)
        if match:
            found.append([len(match.group(1)), match.group(2).strip(), []])
        else:
            found[-1][2].append(line)
    return found


# ---- links -----------------------------------------------------------------------------------


class Book:
    """Collect the entries of the world while walking through the book."""

    def __init__(self):
        self.data = {"name": "", "lore": "", "locations": [], "npcs": [], "quests": [], "events": [],
                     "trivia": [], "chapters": []}
        self.kept = []

    # places

    def location_names(self):
        """Return every way a place may be named in the book."""
        table = dict(LOCATION_ALIASES)
        for location in self.data["locations"]:
            name = location["name"]
            bare = name.replace("°", "")
            short = re.sub(r"^(Der|Die|Das) ", "", bare)
            for variant in (name, bare, short, re.sub(r"^(Taverne|Kneipe) ", "", short)):
                table.setdefault(variant, name)
        return table

    def ancestors(self, name):
        """Return the names of the places the given place lies in."""
        parents = {location["name"]: location.get("parent") for location in self.data["locations"]}
        found = []
        while parents.get(name):
            name = parents[name]
            found.append(name)
        return found

    def place(self, text, choice=None):
        """Return (place to link, True when the link says everything the text says)."""
        names = self.location_names()
        pieces = [piece.strip() for piece in re.split(r", | · | → | oder ", text) if piece.strip()]
        found = [names[piece] for piece in pieces if piece in names]
        if not pieces:
            return None, True
        if choice:
            return choice, False
        if len(found) < len(pieces):
            return (found[0] if found else None), False
        deepest = max(found, key=lambda name: len(self.ancestors(name)))
        nested = all(name == deepest or name in self.ancestors(deepest) for name in found)
        return (deepest, True) if nested else (found[0], False)

    def people(self, text):
        """Return (characters to link, True when the links say everything the text says)."""
        names = {npc["name"]: npc["name"] for npc in self.data["npcs"]} | NPC_ALIASES
        found, complete = [], True
        for piece in [piece.strip() for piece in text.split(", ") if piece.strip()]:
            name = names.get(piece) or NPC_LOOSE.get(piece)
            complete = complete and piece in names
            if name and name not in found:
                found.append(name)
        return found, complete

    def keep(self, where, line):
        """Remember a line that stays in the text because it could not be linked completely."""
        self.kept.append(f"{where}: {line}")

    # world

    def lore(self, level, title, body):
        """Append a block to the lore of the world."""
        head = clean(title).upper() if level == 1 else clean(title)
        gap = "\n\n" if level == 1 else "\n"
        self.data["lore"] = squeeze([self.data["lore"], "", head + gap + plain(body)])

    def knowledge(self, title, body, category, locations=()):
        """Add a knowledge entry; what follows the name in the heading opens its text."""
        names = [clean(part) for part in title.split(" · ")]
        secret = [line for line in body if re.match(r"^(- )?\*\*(SL|Status)", line.strip())]
        texts = sort_texts(entry_parts(secret))
        texts["description"] = "\n".join(line for line in [" · ".join(names[1:]), plain([l for l in body if l not in secret])] if line)
        self.data["trivia"].append({"name": names[0], "category": category, **texts,
                                    "locations": list(locations), "npcs": [], "quests": [], "events": []})

    def items(self, body):
        """Add one knowledge entry per item, linked to where it is found and to who owns it."""
        labels = ("Beschreibung", "Wert", "Fundort", "Besitzer", "SL")
        for name, *rest in table_rows(body):
            secret = [piece(label, cell) for label, cell in zip(labels[1:], rest[1:]) if cell not in ("", "–")]
            place, _ = self.place(rest[2])
            owners, _ = self.people(rest[3])
            self.data["trivia"].append({"name": name, "category": "Gegenstand", "description": rest[0],
                                        "player_knowledge": [], "gm_knowledge": secret,
                                        "locations": [place] if place else [], "npcs": owners, "quests": [], "events": []})

    def island(self, title, body):
        """Add an island as a place of the top level."""
        self.data["locations"].append({"name": re.sub(r"^[\d.]+\s+", "", clean(title)), **self.place_texts(body)})
        self.group = None

    def island_block(self, title, body):
        """Add a people of the island as knowledge, or start a group of places."""
        if plain(body):
            category = TRIVIA_CATEGORY.get(clean(title), "Volk")
            self.knowledge(title, body, category, [self.island_name])
            return
        self.group = GROUPS.get(title)
        if title == "Klippenstadt":
            self.data["locations"].append({"name": "Klippenstadt", "parent": self.island_name, **self.place_texts([])})

    def location(self, title, body):
        """Add a place below its town, its group or its island."""
        name = clean(title)
        parent = CHILD_OF.get(name) or self.group or self.island_name
        if parent == name:
            parent = self.island_name
        self.data["locations"].append({"name": name, "parent": parent, **self.place_texts(body)})

    def place_texts(self, body):
        """Sort what the book says about a place: what the players perceive, what they can find out, the rest."""
        hints = {"Hinweise": "Hinweis", "Gerüchte & Infos": "Gerücht"}
        texts = sort_texts(entry_parts(body), shown=("Vorlesen",), player=hints)
        there = [p for p in texts["gm_knowledge"] if p["title"] == "Hier gibt’s"]
        texts["player_knowledge"] = there + texts["player_knowledge"]
        texts["gm_knowledge"] = [p for p in texts["gm_knowledge"] if p not in there]
        return texts

    def npc(self, title, body):
        """Add a character with profession, description, phrases and place."""
        pieces = [clean(piece) for piece in title.split(" · ")]
        parts, name, extra = entry_parts(body), pieces[0], " · ".join(pieces[1:])
        profession = part(parts, "Rolle")
        quotes = part(parts, "Zitate", "Zitat")
        told = {"Weiß": "", "Weiß (Pflichtdialog)": "", "Der alte Händler": "Der alte Händler", "Der Bauer": "Der Bauer",
                "Der Krieger aus Drakkarheim": "Der Krieger aus Drakkarheim"}
        kept = [block for block in parts if block[0] not in ("Rolle", "Zitate", "Zitat")]
        texts = sort_texts(kept, shown=("Aussehen",), player=told, free="gm")
        if extra and extra not in profession:
            texts["gm_knowledge"].insert(0, piece("", extra))
        self.data["npcs"].append({
            "name": name, "profession": profession, **texts,
            "phrases": [phrase(quote.strip()) for quote in quotes.split(" · ") if quote.strip()],
            "location": NPC_LOCATION.get(name),
        })

    # chapters

    def chapter(self, number, name, body):
        """Start a chapter."""
        self.current = {"number": number, "name": name, "text": plain(body), "to_read": "", "quests": [],
                        "events": [], "scenes": []}
        self.data["chapters"].append(self.current)

    def chapter_block(self, title, body, tables=True):
        """Append a block to the text of the current chapter."""
        text = plain(body, tables)
        if text:
            self.current["text"] = squeeze([self.current["text"], "", clean(title).upper(), text])

    def world_clock(self, title, body):
        """Write the world clock into the text of the chapter, one line per day."""
        lines = [f"Tag {day} · {name}: {text}" for day, name, text in table_rows(body)]
        self.current["text"] = squeeze([self.current["text"], "", clean(title).upper(), plain(body, False), "", *lines])

    def scene(self, title, body, numbers):
        """Add a scene with its place, its characters, the text to read and the scenes it leads to."""
        parts, name = entry_parts(body), numbers[title.split(" · ")[0]]
        location, exact = self.place(part(parts, "Ort"), SCENE_LOCATION.get(name))
        npcs, complete = self.people(part(parts, "Figuren"))
        skip = ["Vorlesen", "Vorlesen (Leibgardin)"] + (["Ort"] if exact else []) + (["Figuren"] if complete else [])
        for label in ("Ort", "Figuren"):
            if label not in skip:
                self.keep(f"Szene {name}", f"{label}: {part(parts, label)}")
        leads_to = self.next_scenes(parts, numbers, skip)
        read = [part(parts, "Vorlesen")] + [f"Leibgardin: {part(parts, 'Vorlesen (Leibgardin)')}"]
        self.current["scenes"].append({
            "name": name, "optional": title.endswith("(optional)"), "text": render(parts, skip),
            "to_read": "\n\n".join(text for text in read if text and text != "Leibgardin: "),
            "location": location, "npcs": npcs, "leads_to": leads_to,
        })

    def next_scenes(self, parts, numbers, skip):
        """Return the scenes the line "Weiter" names; the line stays when it names more than scenes."""
        for block in parts:
            if block[0] == "Weiter":
                pieces = block[1][0].split(", ")
                found = [numbers[piece] for piece in pieces if piece in numbers]
                block[1][0] = ", ".join(numbers.get(piece, piece) for piece in pieces)
                skip += ["Weiter"] if len(found) == len(pieces) else []
                return found
        return []

    def quest(self, title, body):
        """Add a quest with player text, goal, checklist and links."""
        pieces, parts = [clean(piece) for piece in title.split(" · ")], entry_parts(body)
        place_text = part(parts, "Ort")
        location, exact = self.place(place_text.split(" · auch:")[0])
        npcs, complete = self.people(part(parts, "Figuren"))
        skip = ["Spielertext", "SL-Ziel", "Schritte", "Auftraggeber", "Auftraggeberin"]
        skip += ["Ort"] if exact and "auch:" not in place_text else []
        skip += ["Figuren"] if complete else []
        giver, known = self.people(part(parts, "Auftraggeber", "Auftraggeberin"))
        assert known and len(giver) <= 1, title
        skip.remove("SL-Ziel")
        texts = sort_texts([block for block in parts if block[0] not in skip])
        texts["gm_knowledge"].append(piece("Status", " · ".join(pieces[2:])))
        texts["description"] = part(parts, "Spielertext")
        steps = [step.strip("☑☐ ").strip() for step in part(parts, "Schritte").split(" · ")]
        main = pieces[1] == "Hauptquest"
        earlier = sum(1 for quest in self.data["quests"] if quest["kind"] == "main")
        self.data["quests"].append({
            "name": pieces[0], "kind": "main" if main else "side", "number": earlier + 1 if main else None,
            "goal": "", **texts,
            "checklist": [step for step in steps if step], "location": location,
            "giver": giver[0] if giver else None, "npcs": npcs,
        })
        self.current["quests"].append(pieces[0])

    def event(self, title, body):
        """Add an event of the second chapter; further places, characters and quests stay in its text."""
        pieces, parts = [clean(piece) for piece in title.split(" · ")], entry_parts(body)
        places = part(parts, "Orte").split(" · ")[0]
        location, _ = self.place(places)
        texts = sort_texts(parts, shown=("Vorlesen",))
        texts["gm_knowledge"].insert(0, piece("Art", " · ".join(pieces[1:])))
        self._event(pieces[0], texts, location)

    def event_table(self, body):
        """Add one event per table row of the first chapter."""
        for name, kind, what, result, state in table_rows(body):
            secret = [piece("Typ", kind), piece("Was passiert", what), piece("Folgen", result), piece("Status", state)]
            texts = {"description": "", "player_knowledge": [], "gm_knowledge": secret}
            self._event(name, texts, EVENT_LOCATION[name])

    def _event(self, name, texts, location):
        """Store an event and link it to the current chapter; trigger and what happens get their own fields."""
        secret = texts["gm_knowledge"]
        taken = {title: next((p["text"] for p in secret if p["title"] == title), "") for title in EVENT_FIELDS}
        texts["gm_knowledge"] = [p for p in secret if p["title"] not in EVENT_FIELDS]
        self.data["events"].append({
            "name": name, **texts, "trigger": taken["Einsetzen, wenn"], "happening": taken["Was passiert"],
            "location": location,
        })
        self.current["events"].append(name)


def scene_numbers(found, start):
    """Return the names of the scenes of one chapter by their number, without the mark "(optional)"."""
    numbers = {}
    for level, title, _ in found[start + 1:]:
        if level == 1:
            break
        if level == 3 and re.match(r"^\d+b? · ", title):
            number, name = title.split(" · ", 1)
            numbers[number] = re.sub(r" \(optional\)$", "", clean(name))
    return numbers


def build(text):
    """Walk through the book and return the world."""
    book, found = Book(), sections(text)
    kind, second, numbers = "", "", {}
    book.data["name"] = found[1][1]
    book.data["lore"] = plain(found[1][2])
    for index, (level, title, body) in enumerate(found[2:], start=2):
        if level == 1:
            second, chapter = "", re.search(r"Kapitel\s+(\d+)\s*·\s*(.+)$", title)
            kind = ("chapter" if chapter else "places" if title.startswith("3") else "npcs" if title.startswith("5")
                    else "knowledge" if title.startswith("2") else "lore")
            if chapter:
                book.chapter(int(chapter.group(1)), chapter.group(2), body)
                numbers = scene_numbers(found, index)
            elif title.startswith("6"):
                book.items(body)
                book.lore(1, title, [line for line in body if not line.strip().startswith("|")])
            elif kind == "lore" and title.startswith(LORE_PARTS):
                book.lore(1, title, body)
        elif kind == "lore" and title != "Inhalt":
            book.lore(level, title, body)
        elif kind == "knowledge" and level == 2:
            book.knowledge(title, body, KNOWLEDGE)
        elif kind == "places" and level == 2:
            book.island(title, body)
            book.island_name = book.data["locations"][-1]["name"]
        elif kind == "places" and level == 3:
            book.island_block(title, body)
        elif kind == "places":
            book.location(title, body)
        elif kind == "npcs" and level == 3:
            book.npc(title, body)
        elif kind == "chapter" and level == 2:
            second = title
            if title.startswith("Weltuhr"):
                book.world_clock(title, body)
                continue
            if title.startswith("Ereignisse"):
                book.event_table(body)
            book.chapter_block(title, body, tables=not title.startswith(LISTS))
        elif kind == "chapter" and second == "Szenen":
            book.scene(title, body, numbers)
        elif kind == "chapter" and second == "Quests":
            book.quest(title, body)
        elif kind == "chapter" and second.startswith("Ereignisse"):
            book.event(title, body)
    return book


if __name__ == "__main__":
    source, target = Path(sys.argv[1]), Path(sys.argv[2])
    result = build(source.read_text(encoding="utf-8"))
    waiting, ordered = result.data["locations"], []
    while waiting:
        known = {place["name"] for place in ordered}
        ready = next(place for place in waiting if place.get("parent") in known or not place.get("parent"))
        waiting.remove(ready)
        ordered.append(ready)
    result.data["locations"] = ordered
    target.write_text(json.dumps(result.data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    world = result.data
    names = [entry["name"] for entry in world["trivia"]]
    assert len(names) == len(set(names)), "doppelte Namen im Wissen"
    print(f"{len(world['locations'])} Orte, {len(world['npcs'])} Figuren, {len(world['quests'])} Quests, "
          f"{len(world['events'])} Ereignisse, {len(world['trivia'])} Wissen, "
          f"{[len(chapter['scenes']) for chapter in world['chapters']]} Szenen")
    kinds = {"Orte": world["locations"], "Figuren": world["npcs"], "Quests": world["quests"],
             "Ereignisse": world["events"], "Wissen": world["trivia"]}
    for label, entries in kinds.items():
        shown = sum(1 for entry in entries if entry["description"])
        known = sum(len(entry["player_knowledge"]) for entry in entries)
        secret = sum(len(entry["gm_knowledge"]) for entry in entries)
        print(f"  {label:11} {len(entries):3} Einträge | mit Beschreibung {shown:3} | Spieler-Wissen {known:3} | SL-Wissen {secret:3}")
    for chapter in world["chapters"]:
        for scene in chapter["scenes"]:
            if scene["optional"] or scene["leads_to"]:
                print(f"  K{chapter['number']} {scene['name']}{' (optional)' if scene['optional'] else ''} -> {scene['leads_to']}")
    print("  Auslöser:", [p["trigger"] for npc in world["npcs"] for p in npc["phrases"] if p["trigger"]])
    print("  Lore-Abschnitte:", re.findall(r"^\d · [^\n]+$", world["lore"], re.M))
    print("  Weltuhr im Kapitel 2:", "WELTUHR" in world["chapters"][1]["text"], "| Tag 10" in world["chapters"][1]["text"] or "Tag 10 ·" in world["chapters"][1]["text"])
