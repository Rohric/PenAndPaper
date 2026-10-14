# Wand

## Userstory

Als Spielleiter will ich alle Einträge einer Art überall gleich sehen: als Wand aus gleich großen Kacheln, in denselben Gruppen, mit demselben Filter darüber.

## Lösung

```
[Filterleiste]
v Hafenstadt  4
  [Kachel]      [Kachel]      [Kachel]
  [Kachel mit vielen Tags   ] [Kachel]
> Pilzwald  3
> Einzelne Orte  2
```

- **Oben** die [Filterleiste](filterleiste.md).
- **Darunter** die [Kacheln](kachel.md) in der Größe Kachel, so viele nebeneinander, wie passen. Jede ist mindestens `--tile-min` breit (`styles/gm.scss`). Eine Kachel mit mehr als vier Tags ist von Anfang an zwei Spalten breit.
- **Gruppen:** Die Wand teilt sich in Gruppen. Jede hat einen Titel mit Zahl und lässt sich [klappen](klappen.md). Gibt es nur eine Gruppe, fehlt der Titel.

  | Wand | Gruppen | Reihenfolge in der Gruppe |
  | --- | --- | --- |
  | Orte | je Ort, in dem Orte liegen: er selbst und alles darin; die übrigen unter „Einzelne Orte" | der Baum: ein Ort, dann die Orte darin |
  | Figuren, Quests, Ereignisse, Wissen | nach Kategorie, „Ohne Kategorie" zuletzt | Name; Hauptquests vorn nach ihrer Nummer |
  | Gegenstände | keine | Gegenstände der Welt, dann was nur getragen wird |
  | Kapitel | nach Kategorie | Nummer |
  | Quests und Ereignisse eines Kapitels | nach Kategorie | wie oben |

- **Kacheln ohne Knöpfe:** Ein Klick auf eine Kachel öffnet ihr [Popup](eintrag-popup.md). Was man mit einem Eintrag tut (bearbeiten, aus dem Kapitel nehmen, an Szenen hängen), steht im Popup, im Seitenfenster, im Formular oder in der Symbolleiste, nicht auf der Kachel. In einer Runde tragen die Kacheln ihre Schalter.
- **Symbole:** Die Wand meldet „Filter", „Alle zu" und „Alle auf". „Neu" meldet die Seite, auf der die Wand steht.

Wo es Wände gibt: jeder Bereich des [Glossars](../spielleiter/glossarfenster.md) (auch in der Runde), die Liste der Kapitel und die Quests und Ereignisse eines Kapitels ([Kapitel und Szenen](../spielleiter/kapitel-und-szenen.md)).

Entschieden: Gruppen nach Kategorie, weil jede Art jetzt eine Kategorie hat; bei Orten nach dem Baum, weil „wo liegt das" dort die wichtigere Ordnung ist. Gegenstände haben keine eigene Kategorie (sie ist „Gegenstand"), darum keine Gruppen.

## Bausteine

- [Filterleiste](filterleiste.md), [Kachel](kachel.md), [Klappen](klappen.md), [Symbolleiste](symbolleiste.md)
- Code: `components/entry/entry-wall`, Gruppen und Filter in `core/wall.ts`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **leer:** ein ruhiger Kasten mit dem Satz der Seite („Noch kein Ort.") und, wo man anlegen kann: „Mit „Neu" unten in der Leiste legst du den ersten an."
- **nichts gefunden:** siehe [Filterleiste](filterleiste.md).
- **lädt:** der vorige Stand bleibt stehen.

## Tastatur

Tab geht durch Suchfeld, Filter, Titel der Gruppen und die Namen der Kacheln.

## Offen

entfällt
