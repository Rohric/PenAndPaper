"""Write the campaign book of Pilzwahn as Markdown, read straight from the database.

Usage: python3 export.py path/to/db.sqlite3 path/to/pilzwahn.md
"""

import json
import sqlite3
import sys

WORLD_ID = 4


def _pieces(raw):
    """Return knowledge pieces as Markdown bullet lines."""
    return [f"- **{piece['title']}:** {piece['text']}" if piece["title"] else f"- {piece['text']}" for piece in json.loads(raw)]


def _names(db, sql, params):
    """Return the names of linked rows, joined with commas."""
    return ", ".join(row[0] for row in db.execute(sql, params)) or "–"


def _dialogues(raw, npcs):
    """Return dialogues as Markdown lines with the speaker in bold."""
    lines = []
    for dialogue in json.loads(raw):
        lines.append(f"*{dialogue['title']}*")
        lines += [f"> **{npcs.get(line['npc'], '')}:** {line['text']}" if line["npc"] else f"> {line['text']}" for line in dialogue["lines"]]
        lines.append("")
    return lines


def _block(title, level, parts):
    """Return a heading with its non-empty parts."""
    return [f"{'#' * level} {title}", ""] + [part for part in parts if part is not None] + [""]


def export_world(db, out):
    """Write lore, places and glossary."""
    out += _block("Pilzwahn", 1, ["> Kampagnenbuch für Spielleiter · How to be a Hero · erzeugt aus der Datenbank", "", db.execute("SELECT lore FROM world_app_world WHERE id = ?", (WORLD_ID,)).fetchone()[0]])
    out += ["# Orte", ""]
    for row in db.execute("SELECT l.*, p.name AS parent FROM world_app_location l LEFT JOIN world_app_location p ON p.id = l.parent_id WHERE l.world_id = ? ORDER BY l.id", (WORLD_ID,)):
        out += _block(row["name"], 3, [f"*liegt in: {row['parent'] or '–'}*", "", row["description"], "", *_pieces(row["player_knowledge"]), *_pieces(row["gm_knowledge"])])
    out += ["# Glossar", ""]
    for row in db.execute("SELECT * FROM world_app_trivia WHERE world_id = ? ORDER BY category, id", (WORLD_ID,)):
        out += _block(f"{row['name']} · {row['category']}", 3, [row["description"], "", *_pieces(row["player_knowledge"]), *_pieces(row["gm_knowledge"])])


def export_npcs(db, out, npcs):
    """Write every NPC with knowledge, phrases and values."""
    out += ["# Figuren", ""]
    sql = "SELECT n.*, l.name AS place FROM character_app_npc n JOIN world_app_worldnpc w ON w.npc_id = n.id LEFT JOIN world_app_location l ON l.id = w.location_id WHERE w.world_id = ? ORDER BY n.id"
    for row in db.execute(sql, (WORLD_ID,)):
        skills = ", ".join(f"{skill['name']} {skill['points']}" for skill in json.loads(row["skills"])) or "–"
        items = ", ".join(f"{item['name']}" + (f" ({item['damage_dice']}W10+{item['damage_bonus']})" if item["damage_dice"] else "") for item in json.loads(row["inventory"])) or "–"
        phrases = [f"- *{phrase['trigger']}:* {phrase['text']}" for phrase in json.loads(row["phrases"])]
        out += _block(row["name"], 3, [f"*{row['profession']} · {row['age']} · {row['gender']} · Ort: {row['place'] or '–'}*", "", row["description"], "",
                                        *_pieces(row["player_knowledge"]), *_pieces(row["gm_knowledge"]), "", "**Sätze**", *phrases, "",
                                        f"**Werte:** LP {row['life_points']}/{row['max_life_points']} · {skills}", f"**Inventar:** {items}"])


def export_chapter(db, out, chapter, npcs):
    """Write one chapter with its scenes, events and quests."""
    out += _block(f"Kapitel {chapter['number']} · {chapter['name']}", 1, ["**Zum Vorlesen**", "", chapter["to_read"], "", chapter["text"]])
    out += ["## Szenen", ""]
    for scene in db.execute("SELECT s.*, l.name AS place FROM world_app_scene s LEFT JOIN world_app_location l ON l.id = s.location_id WHERE chapter_id = ? ORDER BY position", (chapter["id"],)):
        links = [f"- **Ort:** {scene['place']}",
                 f"- **Figuren:** {_names(db, 'SELECT n.name FROM world_app_scene_npcs x JOIN character_app_npc n ON n.id = x.npc_id WHERE x.scene_id = ?', (scene['id'],))}",
                 f"- **Quests:** {_names(db, 'SELECT q.name FROM world_app_scene_quests x JOIN world_app_quest q ON q.id = x.quest_id WHERE x.scene_id = ?', (scene['id'],))}",
                 f"- **Ereignisse:** {_names(db, 'SELECT e.name FROM world_app_scene_events x JOIN world_app_event e ON e.id = x.event_id WHERE x.scene_id = ?', (scene['id'],))}",
                 f"- **Wissen:** {_names(db, 'SELECT t.name FROM world_app_scene_trivia x JOIN world_app_trivia t ON t.id = x.trivia_id WHERE x.scene_id = ?', (scene['id'],))}"]
        out += _block(f"{scene['position'] + 1} · {scene['name']}", 3, [*links, "", "**Zum Vorlesen**", "", scene["to_read"], "", "**Ablauf**", "", scene["text"], "", *_dialogues(scene["dialogues"], npcs)])
    out += ["## Ereignisse", ""]
    for event in db.execute("SELECT e.*, l.name AS place FROM world_app_event e JOIN world_app_chapter_events x ON x.event_id = e.id LEFT JOIN world_app_location l ON l.id = e.location_id WHERE x.chapter_id = ?", (chapter["id"],)):
        out += _block(event["name"], 3, [f"*Ort: {event['place']}*", "", f"- **Auslöser:** {event['trigger']}", f"- **Was passiert:** {event['happening']}", f"- **Für Spieler:** {event['description']}",
                                         *_pieces(event["player_knowledge"]), *_pieces(event["gm_knowledge"]), "", *_dialogues(event["dialogues"], npcs)])
    out += ["## Quests", ""]
    for quest in db.execute("SELECT q.*, n.name AS giver_name FROM world_app_quest q JOIN world_app_chapter_quests x ON x.quest_id = q.id LEFT JOIN character_app_npc n ON n.id = q.giver_id WHERE x.chapter_id = ?", (chapter["id"],)):
        kind = "Hauptquest" if quest["kind"] == "main" else "Nebenquest"
        steps = [f"- [ ] {step}" for step in json.loads(quest["checklist"])]
        out += _block(f"{quest['name']} · {kind}", 3, [f"*Auftraggeber: {quest['giver_name'] or '–'}*", "", quest["description"], "", f"**Ziel:** {quest['goal']}", "", *steps, "",
                                                         *_pieces(quest["player_knowledge"]), *_pieces(quest["gm_knowledge"]), "", *_dialogues(quest["dialogues"], npcs)])


def main(path, target):
    """Read the database and write the book."""
    db = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    db.row_factory = sqlite3.Row
    npcs = {row[0]: row[1] for row in db.execute("SELECT id, name FROM character_app_npc")}
    out = []
    export_world(db, out)
    export_npcs(db, out, npcs)
    for chapter in db.execute("SELECT * FROM world_app_chapter WHERE world_id = ? AND number IN (1, 2) ORDER BY number", (WORLD_ID,)).fetchall():
        export_chapter(db, out, chapter, npcs)
    with open(target, "w", encoding="utf-8") as file:
        file.write("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
