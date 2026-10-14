# Notiz

## Userstory

Als Spielleiter will ich mir in einer Runde zu jedem Eintrag etwas merken können, das die Spieler nie sehen. Als Spieler will ich eigene Notizen führen und manche mit der Gruppe teilen.

## Lösung

Es gibt drei Arten von Notizen.

**Notiz an einem Eintrag** (nur Spielleiter, je Runde): ein Text je Eintrag. Man schreibt ihn
- an der [Kachel](kachel.md) über das Notiz-Symbol (Popup mit Feld und „Fertig"),
- im [Popup des Eintrags](eintrag-popup.md) in der Zeile „Notiz",
- im [Seitenfenster](eintrag-seitenfenster.md) im Reiter „Notiz".

Das Symbol ist gefüllt, wenn eine Notiz da ist; an Kachel und Karte steht ihre erste Zeile. Die Spieler sehen sie nie.

**Notiz der Runde** (Spieler und Spielleiter): eine Karte mit Titel und Text. Eigene Notizen sieht nur ihr Autor, auch der Spielleiter nicht. Liegt sie im Gruppenblock, sehen und bearbeiten sie alle in der Runde und der Spielleiter, und alle können kommentieren. Zurücknehmen und löschen kann sie nur, wer sie angelegt hat. Eine Notiz öffnet sich im Seitenfenster; was man ändert, speichert sich von selbst.

**Notiz auf dem Tisch** (nur Spielleiter, je Runde): ein leeres Inhaltsfeld mit Name und Beschreibung, das in einer Gruppe seines Tisches im [Masterfenster](../spielleiter/masterfenster.md) liegt. Man schreibt sie an Ort und Stelle oder im Seitenfenster. Sie hat drei Handgriffe:
- **Behalten:** Sie geht vom Tisch und wird eine gewöhnliche Notiz der Runde; ab jetzt steht sie dauerhaft in der Spalte „Notizen“ des Masters und im [Notizfenster](../spielleiter/notizfenster.md).
- **Umwandeln:** in eine Szene, einen Ort, eine Figur, eine Quest, ein Ereignis, einen Gegenstand oder Wissen. Der neue Eintrag gehört nur dieser Runde, trägt Name und Beschreibung der Notiz und liegt danach in derselben Gruppe des Tisches; die Notiz ist weg.
- **Löschen.**

Solange sie auf dem Tisch liegt, steht sie weder in der Spalte „Notizen“ noch im Notizfenster. Wird ihre Gruppe gelöscht und sie wurde nicht behalten oder umgewandelt, ist sie verloren. Die Spieler sehen sie nie.

## Bausteine

- Code: `components/play/` (`session-notes`, `note-detail`); Notiz am Eintrag in `components/entry/`; Notiz auf dem Tisch in `gm/master/table-note`, ihre Regeln in `core/round.ts`
- [Notizfenster des Spielleiters](../spielleiter/notizfenster.md), [Notizen der Spieler](../spieler/notizen.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

- **keine Notiz:** das Symbol ist leer; die Liste zeigt „Noch keine Notiz."
- **neue Notiz auf dem Tisch:** sie heißt zuerst „Neue Notiz“; der Name ist markiert, und was man tippt, ersetzt ihn.

## Tastatur

entfällt

## Offen

entfällt
