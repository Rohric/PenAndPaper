# Welten

## Userstory

Als Spielleiter will ich meine Welten sehen, eine neue anlegen und eine öffnen, um weiterzuschreiben.

## Lösung

**Liste der Welten:** Kacheln mit Name der Welt und dem Anfang der Lore. Ein Klick öffnet die Welt bei ihren Kapiteln.

**In einer Welt** gibt es zwei Teile: die Kapitel ([Kapitel und Szenen](kapitel-und-szenen.md)) und das Glossar ([Glossarfenster](glossarfenster.md)). Die Lore (Name der Welt und der große Text über sie) ist der erste Reiter des Glossars; dort löscht man auch die Welt.

**Zuletzt:** was in der Welt zuletzt angelegt und zuletzt bearbeitet wurde, über alle Arten. Liegt als Symbol in der Symbolleiste.

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
| Hilfe | Hilfe zu dieser Seite | Tutorial |

## Zustände

- **keine Welt:** „Noch keine Welt. Leg mit ‚Neu' deine erste an."

## Tastatur

1 bis 8 für die Reiter der Welt.

## Offen

entfällt
