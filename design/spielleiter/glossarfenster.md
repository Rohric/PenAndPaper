# Glossarfenster

## Userstory

Als Spielleiter will ich alles, was es in meiner Welt gibt, an einem Ort finden, nach Art getrennt, nach Kapitel und Kategorie gefiltert und in Gruppen, und einen Eintrag mit einem Klick ansehen.

## Lösung

Das Glossar hat sieben Bereiche, jeder ist ein Reiter der [Leiste links](../bausteine/leiste-links.md): Lore, Orte, Figuren, Quests, Ereignisse, Gegenstände, Wissen.

**Ein Bereich** ist eine [Wand](../bausteine/wand.md) aus [Kacheln](../bausteine/kachel.md), alle in der Größe Kachel, darüber die [Filterleiste](../bausteine/filterleiste.md):

| Bereich | Gruppen | eigener Filter | Überzeile |
| --- | --- | --- | --- |
| Orte | je Ort mit Orten darin, sonst „Einzelne Orte"; im Baum | Liegt in | „Ort · Kategorie · in …" |
| Figuren | Kategorie | – | „Figur · Kategorie" |
| Quests | Kategorie; Hauptquests vorn nach Nummer | Art | „Hauptquest 2 · Kategorie" |
| Ereignisse | Kategorie | – | „Ereignis · Kategorie" |
| Gegenstände | keine | Getragen von | „Gegenstand" bzw. „Getragen von …" |
| Wissen | Kategorie | – | die Kategorie in ihrem Ton |

Alle Bereiche filtern nach Kapitel und, außer Gegenständen, nach Kategorie. Gegenstände zeigen auch, was Figuren und (in einer Runde) die Charaktere der Gruppe tragen; ein Gegenstand, den nur ein Charakter trägt, ist eine lose Kachel, ein Klick öffnet seinen Bogen.

**Ein Klick auf eine Kachel** öffnet das [Popup des Eintrags](../bausteine/eintrag-popup.md), von dort das [Seitenfenster](../bausteine/eintrag-seitenfenster.md) zum Lesen oder gleich im Formular.

**Die ganze Seite eines Eintrags** („Zum Eintrag"): die [Lese-Ansicht](../bausteine/eintrag-lesen.md) über die Breite einer Buchseite. Zurück geht es über den Krümel des Bereichs oder den Reiter links. „Bearbeiten" steht in der Symbolleiste, nicht in der Seite.

**Lore** ist kein Kachel-Bereich: die Lese-Ansicht der Welt mit Name, „Zweite Leiste" (wenn die Welt eine hat) und dem großen Text. Bearbeitet wird über das Symbol „Bearbeiten"; im Formular löscht man auch die Welt.

Dasselbe Glossar gibt es in einer Runde als Ansicht des Cockpits. Dort tragen die Kacheln die Schalter der Runde, und es kann nichts angelegt und nichts bearbeitet werden: kein „Neu", kein „neu anlegen" in der Filterleiste.

Entschieden: Quests und Ereignisse sind im Glossar Kacheln wie alle anderen, nicht mehr Karten; mit allen Tags werden Kacheln mit vielen Verbindungen breiter statt höher.

## Bausteine

- [Rahmen](rahmen.md), [Wand](../bausteine/wand.md), [Filterleiste](../bausteine/filterleiste.md), [Kachel](../bausteine/kachel.md), [Tags](../bausteine/tags.md), [Klappen](../bausteine/klappen.md), [Popup eines Eintrags](../bausteine/eintrag-popup.md), [Eintrag lesen](../bausteine/eintrag-lesen.md), [Eintrag schreiben](eintrag-schreiben.md)
- Code: `gm/glossary/` (`glossary`, `glossary-tiles`, `item-rows`), `gm/worlds/lore-editor`

## Leisten in dieser Ansicht

- **links, hier:** die Reiter der Welt, der offene Bereich ist aktiv. In einer Runde: die Reiter der Runde, „Glossar" aktiv; die Bereiche stehen dann als Links in der Kopfleiste.
- **oben:** Welten › Welt › Bereich › Eintrag (auf seiner ganzen Seite), Suche.

Symbolleiste, ein Bereich (Wand):

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neuer Ort, Neue Figur … | Dialog: Name; danach öffnet das Seitenfenster im Formular (nicht in einer Runde) |
| Filter | Filter zeigen bzw. Filter verbergen | schaltet die Filterreihen; Zahl: gewählte Filter |
| Alle zu | Alle Gruppen zuklappen | schaltet direkt |
| Alle auf | Alle Gruppen aufklappen | schaltet direkt |

Symbolleiste, ganze Seite eines Eintrags:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Bearbeiten | Eintrag bearbeiten | wechselt ins Formular; im Formular heißt es „Lesen" (Zurück zum Lesen) |
| Alle zu | Alle Abschnitte zuklappen | schaltet direkt |
| Alle auf | Alle Abschnitte aufklappen | schaltet direkt |

Symbolleiste, Lore:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Bearbeiten | Lore bearbeiten | wechselt ins Formular; im Formular heißt es „Lesen" |

Dazu immer „Zuletzt" aus [Welten](welten.md). Die Hilfe zur Seite öffnet das Fragezeichen unten in der linken Leiste.

## Zustände

- **Bereich leer:** „Noch kein Ort." (je Art), darunter „Mit „Neu" unten in der Leiste legst du den ersten an."
- **Filter ohne Treffer:** „Nichts gefunden." unter der Filterleiste, mit Text im Suchfeld „„Text" neu anlegen".
- **Eintrag gelöscht:** „Diesen Eintrag gibt es nicht mehr."

## Tastatur

1 bis 8 für die Reiter der Welt. Strg + Enter speichert im Formular.

## Offen

entfällt
