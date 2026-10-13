# Spieleransicht

## Userstory

Als Spielleiter will ich prüfen können, was die Spieler gerade sehen, damit ich nichts zu viel freigegeben habe.

## Lösung

Die Ansicht zeigt dieselben Tafeln, die die Spieler am Handy haben, nur zum Lesen und nebeneinander: Quests mit Questlog, Glossar (Orte, Figuren, Wissen, Gegenstände) und Gruppe. Oben steht ein ruhiger Hinweis: „So sehen die Spieler diese Runde. Ihre eigenen Notizen und Nachrichten siehst du hier nicht."

Geladen wird beim Öffnen und über das Symbol „Laden".

## Bausteine

- [Runden](runden.md)
- dieselben Tafeln wie [Quests](../spieler/quests.md), [Glossar](../spieler/glossar.md), [Gruppe](../spieler/gruppe.md) der Spieler
- Code: `components/play/player-panels`

## Leisten in dieser Ansicht

- **links, hier:** die Ansichten der Runde, „Spieleransicht" aktiv.
- **oben:** Runde › Welt › Kapitel.

Symbolleiste, Abschnitt „zur Ansicht":

| Wort | voller Name | Klick |
| --- | --- | --- |
| Laden | Neu laden | lädt den Stand neu |
| Geteilt | Zuletzt geteilt | Popup: die zuletzt aufgedeckten Einträge als Tags |

## Zustände

- **noch nichts geteilt:** „Die Spieler sehen noch nichts. Schalte an einem Eintrag das Auge ein."

## Tastatur

6 öffnet die Spieleransicht.

## Offen

entfällt
