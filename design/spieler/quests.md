# Quests

## Userstory

Als Spieler will ich sehen, welche Aufgaben die Gruppe hat, und mit den anderen ein gemeinsames Questlog führen: Punkte abhaken, eigene ergänzen, Notizen dazuschreiben.

## Lösung

Die Seite zeigt die Quests, die der Spielleiter geteilt hat, als [Karten](../bausteine/kachel.md): Haupt- oder Nebenquest, Status, Name, Ziel, „Checkliste 1 von 3", neu geteilte mit einer Marke „neu".

Über den Karten: Suche, Sortierung (Hauptquests zuerst, Name, Fortschritt) und die Tags der Gruppe als Filter. Der Status (Alle, Laufend, Offen, Beendet) liegt in der oberen Reihe der Symbolleiste.

**Ein Tipp auf eine Karte** öffnet das Popup (Ziel, Stand, die ersten Punkte), von dort das Seitenfenster mit dem **Questlog:**
- die Punkte des Spielleiters, die er gezeigt hat: abhaken und in die eigene Reihenfolge schieben
- eigene Punkte der Gruppe: anlegen, ändern, löschen, abhaken
- Tags und Notizen der Gruppe

Das Log gehört der ganzen Gruppe, der Spielleiter sieht es auch.

## Bausteine

- [Runde](runde.md), [Kachel](../bausteine/kachel.md), [Tags](../bausteine/tags.md), [Fenster](../bausteine/fenster.md)
- Code: `components/play/player-panels`, `components/play/quest-log`

## Leisten in dieser Ansicht

Obere Reihe:

| Wort | Klick |
| --- | --- |
| Alle, Laufend, Offen, Beendet | wählt den Status, eines ist gedrückt |
| Hilfe | Tutorial „Meine Runden" an der Stelle „Quests und Questlog" |

## Zustände

- **noch keine Quest geteilt:** „Der Spielleiter hat noch keine Quest mit euch geteilt."
- **Filter ohne Treffer:** „Keine Quest passt dazu."

## Tastatur

entfällt

## Offen

entfällt
