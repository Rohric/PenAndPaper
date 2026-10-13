"""Write the Pilzwahn content into the SQLite database of the game master tool.

Usage: python3 load.py path/to/db.sqlite3
Everything runs in one transaction; any unknown name aborts the whole run without a change.
"""

import json
import sqlite3
import sys

import content_ch1 as ch1
import content_ch2 as ch2
from content_npcs import NPCS
from content_world import LOCATIONS, TRIVIA, WORLD_LORE

WORLD_ID = 4
OWNER_ID = 3
CHAPTERS = (ch1, ch2)
DELETE_SCENES = ["Der Wolfspass"]
DELETE_EVENTS = ["Der Bär am Pass", "Die Sünde des Guten", "Nur noch Bestie"]
ERRORS = []


def _json(value):
    """Return a value as JSON text the way Django stores it."""
    return json.dumps(value, ensure_ascii=False)


def _resolve(ids, name, kind):
    """Return the id of a named entry, or None for no name; remember unknown names."""
    if name is None:
        return None
    if name not in ids:
        ERRORS.append(f"{kind} unbekannt: {name}")
        return None
    return ids[name]


def _find(db, sql, names, params):
    """Return the id of the first row whose name is one of the given names."""
    for name in names:
        row = db.execute(sql, (*params, name)).fetchone()
        if row:
            return row[0]
    return None


def _upsert(db, table, row_id, fields):
    """Update a row by id, or insert it when there is none; return its id."""
    columns = list(fields)
    if row_id:
        sets = ", ".join(f'"{column}" = ?' for column in columns)
        db.execute(f'UPDATE "{table}" SET {sets} WHERE id = ?', (*fields.values(), row_id))
        return row_id
    marks = ", ".join("?" for _ in columns)
    names = ", ".join(f'"{column}"' for column in columns)
    return db.execute(f'INSERT INTO "{table}" ({names}) VALUES ({marks})', tuple(fields.values())).lastrowid


def _names(entry):
    """Return the names an entry may have in the database: old name first."""
    return [name for name in (entry.get("old"), entry["name"]) if name]


def _world_entry(db, table, entry, fields):
    """Insert or update an entry that belongs to the world, matched by its name."""
    row_id = _find(db, f'SELECT id FROM "{table}" WHERE world_id = ? AND name = ?', _names(entry), (WORLD_ID,))
    return _upsert(db, table, row_id, {"world_id": WORLD_ID, "name": entry["name"], **fields})


def _texts(entry):
    """Return the texts every entry shares."""
    return {
        "description": entry["description"],
        "player_knowledge": _json(entry["pk"]),
        "gm_knowledge": _json(entry["gm"]),
        "symbol": entry.get("symbol", ""),
    }


def load_locations(db):
    """Write all places, then hang each one under its parent."""
    ids = {entry["name"]: _world_entry(db, "world_app_location", entry, _texts(entry)) for entry in LOCATIONS}
    for entry in LOCATIONS:
        parent = _resolve(ids, entry["parent"], "Ort")
        db.execute("UPDATE world_app_location SET parent_id = ? WHERE id = ?", (parent, ids[entry["name"]]))
    return ids


def _npc_fields(entry):
    """Return the columns of one NPC, with life points and the skill budget derived from its values."""
    life = entry.get("life_points", 100)
    return {
        "name": entry["name"], "age": entry["age"], "gender": entry["gender"], "profession": entry["profession"],
        "description": entry["description"], "life_points": life, "max_life_points": max(life, 100),
        "skill_points_total": sum(skill["points"] for skill in entry["skills"]), "bonus_points_total": 0,
        "skills": _json(entry["skills"]), "inventory": _json(entry["inventory"]), "phrases": _json(entry["phrases"]),
        "special_abilities": _json(entry["abilities"]), "player_knowledge": _json(entry["pk"]),
        "gm_knowledge": _json(entry["gm"]), "symbol": entry["symbol"], "owner_id": OWNER_ID,
    }


def load_npcs(db, locations):
    """Write all NPCs and attach each one to the world and its home place."""
    sql = "SELECT n.id FROM character_app_npc n JOIN world_app_worldnpc w ON w.npc_id = n.id WHERE w.world_id = ? AND n.name = ?"
    ids = {}
    for entry in NPCS:
        npc_id = _find(db, sql, _names(entry), (WORLD_ID,))
        fields = _npc_fields(entry) if npc_id else {**_npc_fields(entry), "image": "", "shows_image": 0}
        ids[entry["name"]] = npc_id = _upsert(db, "character_app_npc", npc_id, fields)
        link = db.execute("SELECT id FROM world_app_worldnpc WHERE npc_id = ?", (npc_id,)).fetchone()
        place = _resolve(locations, entry["location"], "Ort")
        _upsert(db, "world_app_worldnpc", link and link[0], {"world_id": WORLD_ID, "npc_id": npc_id, "location_id": place})
    return ids


