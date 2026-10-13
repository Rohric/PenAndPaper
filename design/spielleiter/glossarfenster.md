# Glossarfenster

## Userstory

Als Spielleiter will ich alles, was es in meiner Welt gibt, an einem Ort finden, nach Art getrennt und nach Kapitel gefiltert, und einen Eintrag mit einem Klick ansehen.

## Lösung

Das Glossar hat sieben Bereiche, jeder ist ein Reiter der [Leiste links](../bausteine/leiste-links.md): Lore, Orte, Figuren, Quests, Ereignisse, Gegenstände, Wissen.

**Ein Bereich** ist eine Wand aus [Kacheln](../bausteine/kachel.md):
- Orte in der Reihenfolge ihres Baums (ein Ort, dann die Orte darin), mit „in …" in der Überzeile.
- Quests und Ereignisse in der Größe Karte, alle anderen als Kachel.
- Gegenstände zeigen „Getragen von …".
- Wissen nach Kategorie sortiert.

**Filter über den Kacheln:** Kapitel (ein Kapitel-Tag je Kapitel, dazu „Alle"); bei Wissen zusätzlich die Kategorien.

**Ein Klick auf eine Kachel** öffnet das [Popup des Eintrags](../bausteine/eintrag-popup.md), von dort das [Seitenfenster](../bausteine/eintrag-seitenfenster.md).

**Lore** ist kein Kachel-Bereich: Name der Welt und ihr großer Text zum Lesen, mit „Bearbeiten".

Dasselbe Glossar gibt es in einer Runde als Ansicht des Cockpits. Dort tragen die Kacheln die Schalter der Runde, und es kann nichts angelegt werden.

## Bausteine

- [Rahmen](rahmen.md), [Kachel](../bausteine/kachel.md), [Tags](../bausteine/tags.md), [Popup eines Eintrags](../bausteine/eintrag-popup.md), [Eintrag schreiben](eintrag-schreiben.md)
- Code: `gm/glossary/` (`glossary`, `glossary-tiles`, `item-rows`)

## Leisten in dieser Ansicht

- **links, hier:** die Reiter der Welt, der offene Bereich ist aktiv. In einer Runde: die Reiter der Runde, „Glossar" aktiv; die Bereiche stehen dann als Links in der Kopfleiste.
- **oben:** Welten › Welt › Bereich › Eintrag (auf seiner ganzen Seite), Suche.

Symbolleiste:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neuer Eintrag in diesem Bereich | Dialog: Name; danach öffnet das Seitenfenster im Formular (nicht in einer Runde) |
| Zuletzt | Zuletzt angelegt und bearbeitet | Popup |

Die Hilfe zur Seite öffnet das Fragezeichen unten in der linken Leiste.

## Zustände

- **Bereich leer:** „Noch kein Ort." (je Art), mit dem Hinweis auf „Neu".
- **Filter ohne Treffer:** „In diesem Kapitel steht hier nichts."

## Tastatur

1 bis 8 für die Reiter der Welt.

## Offen

entfällt
