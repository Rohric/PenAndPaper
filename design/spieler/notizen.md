# Notizen der Spieler

## Userstory

Als Spieler will ich mir während der Runde schnell etwas notieren und entscheiden, ob es nur für mich ist oder für die ganze Gruppe.

## Lösung

Oben ein Feld für eine schnelle Notiz: Titel tippen, Enter, die Notiz ist angelegt und gehört nur einem selbst.

Darunter zwei Abschnitte mit Karten: **Meine Notizen** und der **Gruppenblock.** Eine Karte zeigt Titel, Anfang des Textes und die Zahl der Kommentare.

Ein Tipp öffnet die Notiz im Seitenfenster (ganzer Schirm): Titel, Text, „In den Gruppenblock legen", Kommentare bei geteilten Notizen, Löschen. Was man ändert, speichert sich von selbst.

**Wer was darf:** Eine eigene Notiz sieht nur, wer sie geschrieben hat, auch der Spielleiter nicht. Eine Notiz im Gruppenblock sehen und bearbeiten alle in der Runde und der Spielleiter. Zurück zu den eigenen Notizen legen und löschen kann sie nur, wer sie angelegt hat.

Siehe [Notiz](../bausteine/notiz.md).

## Bausteine

- [Runde](runde.md), [Notiz](../bausteine/notiz.md), [Fenster](../bausteine/fenster.md)
- Code: `components/play/` (`session-notes`, `note-detail`)

## Leisten in dieser Ansicht

Erreichbar in der Runde: Schalter „Notizen" in der oberen Reihe der Symbolleiste. Obere Reihe:

| Wort | Klick |
| --- | --- |
| Neu | öffnet eine leere Notiz im Seitenfenster |
| Glossar, Notizen, Gruppe | wechselt zwischen den Seiten der Runde |
| Hilfe | Tutorial „Meine Runden" an der Stelle „Notizen" |

## Zustände

- **keine Notiz:** „Noch keine Notiz. Tippe oben einen Titel."

## Tastatur

Enter im Feld oben legt die Notiz an.

## Offen

entfällt
