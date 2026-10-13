# Eintrag lesen

## Userstory

Als Spielleiter will ich einen Eintrag in immer derselben Reihenfolge lesen und dabei sehen, welche Teile die Spieler kennen.

## Lösung

Die Lese-Ansicht ist für alle Arten gleich aufgebaut. Was eine Art nicht hat, fehlt.

1. **Kopf:** Symbol oder Bild, Art in ihrer Farbe, Name, Unterzeile (Beruf, Kategorie), Kapitel als [Tags](tags.md).
2. **Textblöcke** mit Überschrift: Beschreibung; bei Quests Ziel; bei Ereignissen Auslöser und „Was passiert"; bei Figuren der Steckbrief.
3. **Wissen für Spieler:** Stück für Stück, jedes mit eigenem [Auge](auge.md).
4. **Wissen nur für dich:** abgesetzt, mit Schloss.
5. **Dialoge** und **Beispielsätze.**
6. **Listen:** Checkliste (in einer Runde mit Auge und Haken je Punkt), Fähigkeiten, Inventar.
7. **Bilder.**

In einer Runde steht vor jedem Teil, den Spieler sehen können, ein [Auge](auge.md): am Namen, an Beschreibung, Ziel, Questgeber, Startgebiet, Auslöser, „Was passiert", an jedem Punkt der Checkliste und jedem Stück Wissen.

Die Verknüpfungen stehen nicht mehr in der Lese-Ansicht, sondern im Reiter „Verbindungen" des [Seitenfensters](eintrag-seitenfenster.md) und des [Popups](eintrag-popup.md).

## Bausteine

- [Auge](auge.md), [Tags](tags.md)
- Code: `components/entry/entry-view`, `entry-views`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **leer:** „Hier steht noch nichts."

## Tastatur

entfällt

## Offen

entfällt
