# Charakterbogen

## Userstory

Als Spieler will ich meinen Charakter auf einen Blick lesen und auf einen Wert tippen können, um zu würfeln. Als Spielleiter will ich denselben Bogen für die Charaktere der Gruppe und für meine Figuren sehen.

## Lösung

Ein Baustein für Spielercharaktere und NSC, von oben nach unten:

1. **Kopf:** Portrait, „Charakter von …", Name, Beruf.
2. **Leben:** „Lebenspunkte 82 von 100" mit Balken. Darunter die **zweite Leiste**, wenn die Welt der Runde eine benennt, zum Beispiel „Willen 70 von 100", mit eigenem Balken in eigener Farbe. Ein freier Charakter (in keiner Runde) hat keine zweite Leiste. Beide Balken sind ein Baustein (`components/character/point-bar`).
3. **Zeile mit Marken:** Alter, Geschlecht, „spielt in: …" oder „frei".
4. **Punkte:** Balken „Grundpunkte"; die drei Begabungen als Karten mit Wert und Geistesblitz. In einer laufenden Runde zusätzlich der Balken „Bonuspunkte" und der rote Tag „Guthaben N" an der Begabung. Außerhalb einer Runde stehen Bonuspunkte und Guthaben nicht da.
5. **Beschreibung, Hintergrundgeschichte.**
6. **Begabungen und Fähigkeiten:** drei Spalten bzw. am Handy untereinander; je Fähigkeit Name und Wert. Suche ab acht Fähigkeiten, Sortierung „Nach Wert" und „A–Z".
7. **Inventar und Waffen,** **Besondere Fähigkeiten.**

**Würfeln:** Wo der Bogen würfeln darf (Spieler in der Runde), sind Begabungen und Fähigkeiten Knöpfe; ein Tipp würfelt die Probe (siehe [Würfel](wuerfel.md)).

**Bearbeiten:** Wo der Bogen bearbeitet werden darf, steht an jedem Abschnitt ein Stift, der den Editor an dieser Stelle öffnet.

Die **Charakter-Kachel** der Gruppe ist die Kurzform: Portrait, Name, Lebensbalken und, wenn es sie gibt, die zweite Leiste mit eigenem Plus und Minus, ungelesene Nachrichten; aufgeklappt Lebenspunkte setzen, Bogen, geheime Nachrichten, Gegenstand übergeben.

## Bausteine

- Code: `components/character/` (`character-sheet`, `points-overview`, `character-tile`, `character-editor`, `skill-editor`)
- [Würfel](wuerfel.md), [Charaktererstellung](../spieler/charaktererstellung.md), [Charakter in der Runde](../spieler/charakter-in-der-runde.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

- **keine Fähigkeit in einer Begabung:** „Noch keine Fähigkeit."

## Tastatur

Werte zum Würfeln sind Knöpfe und mit Tab erreichbar.

## Offen

entfällt
