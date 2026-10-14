# Notizfenster

## Userstory

Als Spielleiter will ich meine Notizen zur Runde und den Gruppenblock der Spieler nebeneinander sehen und sofort merken, wenn die Spieler etwas Neues geschrieben haben.

## Lösung

Eine Tafel mit zwei Spalten: links **Meine Notizen**, rechts der **Gruppenblock**. Jede Notiz ist eine Karte mit Titel, Anfang des Textes und der Zahl der Kommentare. Ein Klick öffnet sie im Seitenfenster; dort schreibt und kommentiert man, Änderungen speichern sich von selbst.

Darunter **Einträge mit Notiz**: alle Einträge, zu denen in dieser Runde eine [Notiz am Eintrag](../bausteine/notiz.md) steht, als [Kacheln](../bausteine/kachel.md).

Notizen, die auf dem Tisch des [Masterfensters](masterfenster.md) liegen, stehen hier erst, wenn der Spielleiter sie dort behält.

Solange die Ansicht offen ist, gilt alles im Gruppenblock als gesehen.

## Bausteine

- [Runden](runden.md), [Notiz](../bausteine/notiz.md), [Kachel](../bausteine/kachel.md)
- Code: `components/play/session-notes`, `components/play/note-detail`

## Leisten in dieser Ansicht

- **links, hier:** die Ansichten der Runde, „Notizen" aktiv, mit der Zahl neuer Beiträge im Gruppenblock.
- **oben:** Runde › Welt › Kapitel, Suche.

Symbolleiste, Abschnitt „zur Ansicht":

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neue Notiz | Seitenfenster mit leerer Notiz |
| Block | Gruppenblock | Popup: die neuesten Beiträge. Zahl: neu |

## Zustände

- **keine Notiz:** „Noch keine Notiz. Mit ‚Neu' schreibst du die erste."

## Tastatur

5 öffnet die Notizen.

## Offen

entfällt