def _dialogues(dialogues, npcs):
    """Return dialogues with the speaking NPCs given by id."""
    return _json([
        {"title": dialogue["title"], "lines": [{"npc": _resolve(npcs, line["npc"], "Sprecher"), "text": line["text"]} for line in dialogue["lines"]]}
        for dialogue in dialogues
    ])


def load_events(db, locations, npcs):
    """Write the events of both chapters."""
    ids = {}
    for module in CHAPTERS:
        for entry in module.EVENTS:
            fields = {**_texts(entry), "location_id": _resolve(locations, entry["location"], "Ort"), "trigger": entry["trigger"],
                      "happening": entry["happening"], "dialogues": _dialogues(entry["dialogues"], npcs)}
            ids[entry["name"]] = _world_entry(db, "world_app_event", entry, fields)
    return ids


def load_quests(db, locations, npcs):
    """Write the quests of both chapters; their starting scene is set later."""
    ids = {}
    for module in CHAPTERS:
        for entry in module.QUESTS:
            fields = {**_texts(entry), "location_id": _resolve(locations, entry["location"], "Ort"),
                      "giver_id": _resolve(npcs, entry["giver"], "Auftraggeber"), "goal": entry["goal"],
                      "checklist": _json(entry["checklist"]), "kind": entry["kind"], "number": entry["number"],
                      "dialogues": _dialogues(entry["dialogues"], npcs)}
            ids[entry["name"]] = _world_entry(db, "world_app_quest", entry, fields)
    return ids


def load_trivia(db):
    """Write all glossary entries."""
    return {entry["name"]: _world_entry(db, "world_app_trivia", entry, {**_texts(entry), "category": entry["category"]}) for entry in TRIVIA}


def load_chapter(db, module, locations, npcs):
    """Write one chapter and its scenes in the order of the thread; return chapter id and scene ids."""
    chapter = module.CHAPTER
    chapter_id = db.execute("SELECT id FROM world_app_chapter WHERE world_id = ? AND number = ?", (WORLD_ID, chapter["number"])).fetchone()[0]
    db.execute("UPDATE world_app_chapter SET name = ?, text = ?, to_read = ? WHERE id = ?",
               (chapter["name"], chapter["text"], chapter["to_read"], chapter_id))
    scenes = {}
    for position, entry in enumerate(module.SCENES):
        row_id = _find(db, "SELECT id FROM world_app_scene WHERE chapter_id = ? AND name = ?", _names(entry), (chapter_id,))
        scenes[entry["name"]] = _upsert(db, "world_app_scene", row_id, {
            "chapter_id": chapter_id, "position": position, "optional": 0, "name": entry["name"], "text": entry["text"],
            "to_read": entry["to_read"], "location_id": _resolve(locations, entry["location"], "Ort"),
            "dialogues": _dialogues(entry["dialogues"], npcs),
        })
    return chapter_id, scenes


def _relink(db, table, owner_column, owner_id, other_column, other_ids):
    """Replace all links of one owner in a many-to-many table."""
    db.execute(f'DELETE FROM "{table}" WHERE "{owner_column}" = ?', (owner_id,))
    for other_id in dict.fromkeys(other_ids):
        if other_id is not None:
            db.execute(f'INSERT INTO "{table}" ("{owner_column}", "{other_column}") VALUES (?, ?)', (owner_id, other_id))


def link_scenes(db, module, scenes, ids):
    """Link every scene of a chapter with its NPCs, quests, events and glossary entries."""
    for entry in module.SCENES:
        scene_id = scenes[entry["name"]]
        for table, column, key, kind in (("world_app_scene_npcs", "npc_id", "npcs", "Figur"), ("world_app_scene_quests", "quest_id", "quests", "Quest"),
                                         ("world_app_scene_events", "event_id", "events", "Ereignis"), ("world_app_scene_trivia", "trivia_id", "trivia", "Wissen")):
            _relink(db, table, "scene_id", scene_id, column, [_resolve(ids[key], name, kind) for name in entry[key]])


def link_thread(db, scene_lists):
    """Let every scene lead to the next one, across the end of a chapter as well."""
    ordered = [scene_id for scenes in scene_lists for scene_id in scenes.values()]
    for scene_id, following in zip(ordered, ordered[1:] + [None]):
        _relink(db, "world_app_scene_leads_to", "from_scene_id", scene_id, "to_scene_id", [following])


def link_quests(db, all_scenes, ids):
    """Link every quest with its NPCs and the scene it starts in."""
    for module in CHAPTERS:
        for entry in module.QUESTS:
            quest_id = ids["quests"][entry["name"]]
            db.execute("UPDATE world_app_quest SET scene_id = ? WHERE id = ?", (_resolve(all_scenes, entry["scene"], "Szene"), quest_id))
            _relink(db, "world_app_quest_npcs", "quest_id", quest_id, "npc_id", [_resolve(ids["npcs"], name, "Figur") for name in entry["npcs"]])


