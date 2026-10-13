# Meine Charaktere

## Userstory

Als Spieler will ich meine Charaktere sehen, einen neuen anlegen und von einem Charakter direkt in seine Runde kommen.

## Lösung

**Liste:** oben ein Feld „Name des neuen Charakters" mit „Charakter anlegen". Darunter je Charakter eine Kachel: Portrait, Name, Beruf, Lebenspunkte, die Marke „frei" oder „spielt in: …", und rot „N Grundpunkte offen", solange welche offen sind. Ab zwei Charakteren zwei Schalter zum Sortieren: Name, Zuletzt geändert.

**Ein Charakter** öffnet sich als [Charakterbogen](../bausteine/charakterbogen.md) zum Lesen, mit Stiften an den Abschnitten. „Bearbeiten" öffnet den Editor: [Charaktererstellung](charaktererstellung.md), oder, wenn der Charakter in einer Runde spielt, [Charakter in der Runde](charakter-in-der-runde.md).

Ganz unten auf der Liste steht für freigeschaltete Konten der Weg ins Spielleiter-Menü, für alle anderen „Freischaltung prüfen".

## Bausteine

- [Rahmen](rahmen.md), [Charakterbogen](../bausteine/charakterbogen.md), [Formular](../bausteine/formular.md)
- Code: `player/characters/` (`player-home`, `character-page`)

## Leisten in dieser Ansicht

- **oben:** „Spieler" / „Meine Charaktere" bzw. der Name des Charakters.
- **Hauptreihe:** Menü, Charaktere (aktiv), Runden, Regeln.

Obere Reihe:

| Seite | Wort | Klick |
| --- | --- | --- |
| Liste | Hilfe | Tutorial „Meine Charaktere" |
| Bogen | Bearbeiten | öffnet den Editor am Steckbrief |
| Bogen | Zur Runde | führt in die Runde (nur wenn der Charakter spielt) |
| Bogen | Hilfe | Tutorial „Meine Charaktere" |

## Zustände

- **kein Charakter:** „Noch kein Charakter. Gib oben einen Namen ein und leg deinen ersten an." mit dem Knopf „Neu hier? So wird gespielt".

## Tastatur

Enter im Namensfeld legt den Charakter an.

## Offen

entfällt
