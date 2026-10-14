# Kachel

## Userstory

Als Nutzer will ich einen Eintrag überall sofort wiedererkennen: gleiche Form, gleiche Farbe, gleiche Schalter an derselben Stelle, egal ob im Glossar, in einer Schublade oder in einem Popup.

## Lösung

Ein Baustein für jeden Eintrag der Welt (Ort, Figur, Quest, Ereignis, Gegenstand, Wissen, Szene), in drei Größen. Der Aufbau ist immer derselbe: Farbstreifen der Art links, Symbol oder Bild, Art und Name, Text, rechts die Schalter.

```
TAG (eine Zeile, in Fließtext, Popups, Verknüpfungen)
  [|Sigrun]   [|Schwarzmarkt]

KACHEL (Listen, Schubladen, Glossar)
+|-------------------------------------+
|| (S) Figur · Kap. 1, 2      (A)(N)(+) |
||     Sigrun                           |
||     Hauptfrau der Stadtwache ...     |
+|-------------------------------------+

KARTE (geöffnete Szene, Questbrett)
+|-------------------------------------+
|| (Q) Quest · laufend     (A)(N)(ok)(+)|
||     Der Schwarzmarkt                 |
||     Ziel: Finde den Händler          |
||     Checkliste 1 von 3               |
||     [Questgeber Bettler] [Hafen]     |
+|-------------------------------------+
```

| Größe | Text | Zusatz | Wo |
| --- | --- | --- | --- |
| **Tag** | nur der Name | – | Verknüpfungen, Reiter „Verbindungen" im Popup, Fließtext |
| **Kachel** | bis drei Zeilen | Kapitel als kleine Tags; bei Orten und Ereignissen dazu ihre Verbindungen als Tags (höchstens sechs, dann „+N") | Glossar, Schubladen, Listen, Suche |
| **Karte** | bis sechs Zeilen | Quest: Ziel, Checkliste, Verknüpfungen als Tags; Ereignis: Auslöser und Verbindungen als Tags; Ort: Verbindungen als Tags | geöffnete Szene, Questbrett |

**Tags der Verbindungen:** wie bei Quests „Art · Name", in der Farbe der Art. Ein Ort zeigt, worin er liegt, die Orte darin, Figuren, Quests und Ereignisse dort, Gegenstände, Wissen und Szenen dort. Ein Ereignis zeigt seinen Ort, seine Figuren, seine Szenen, wohin es führt, Gegenstände und Wissen. Ein Klick auf einen Tag öffnet das Popup dieses Eintrags.

**Überzeile:** die Art; bei Quests zusätzlich der Status (offen, laufend, beendet), bei Wissen die Kategorie, bei Figuren der Beruf.

**Schalter rechts** (nur in einer Runde, in dieser Reihenfolge): [Auge](auge.md), Stecknadel, Notiz, Erledigt (Szene, Quest, Ereignis), Auf den Tisch (im Master).

**Klick auf den Namen:** öffnet das [Popup des Eintrags](eintrag-popup.md). Ein Tag tut dasselbe.

**Erledigt:** der Name ist durchgestrichen und blass.

Die **Charakter-Kachel** (Spielercharakter in der Gruppe) ist ein eigener Baustein im selben Rahmen: Portrait, Name, Lebensbalken, Zahl ungelesener Nachrichten.

## Bausteine

- [Farben und Schrift](../grundlagen/farben-und-schrift.md): Farbe der Art
- [Auge](auge.md), [Tags](tags.md), [Popup eines Eintrags](eintrag-popup.md)
- Code: `components/entry/entry-card`; Charakter: `components/character/character-tile`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **Eintrag gelöscht:** die Kachel wird nicht gezeichnet.
- **kein Text:** die Kachel bleibt zweizeilig.

## Tastatur

Der Name ist ein Knopf und mit Tab erreichbar; Enter öffnet das Popup. Die Schalter folgen in der Reihenfolge von links nach rechts.

## Offen

entfällt