def _add_links(db, table, chapter_id, column, other_ids):
    """Add missing links of a chapter; links the game master made himself stay."""
    for other_id in other_ids:
        if not db.execute(f'SELECT 1 FROM "{table}" WHERE chapter_id = ? AND "{column}" = ?', (chapter_id, other_id)).fetchone():
            db.execute(f'INSERT INTO "{table}" (chapter_id, "{column}") VALUES (?, ?)', (chapter_id, other_id))


def link_chapters(db, chapter_ids, ids):
    """Link every chapter with its quests and events, keeping links to entries of the game master."""
    for module, chapter_id in zip(CHAPTERS, chapter_ids):
        _add_links(db, "world_app_chapter_quests", chapter_id, "quest_id", [ids["quests"][entry["name"]] for entry in module.QUESTS])
        _add_links(db, "world_app_chapter_events", chapter_id, "event_id", [ids["events"][entry["name"]] for entry in module.EVENTS])


def link_trivia(db, ids):
    """Link every glossary entry with its places, NPCs, quests and events."""
    for entry in TRIVIA:
        trivia_id = ids["trivia"][entry["name"]]
        for table, column, key, kind in (("world_app_trivia_locations", "location_id", "locations", "Ort"), ("world_app_trivia_npcs", "npc_id", "npcs", "Figur"),
                                         ("world_app_trivia_quests", "quest_id", "quests", "Quest"), ("world_app_trivia_events", "event_id", "events", "Ereignis")):
            _relink(db, table, "trivia_id", trivia_id, column, [_resolve(ids[key], name, kind) for name in entry.get(key, [])])


def delete_leftovers(db, chapter_ids):
    """Delete the scenes and events the new thread no longer uses, with all their links."""
    marks = ", ".join("?" for _ in chapter_ids)
    for (scene_id,) in db.execute(f"SELECT id FROM world_app_scene WHERE chapter_id IN ({marks}) AND name IN ({', '.join('?' for _ in DELETE_SCENES)})", (*chapter_ids, *DELETE_SCENES)).fetchall():
        for table, column in (("world_app_scene_npcs", "scene_id"), ("world_app_scene_quests", "scene_id"), ("world_app_scene_events", "scene_id"),
                              ("world_app_scene_trivia", "scene_id"), ("world_app_scene_leads_to", "from_scene_id"), ("world_app_scene_leads_to", "to_scene_id")):
            db.execute(f'DELETE FROM "{table}" WHERE "{column}" = ?', (scene_id,))
        db.execute("UPDATE world_app_quest SET scene_id = NULL WHERE scene_id = ?", (scene_id,))
        db.execute("DELETE FROM session_app_sessionentry WHERE kind = 'scene' AND entry_id = ?", (scene_id,))
        db.execute("DELETE FROM world_app_scene WHERE id = ?", (scene_id,))
    for name in DELETE_EVENTS:
        for (event_id,) in db.execute("SELECT id FROM world_app_event WHERE world_id = ? AND name = ?", (WORLD_ID, name)).fetchall():
            for table in ("world_app_scene_events", "world_app_chapter_events", "world_app_trivia_events"):
                db.execute(f'DELETE FROM "{table}" WHERE event_id = ?', (event_id,))
            db.execute("DELETE FROM session_app_sessionentry WHERE kind = 'event' AND entry_id = ?", (event_id,))
            db.execute("DELETE FROM world_app_event WHERE id = ?", (event_id,))


def main(path):
    """Load everything in one transaction and commit only when every name was found."""
    db = sqlite3.connect(path)
    db.execute("UPDATE world_app_world SET lore = ? WHERE id = ?", (WORLD_LORE, WORLD_ID))
    ids = {"locations": load_locations(db)}
    ids["npcs"] = load_npcs(db, ids["locations"])
    ids["events"] = load_events(db, ids["locations"], ids["npcs"])
    ids["quests"] = load_quests(db, ids["locations"], ids["npcs"])
    ids["trivia"] = load_trivia(db)
    chapters = [load_chapter(db, module, ids["locations"], ids["npcs"]) for module in CHAPTERS]
    chapter_ids = [chapter_id for chapter_id, _ in chapters]
    delete_leftovers(db, chapter_ids)
    all_scenes = {name: scene_id for _, scenes in chapters for name, scene_id in scenes.items()}
    for module, (_, scenes) in zip(CHAPTERS, chapters):
        link_scenes(db, module, scenes, ids)
    link_thread(db, [scenes for _, scenes in chapters])
    link_quests(db, all_scenes, ids)
    link_chapters(db, chapter_ids, ids)
    link_trivia(db, ids)
    if ERRORS:
        db.rollback()
        print("ABGEBROCHEN, nichts geändert:\n" + "\n".join(sorted(set(ERRORS))))
        sys.exit(1)
    db.commit()
    print("Fertig:", {key: len(value) for key, value in ids.items()}, "Szenen:", len(all_scenes))


if __name__ == "__main__":
    main(sys.argv[1])
