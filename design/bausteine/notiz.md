# Notiz

## Userstory

Als Spielleiter will ich mir in einer Runde zu jedem Eintrag etwas merken können, das die Spieler nie sehen. Als Spieler will ich eigene Notizen führen und manche mit der Gruppe teilen.

## Lösung

Es gibt zwei Arten von Notizen.

**Notiz an einem Eintrag** (nur Spielleiter, je Runde): ein Text je Eintrag. Man schreibt ihn
- an der [Kachel](kachel.md) über das Notiz-Symbol (Popup mit Feld und „Fertig"),
- im [Popup des Eintrags](eintrag-popup.md) in der Zeile „Notiz",
- im [Seitenfenster](eintrag-seitenfenster.md) im Reiter „Notiz".

Das Symbol ist gefüllt, wenn eine Notiz da ist; an Kachel und Karte steht ihre erste Zeile. Die Spieler sehen sie nie.

**Notiz der Runde** (Spieler und Spielleiter): eine Karte mit Titel und Text. Eigene Notizen sieht nur ihr Autor, auch der Spielleiter nicht. Liegt sie im Gruppenblock, sehen und bearbeiten sie alle in der Runde und der Spielleiter, und alle können kommentieren. Zurücknehmen und löschen kann sie nur, wer sie angelegt hat. Eine Notiz öffnet sich im Seitenfenster; was man ändert, speichert sich von selbst.

## Bausteine

- Code: `components/play/` (`session-notes`, `note-detail`); Notiz am Eintrag in `components/entry/`
- [Notizfenster des Spielleiters](../spielleiter/notizfenster.md), [Notizen der Spieler](../spieler/notizen.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

- **keine Notiz:** das Symbol ist leer; die Liste zeigt „Noch keine Notiz."

## Tastatur

entfällt

## Offen

entfällt
