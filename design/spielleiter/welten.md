# Welten

## Userstory

Als Spielleiter will ich meine Welten sehen, eine neue anlegen und eine öffnen, um weiterzuschreiben.

## Lösung

**Liste der Welten:** Kacheln mit Name der Welt und dem Anfang der Lore. Ein Klick öffnet die Welt bei ihren Kapiteln.

**In einer Welt** gibt es zwei Teile: die Kapitel ([Kapitel und Szenen](kapitel-und-szenen.md)) und das Glossar ([Glossarfenster](glossarfenster.md)). Die Lore (Name der Welt und der große Text über sie) ist der erste Reiter des Glossars; dort löscht man auch die Welt.

**Zuletzt:** was in der Welt zuletzt angelegt und zuletzt bearbeitet wurde, über alle Arten. Liegt als Symbol in der Symbolleiste.

**Zweite Leiste:** Im Formular der Lore steht das Feld „Zweite Leiste (freiwillig)". Trägt man einen Namen ein, zum Beispiel „Willen" oder „Geistige Gesundheit", hat jeder Charakter in Runden dieser Welt neben dem Leben eine zweite Leiste (Start 100 von 100). Leer heißt: keine zweite Leiste. Sichtbar ist sie wie das Leben, ändern kann sie nur der Spielleiter.

## Bausteine

- [Rahmen](rahmen.md), [Kachel](../bausteine/kachel.md), [Formular](../bausteine/formular.md)
- Code: `gm/worlds/` (`world-list`, `world-workspace`, `lore-editor`, `recent-entries`, `world-search`)

## Leisten in dieser Ansicht

| Leiste | Liste der Welten | In einer Welt |
| --- | --- | --- |
| links, hier | – | Kapitel, Lore, Orte, Figuren, Quests, Ereignisse, Gegenstände, Wissen |
| oben | „Welten" | Name der Welt › …, Suche |

Symbolleiste:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neue Welt | Dialog: Name der Welt (nur in der Liste) |
| Zuletzt | Zuletzt angelegt und bearbeitet | Popup mit zwei Listen (in einer Welt) |

Die Hilfe zur Seite öffnet das Fragezeichen unten in der linken Leiste.

## Zustände

- **keine Welt:** „Noch keine Welt. Leg mit ‚Neu' deine erste an."

## Tastatur

1 bis 8 für die Reiter der Welt.

## Offen

entfällt
