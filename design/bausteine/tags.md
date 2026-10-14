# Tags

## Userstory

Als Spielleiter will ich Verknüpfungen als kleine farbige Marken sehen und setzen, damit ich auf einen Blick weiß, wohin etwas gehört, und mit einem Klick dort bin.

## Lösung

Ein Tag ist die kleinste Größe der [Kachel](kachel.md): eine Zeile mit dem Namen, in der Farbe der Art.

**Arten von Tags:**

| Tag | Farbe | Klick |
| --- | --- | --- |
| verknüpfter Eintrag (Ort, Figur, Quest, Szene, Kapitel …) | Farbe der Art | [Popup des Eintrags](eintrag-popup.md) |
| Kapitel an Kachel und Kopf („Kap. 2") | Farbe der Kapitel | Popup des Kapitels (in einer Runde nur Anzeige) |
| Kategorie in der [Filterleiste](filterleiste.md), freie Wörter der Spieler am Questlog | einer der acht Töne, derselbe Name bekommt immer denselben; „Ohne Kategorie" grau | filtert |

**Kapitel-Tags:** Jeder Eintrag kann zu mehreren Kapiteln gehören. Der Tag steht an Kachel und Karte, im Kopf der Lese-Ansicht und im Popup. Hängt ein Eintrag an einer Szene, bekommt er den Tag ihres Kapitels von selbst.

**Kategorien:** Jede Art hat eine freie Kategorie. Ihr Ton kommt aus `components/entry/tag-colour` und ist überall derselbe: am Filter, am Feld im Formular, bei Wissen an der ganzen Kachel. Die Kategorie „Gegenstand" hat die Farbe der Gegenstände.

**Tags setzen:** im Formular über ein Feld, in dem man tippt: darunter erscheint, was passt; Pfeiltasten wählen, Enter verknüpft, die Rücktaste im leeren Feld nimmt den letzten Tag weg. Heißt kein Eintrag genau so, steht unten „„Name" neu anlegen". Das gilt für jedes Verknüpfungsfeld, auch für Kapitel. Nur Felder für Szenen außerhalb ihres Kapitels legen nichts an, denn eine Szene braucht ihr Kapitel. Ein Klick auf einen gesetzten Tag öffnet das Popup des Eintrags.

## Bausteine

- [Kachel](kachel.md) in der Größe Tag
- Code: `components/entry/entry-card`, `components/entry/link-row`, `components/form/link-picker`, `components/entry/tag-colour`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **keine Tags:** die Zeile fehlt; im Formular steht der Platzhalter des Feldes.

## Tastatur

Im Feld: Pfeil auf und ab, Enter, Rücktaste, Esc schließt die Vorschläge.

## Offen

entfällt
