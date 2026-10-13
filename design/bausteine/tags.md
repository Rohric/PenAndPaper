# Tags

## Userstory

Als Spielleiter will ich Verknüpfungen als kleine farbige Marken sehen und setzen, damit ich auf einen Blick weiß, wohin etwas gehört, und mit einem Klick dort bin.

## Lösung

Ein Tag ist die kleinste Größe der [Kachel](kachel.md): eine Zeile mit dem Namen, in der Farbe der Art.

**Arten von Tags:**

| Tag | Farbe | Klick |
| --- | --- | --- |
| verknüpfter Eintrag (Ort, Figur, Quest …) | Farbe der Art | [Popup des Eintrags](eintrag-popup.md) |
| Kapitel („Kap. 2") | Farbe der Kapitel | führt zum Kapitel |
| freie Wörter der Spieler am Questlog, Kategorien von Wissen | einer der acht Töne, derselbe Name bekommt immer denselben | filtert |

**Kapitel-Tags:** Jeder Eintrag kann zu mehreren Kapiteln gehören. Der Tag steht an Kachel und Karte, im Kopf der Lese-Ansicht und im Popup. Hängt ein Eintrag an einer Szene, bekommt er den Tag ihres Kapitels von selbst.

**Tags setzen:** im Formular über ein Feld, in dem man tippt: darunter erscheint, was passt; Pfeiltasten wählen, Enter verknüpft, die Rücktaste im leeren Feld nimmt den letzten Tag weg. Gibt es den Eintrag noch nicht, steht unten „neu anlegen".

## Bausteine

- [Kachel](kachel.md) in der Größe Tag
- Code: `components/entry/entry-card`, `components/entry/link-row`, `components/form/link-picker`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **keine Tags:** die Zeile fehlt; im Formular steht der Platzhalter des Feldes.

## Tastatur

Im Feld: Pfeil auf und ab, Enter, Rücktaste, Esc schließt die Vorschläge.

## Offen

entfällt
