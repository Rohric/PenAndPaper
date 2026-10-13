# Charakter in der Runde

## Userstory

Als Spieler will ich nach einem Kapitel meine Bonuspunkte verteilen und dabei sehen, was der nächste Punkt kostet und ob ich Guthaben in einer Begabung habe.

## Lösung

Sobald der Charakter in einer **laufenden Runde** spielt, gelten die Hausregeln. Der Editor ist derselbe wie in der [Charaktererstellung](charaktererstellung.md), mit diesen Unterschieden:

- Oben ein ruhiger Hinweis mit Schloss: „Dein Charakter spielt in einem Abenteuer. Grundpunkte und Begabungen bleiben fest, neue Punkte kommen über Bonuspunkte."
- **Drei Zähler je Fähigkeit,** jeder mit seiner Farbe:

  | Zähler | Farbe | Regel |
  | --- | --- | --- |
  | Grund | Akzent | fest (Schloss); offene Grundpunkte darf man noch vergeben |
  | Bonuspunkte | Blau | kostet nach Staffel: bis 30 Punkte 1, bis 50 2, bis 70 3, darüber 4. Darunter: „+1 kostet 2 Bonuspunkte" |
  | Guthaben | Rot | nur sichtbar, wenn die Begabung Guthaben hat oder die Fähigkeit schon welches trägt; kostet nach derselben Staffel aus dem Topf der Begabung. Darunter: „+1 kostet 2 Guthaben" |

- **Über 100:** ein Wert bleibt bei 100. Je zwei Punkte darüber geben der Begabung 1 Guthaben. An der Begabung steht dann rechts neben Geistesblitz der rote Tag „Guthaben 1 Punkt".
- **Angetippte Fähigkeit** in einer Begabung mit Guthaben: „Du hast 1 Punkt Guthaben in Handeln. Hier kannst du es einsetzen: +1 kostet 1 Guthaben." Reicht es nicht: „… Für +1 hier brauchst du 2 Guthaben." Steht sie bei 100: „… Setz das Guthaben bei einer anderen Fähigkeit in Handeln ein."
- Guthaben und Bonuspunkte lassen sich nicht zusammenlegen.
- **Punkte-Tag unten links:** bis zu drei Kreise in den Farben der Zähler: offene Grundpunkte, freie Bonuspunkte, offenes Guthaben (nur wenn nicht 0).
- Die Punkteübersicht zeigt zusätzlich den Balken „Bonuspunkte" und die Guthaben-Tags.

In der Runde öffnet sich der Editor über „Bearb." auf der Seite Charakter als Seitenfenster über den ganzen Schirm.

## Bausteine

- [Charaktererstellung](charaktererstellung.md), [Charakterbogen](../bausteine/charakterbogen.md), [Meldung](../bausteine/meldung.md)
- Code: `components/character/`, Hausregeln in `core/house-rules.ts` und `backend/character_app/house_rules.py`

## Leisten in dieser Ansicht

Wie in der Erstellung: die Leiste des Editors.

## Zustände

- **zu viele Bonuspunkte:** „Es sind 3 Bonuspunkte zu viel ausgegeben."
- **zu viel Guthaben eingesetzt:** „In Handeln ist mehr Guthaben eingesetzt, als die Begabung hat: 1 zu viel. Nimm Guthaben-Punkte zurück."

## Tastatur

entfällt

## Offen

entfällt
