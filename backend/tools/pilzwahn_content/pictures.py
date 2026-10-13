"""Hang the pictures of Pilzwahn on their places, items and characters.

Usage: python3 pictures.py path/to/db.sqlite3
The image files must already lie in backend/media under the paths named here. Running it twice changes nothing.
"""

import sqlite3
import sys

WORLD_ID = 4
MAP = "pictures/pilzwahn_weltkarte.jpg"
# Each place or item with its pictures, in the order they are shown.
ENTRY_PICTURES = {
    ("location", "Die Kreuzung"): ["pictures/pilzwahn_kreuzung.jpg"],
    ("location", "Der Rastplatz am Waldrand"): ["pictures/pilzwahn_rastplatz.jpg"],
    ("location", "Björnsvig"): ["pictures/pilzwahn_bjoernsvig.jpg"],
    ("location", "Drakkarheim"): ["pictures/pilzwahn_drakkarheim.jpg"],
    ("location", "Skaldeby"): ["pictures/pilzwahn_skaldeby.jpg"],
    ("location", "Skaldingen"): [MAP],
    ("location", "Bræðrey · Tvíborg"): [MAP],
    ("location", "Ulmar"): [MAP],
    ("location", "Die Nebelinseln"): [MAP],
    ("trivia", "Pilzknolle"): ["pictures/pilzwahn_pilz.jpg"],
    ("trivia", "Sölvis Brief"): ["pictures/pilzwahn_soelvis_brief.jpg"],
}
# Each NPC with its portrait.
NPC_IMAGES = {
    "Jarl Thorgrim von Skaldeby": "characters/pilzwahn_thorgrim.jpg",
    "Der dreibeinige Grizzly": "characters/pilzwahn_grizzly.jpg",
    "Svafnir, der Alchemist": "characters/pilzwahn_zwillinge.jpg",
    "Sölvi, der Träumer": "characters/pilzwahn_zwillinge.jpg",
    "Mutter Gunna": "characters/pilzwahn_gunna.jpg",
}


def _entry_id(db, kind, name):
    """Return the id of a place or glossary entry of the world."""
    table = "world_app_location" if kind == "location" else "world_app_trivia"
    row = db.execute(f"SELECT id FROM {table} WHERE world_id = ? AND name = ?", (WORLD_ID, name)).fetchone()
    if not row:
        raise SystemExit(f"Nicht gefunden: {name}")
    return row[0]


def hang_pictures(db):
    """Replace the pictures of every listed entry with the listed ones."""
    for (kind, name), images in ENTRY_PICTURES.items():
        column = f"{kind}_id"
        entry_id = _entry_id(db, kind, name)
        db.execute(f"DELETE FROM world_app_picture WHERE {column} = ?", (entry_id,))
        for position, image in enumerate(images):
            db.execute(f"INSERT INTO world_app_picture (image, position, {column}) VALUES (?, ?, ?)", (image, position, entry_id))


def set_portraits(db):
    """Give every listed NPC its portrait and show it instead of the symbol."""
    sql = "SELECT n.id FROM character_app_npc n JOIN world_app_worldnpc w ON w.npc_id = n.id WHERE w.world_id = ? AND n.name = ?"
    for name, image in NPC_IMAGES.items():
        row = db.execute(sql, (WORLD_ID, name)).fetchone()
        if not row:
            raise SystemExit(f"Nicht gefunden: {name}")
        db.execute("UPDATE character_app_npc SET image = ?, shows_image = 1 WHERE id = ?", (image, row[0]))


def main(path):
    """Hang all pictures in one transaction."""
    db = sqlite3.connect(path)
    hang_pictures(db)
    set_portraits(db)
    db.commit()
    print("Bilder gesetzt:", sum(len(images) for images in ENTRY_PICTURES.values()), "an Orten und Gegenständen,", len(NPC_IMAGES), "Porträts.")


if __name__ == "__main__":
    main(sys.argv[1])
