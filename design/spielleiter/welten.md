# Welten

## Userstory

Als Spielleiter will ich meine Welten sehen, eine neue anlegen und eine öffnen, um weiterzuschreiben.

## Lösung

**Liste der Welten:** Kacheln mit Name der Welt und dem Anfang der Lore. Ein Klick öffnet die Welt bei ihren Kapiteln.

**In einer Welt** gibt es zwei Teile: die Kapitel ([Kapitel und Szenen](kapitel-und-szenen.md)) und das Glossar ([Glossarfenster](glossarfenster.md)). Die Lore (Name der Welt und der große Text über sie) ist der erste Reiter des Glossars; dort löscht man auch die Welt.

**Überall in einer Welt gleich:**
- Wände von Einträgen sind [Wände](../bausteine/wand.md) mit [Filterleiste](../bausteine/filterleiste.md) und Gruppen, die sich [klappen](../bausteine/klappen.md) lassen.
- Jeder Eintrag (auch Szene und Kapitel) öffnet zuerst sein [Popup](../bausteine/eintrag-popup.md); bearbeitet wird im [Seitenfenster](../bausteine/eintrag-seitenfenster.md) („Bearbeiten" im Fuß) oder, auf einer ganzen Seite, über das Symbol „Bearbeiten" in der Symbolleiste. Knöpfe zum Bearbeiten in der Seite gibt es nicht.
- Was eine Seite tun kann, steht als Symbol in der [Symbolleiste](../bausteine/symbolleiste.md): „Neu", „Bearbeiten"/„Lesen", „Filter", „Alle zu"/„Alle auf", bei Szenen „Hoch"/„Runter". Die Tabellen stehen in den Dateien der Seiten.
- Öffnet sich ein Popup oder das Seitenfenster eines Eintrags, schließt sich das Popup eines Symbols.

**Suche in der Kopfleiste:** findet Orte, Figuren, Quests, Ereignisse, Gegenstände, Wissen, Szenen und Kapitel nach Name und Text. Ein Treffer öffnet das Popup. Heißt nichts genau so wie der Text, stehen unten „„Text" neu anlegen als Ort", „… als Figur", „… als Quest", „… als Ereignis", „… als Gegenstand", „… als Wissen". Ein Klick legt an und öffnet das Seitenfenster im Formular. In einer Runde sucht dieselbe Suche, legt aber nichts an.

**Zuletzt:** was in der Welt zuletzt angelegt und zuletzt bearbeitet wurde, über alle Arten, als [Kacheln](../bausteine/kachel.md) mit „vor 2 Minuten" in der Überzeile. Liegt als Symbol in der Symbolleiste.

**Zweite Leiste:** Im Formular der Lore steht das Feld „Zweite Leiste (freiwillig)". Trägt man einen Namen ein, zum Beispiel „Willen" oder „Geistige Gesundheit", hat jeder Charakter in Runden dieser Welt neben dem Leben eine zweite Leiste (Start 100 von 100). Leer heißt: keine zweite Leiste. Sichtbar ist sie wie das Leben, ändern kann sie nur der Spielleiter.

Entschieden: Die Symbolleiste trägt die Handgriffe jeder Seite, damit die Seite selbst nur zeigt, was man liest. Die Liste „Zuletzt" steht nicht mehr zusätzlich unter den Kapiteln, weil es sie schon in der Leiste gibt.

## Bausteine

- [Rahmen](rahmen.md), [Kachel](../bausteine/kachel.md), [Wand](../bausteine/wand.md), [Formular](../bausteine/formular.md), [Kopfleiste](../bausteine/kopfleiste.md)
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
| Zuletzt | Zuletzt angelegt und bearbeitet | Popup mit zwei Reihen aus Kacheln (in einer Welt, auf jeder Seite) |

Die Hilfe zur Seite öffnet das Fragezeichen unten in der linken Leiste.

## Zustände

- **keine Welt:** „Noch keine Welt. Mit „Neu" unten in der Leiste legst du deine erste an."
- **Suche ohne Treffer:** „Nichts gefunden." in der Liste der Suche, darunter das Anlegen.

## Tastatur

1 bis 8 für die Reiter der Welt. „/" springt in die Suche.

## Offen

entfällt
