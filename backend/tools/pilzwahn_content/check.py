"""Read the Pilzwahn world back from the database and report every gap.

Usage: python3 check.py path/to/db.sqlite3
"""

import json
import re
import sqlite3
import sys

WORLD_ID = 4
CHAPTER_NUMBERS = (1, 2)
# Entries that belong to chapter 3 and stay untouched for now.
LATER = {"Die Schmiedin", "Der Schneider"}
# Fields that may stay empty because emptiness is what they mean.
ALLOWED_EMPTY = {("figur", "Sölvi, der Träumer", "location"), ("quest", "Dem Alchemisten auf der Spur", "giver"), ("quest", "Fort von Tvíborg", "giver")}
BAD_TEXT = re.compile(r"°|\[Offen|\*|^siehe |\bsiehe Ort\b|Status:|ausgelöst|Kapitel: ?\d|Auftritte", re.IGNORECASE | re.MULTILINE)
PROBLEMS = []


def report(kind, name, problem):
    """Remember one problem unless it is allowed."""
    if (kind, name, problem.split()[0]) not in ALLOWED_EMPTY:
        PROBLEMS.append(f"{kind:8} {name}: {problem}")


def scan_text(kind, name, value):
    """Report working markers left in a text, a JSON list or a dict."""
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    match = BAD_TEXT.search(text)
    if match:
        report(kind, name, f"Arbeitsmarker im Text: „{match.group(0)}“")


def require(kind, name, row, fields):
    """Report every field of a row that is empty."""
    for field in fields:
        value = row[field]
        if value in (None, "", "[]", "{}", 0) and not (field.endswith("points") and value == 0):
            report(kind, name, f"{field} leer")
        scan_text(kind, name, value or "")


def ids(db, sql, params=()):
    """Return the first column of a query as a set."""
    return {row[0] for row in db.execute(sql, params)}


def check(db):
    """Check world, places, NPCs, events, quests, glossary, chapters and scenes."""
    chapters = ids(db, f"SELECT id FROM world_app_chapter WHERE world_id = ? AND number IN {CHAPTER_NUMBERS}", (WORLD_ID,))
    marks = ",".join(str(c) for c in chapters)
    scene_npcs = ids(db, f"SELECT npc_id FROM world_app_scene_npcs JOIN world_app_scene s ON s.id = scene_id WHERE s.chapter_id IN ({marks})")
    scene_events = ids(db, f"SELECT event_id FROM world_app_scene_events JOIN world_app_scene s ON s.id = scene_id WHERE s.chapter_id IN ({marks})")
    scene_quests = ids(db, f"SELECT quest_id FROM world_app_scene_quests JOIN world_app_scene s ON s.id = scene_id WHERE s.chapter_id IN ({marks})")
    chapter_events = ids(db, f"SELECT event_id FROM world_app_chapter_events WHERE chapter_id IN ({marks})")
    chapter_quests = ids(db, f"SELECT quest_id FROM world_app_chapter_quests WHERE chapter_id IN ({marks})")

    world = db.execute("SELECT * FROM world_app_world WHERE id = ?", (WORLD_ID,)).fetchone()
    require("welt", world["name"], world, ["lore"])

    for row in db.execute("SELECT * FROM world_app_location WHERE world_id = ?", (WORLD_ID,)):
        require("ort", row["name"], row, ["description", "player_knowledge", "gm_knowledge", "symbol"])

    for row in db.execute("SELECT n.*, w.location_id AS location FROM character_app_npc n JOIN world_app_worldnpc w ON w.npc_id = n.id WHERE w.world_id = ?", (WORLD_ID,)):
        if row["name"] in LATER:
            continue
        require("figur", row["name"], row, ["description", "age", "gender", "profession", "phrases", "player_knowledge", "gm_knowledge", "skills", "symbol", "location"])
        if row["id"] not in scene_npcs:
            report("figur", row["name"], "in keiner Szene")

    for row in db.execute("SELECT * FROM world_app_event WHERE world_id = ?", (WORLD_ID,)):
        require("ereignis", row["name"], row, ["description", "player_knowledge", "gm_knowledge", "trigger", "happening", "dialogues", "location_id", "symbol"])
        if row["id"] not in scene_events:
            report("ereignis", row["name"], "in keiner Szene")
        if row["id"] not in chapter_events:
            report("ereignis", row["name"], "in keinem Kapitel")

    for row in db.execute("SELECT q.*, q.giver_id AS giver FROM world_app_quest q WHERE world_id = ?", (WORLD_ID,)):
        require("quest", row["name"], row, ["description", "goal", "checklist", "player_knowledge", "gm_knowledge", "dialogues", "location_id", "scene_id", "giver", "symbol"])
        if not db.execute("SELECT 1 FROM world_app_quest_npcs WHERE quest_id = ?", (row["id"],)).fetchone():
            report("quest", row["name"], "keine Figuren verknüpft")
        if row["id"] not in scene_quests:
            report("quest", row["name"], "in keiner Szene")
        if row["id"] not in chapter_quests:
            report("quest", row["name"], "in keinem Kapitel")

    for row in db.execute("SELECT * FROM world_app_trivia WHERE world_id = ?", (WORLD_ID,)):
        require("wissen", row["name"], row, ["description", "player_knowledge", "gm_knowledge", "category", "symbol"])
        links = sum(db.execute(f"SELECT COUNT(*) FROM {table} WHERE trivia_id = ?", (row["id"],)).fetchone()[0]
                    for table in ("world_app_trivia_locations", "world_app_trivia_npcs", "world_app_trivia_quests", "world_app_trivia_events", "world_app_scene_trivia"))
        if not links:
            report("wissen", row["name"], "mit nichts verknüpft")

    for row in db.execute(f"SELECT * FROM world_app_chapter WHERE id IN ({marks})"):
        require("kapitel", row["name"], row, ["text", "to_read"])

    for row in db.execute(f"SELECT * FROM world_app_scene WHERE chapter_id IN ({marks}) ORDER BY chapter_id, position"):
        require("szene", row["name"], row, ["text", "to_read", "location_id", "dialogues"])
        if row["optional"]:
            report("szene", row["name"], "ist optional")
        if not db.execute("SELECT 1 FROM world_app_scene_npcs WHERE scene_id = ?", (row["id"],)).fetchone():
            report("szene", row["name"], "keine Figuren (ok, wenn die Helden allein sind)")


def main(path):
    """Run the check and print the result."""
    db = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    db.row_factory = sqlite3.Row
    check(db)
    print("\n".join(PROBLEMS) if PROBLEMS else "Keine Probleme gefunden.")
    print(f"\n{len(PROBLEMS)} Meldungen.")


if __name__ == "__main__":
    main(sys.argv[1])
