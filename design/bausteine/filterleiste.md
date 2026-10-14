# Filterleiste

## Userstory

Als Spielleiter will ich über jeder Wand von Kacheln suchen und nach Kapitel, Kategorie und dem, was eine Art ausmacht, filtern. Gibt es etwas noch nicht, will ich es gleich dort anlegen.

## Lösung

```
[ In Orten suchen …                          ]  [+ „Hafen" neu anlegen]
(Alle Kapitel) (Kap. 1) (Kap. 2) (Kap. 3)
(Alle Kategorien) (Stadt) (Wildnis) (Ohne Kategorie)
(Überall) (in Hafenstadt) (in Pilzwald)
Nichts gefunden.
```

1. **Suchfeld**, immer da. Es sucht im Namen und in allen Texten des Eintrags, auch in Wissen und Notiz. Bei mehreren Wörtern müssen alle vorkommen.
2. **Neu anlegen:** Steht im Feld ein Text und heißt kein Eintrag dieser Wand genau so, steht rechts daneben „„Text" neu anlegen". Ein Klick legt den Eintrag dieser Art mit diesem Namen an und öffnet ihn im Seitenfenster im Formular, genau wie „Neu". Danach ist das Feld leer. In einer Runde gibt es das nicht.
3. **Filterreihen:** Jede Reihe beginnt mit „Alle …", dann kommen die Werte. Ein Klick wählt einen Wert, „Alle …" nimmt den Filter weg. Es gilt immer ein Wert je Reihe.

   | Reihe | Werte | Wo |
   | --- | --- | --- |
   | Kapitel | „Alle Kapitel", „Kap. 1", „Kap. 2" … | jede Wand, deren Einträge Kapitel tragen |
   | Kategorie | „Alle Kategorien", die Kategorien dieser Art in der Welt, „Ohne Kategorie" | jede Wand außer Gegenständen (ihre Kategorie ist immer „Gegenstand") |
   | Art | „Alle Arten", „Hauptquest", „Nebenquest" | Quests |
   | Liegt in | „Überall", „in …" für jeden Ort, in dem Orte liegen | Orte; zeigt alles darin, auch tiefer |
   | Getragen von | „Alle Träger", die Figuren und Charaktere, „Von niemandem" | Gegenstände |

   Kategorien tragen ihren Ton aus den acht Tönen der [Tags](tags.md), „Ohne Kategorie" ist grau. Eine Reihe fehlt, wenn sie nichts ändern würde: kein Wert, oder nur ein Wert, der für alle Einträge gilt.
4. **Zeigen und verbergen:** Das Symbol „Filter" in der [Symbolleiste](symbolleiste.md) blendet die Filterreihen ein und aus; das Suchfeld bleibt. Seine Zahl sagt, wie viele Filter gewählt sind. Das Gerät merkt sich je Welt und Wand, ob die Reihen zu sehen sind.
5. Suche und Filter gelten, solange die Wand offen ist. Ein anderer Bereich startet ohne.

Entschieden: Das Suchfeld bleibt auch bei verborgenen Filtern stehen, weil es der Weg zum Anlegen ist. Neu angelegt wird nur mit dem Namen, wie bei „Neu"; Kapitel und Kategorie setzt man danach im Formular, das sich gleich öffnet.

## Bausteine

- [Wand](wand.md), [Tags](tags.md), [Symbolleiste](symbolleiste.md)
- Code: `components/form/filter-bar`, die Regeln des Suchens und Filterns in `core/wall.ts`

## Leisten in dieser Ansicht

entfällt (die [Wand](wand.md) meldet das Symbol „Filter")

## Zustände

- **nichts gefunden:** „Nichts gefunden." unter der Leiste. Mit Text im Feld steht „„Text" neu anlegen" daneben.
- **keine Kapitel, keine Kategorien:** die Reihe fehlt.

## Tastatur

Enter im Suchfeld legt an, wenn „neu anlegen" angeboten wird. Esc leert das Feld. „/" springt weiter in die Suche der [Kopfleiste](kopfleiste.md).

## Offen

entfällt
