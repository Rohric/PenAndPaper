# Klappen

## Userstory

Als Spielleiter will ich jede Gruppe und jeden Abschnitt am Titel zu- und aufklappen, damit ich nur sehe, was ich gerade brauche. Das Gerät soll sich merken, was ich zugeklappt habe.

## Lösung

```
v Wissen für Spieler  3        offen: Pfeil, Titel, Zahl, darunter der Inhalt
  ...
> Wissen nur für dich  2       zu: nur Pfeil, Titel und Zahl
```

- **Titelzeile:** Pfeil, Titel und, wenn es etwas zu zählen gibt, die Zahl. Ein Klick auf die Zeile klappt zu oder auf. Zugeklappt bleibt nur diese Zeile.
- **Zahl:** zählt, was drin ist: Kacheln einer Gruppe, Stücke Wissen, Punkte einer Liste, Verknüpfungen, Dialoge, Szenen. Ein Text hat keine Zahl.
- **Vor dem Titel** kann stehen, was zum Abschnitt gehört, zum Beispiel das [Auge](auge.md) in einer Runde. Es klappt nicht mit.
- **Schloss:** Was nur der Spielleiter liest (Wissen nur für dich, Notiz), trägt ein kleines Schloss hinter dem Titel.
- **Merken:** Was zu ist, merkt sich das Gerät je Welt, auch in den Runden dieser Welt. Ein Abschnitt heißt in jedem Eintrag gleich; wer „Wissen nur für dich" zuklappt, hat es in allen Einträgen der Welt zu. Gruppen einer [Wand](wand.md) merken sich je Wand. Kann der Browser nichts speichern, startet alles offen.
- **Alle zu, Alle auf:** Hat eine Seite Gruppen oder Abschnitte, meldet sie in der [Symbolleiste](symbolleiste.md) „Alle zu" und „Alle auf". Sie wirken auf alles, was gerade auf dem Schirm klappbar ist, auch im offenen Seitenfenster.

| Wo | Was klappt |
| --- | --- |
| [Wand](wand.md) | jede Gruppe |
| [Eintrag lesen](eintrag-lesen.md) | jeder Textblock, Wissen für Spieler, Wissen nur für dich, Notiz, Dialoge, Listen, Beispielsätze, Verknüpfungen, Bilder |
| Szene lesen ([Kapitel und Szenen](../spielleiter/kapitel-und-szenen.md)) | Vorlesen, Was passiert, Notiz, Dialoge, Ereignisse, Verknüpfungen |
| Faden der Szenen | Roter Faden, Optionale Szenen |

Entschieden: Ein Abschnitt klappt nur am eigenen Titel, nicht über einen Knopf irgendwo anders. Die Titelzeile sieht überall gleich aus (kleine fette Schrift in `--soft`, Pfeil, Zahl als Chip), damit man sie überall als dasselbe erkennt.

## Bausteine

- Code: `components/basic/fold` (`app-fold`, dazu `foldTools` für die beiden Symbole), Gedächtnis in `core/folds.ts` (`Folds`)
- [Symbolleiste](symbolleiste.md), [Wand](wand.md), [Eintrag lesen](eintrag-lesen.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

- **zu:** nur die Titelzeile.
- **nichts zu klappen:** „Alle zu" und „Alle auf" sind ausgegraut. Ist schon alles zu, ist „Alle zu" ausgegraut; ist alles offen, „Alle auf".

## Tastatur

Die Titelzeile ist ein Knopf: Tab erreicht sie, Enter oder Leertaste klappt. Für Vorleser sagt sie, ob sie offen ist.

## Offen

entfällt
