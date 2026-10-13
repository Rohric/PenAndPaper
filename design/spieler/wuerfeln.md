# Würfeln

## Userstory

Als Spieler will ich auf eine Fähigkeit tippen und die Probe würfeln, sehen, ob sie gelungen ist, und einen Geistesblitz einsetzen können, wenn sie misslingt.

## Lösung

Die Seite **Charakter** der Runde hat zwei Ansichten, die man über die obere Reihe wechselt:

- **Bogen:** der [Charakterbogen](../bausteine/charakterbogen.md); Begabungen und Fähigkeiten sind Knöpfe. Ein Tipp würfelt einen W100 gegen den Wert. Über dem Bogen steht der letzte eigene Wurf.
- **Würfeln:** das [Würfelfeld](../bausteine/wuerfel.md) mit den Werten als großen Knöpfen und den freien Würfeln (W100, ein bis zehn W10).

Jeden Wurf sehen der Spielleiter und die Gruppe.

**Geistesblitz:** Misslingt eine Probe ohne Patzer und hat die Begabung noch Punkte, erscheint unter dem Wurf „Geistesblitz einsetzen · Handeln · noch 2". Das Symbol „Blitz" zeigt die übrigen Punkte je Begabung.

## Bausteine

- [Runde](runde.md), [Charakterbogen](../bausteine/charakterbogen.md), [Würfel](../bausteine/wuerfel.md)
- Regeln: Tutorial „Regelwerk", Kapitel „Die Probe"
- Code: `player/session/player-session`, `components/play/` (`dice-roll`, `roll-panel`)

## Leisten in dieser Ansicht

Obere Reihe der Seite Charakter:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Bogen | Charakterbogen | zeigt den Bogen (gedrückt, wenn offen) |
| Würfeln | Würfelfeld | zeigt das Würfelfeld |
| Bearb. | Charakter bearbeiten | öffnet den Editor, siehe [Charakter in der Runde](charakter-in-der-runde.md) |
| Blitz | Geistesblitzpunkte | Popup: Punkte je Begabung und, wenn möglich, „Geistesblitz einsetzen". Zahl: übrige Punkte |
| Hilfe | Proben und Würfe | Tutorial „Regelwerk" an der Stelle „Die Probe" |

## Zustände

- **kein Charakter in der Runde:** „Keiner deiner Charaktere spielt in dieser Runde."

## Tastatur

entfällt

## Offen

entfällt
