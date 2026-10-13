# Storyfenster

## Userstory

Als Spielleiter will ich im Spiel die Szene vor mir haben, die gerade läuft, mit dem Text zum Vorlesen, und alles, was zu ihr gehört, mit einem Klick erreichen, ohne dass es mir den Text verdrängt.

## Lösung

```
+-----------------+---------------------------------------------+
| ROTER FADEN     |  Szene 4 · Im Wachhaus                      |
| 1 Ankunft   ok  |  [Wachhaus] [Sigrun] [Wache]                |
| 2 Markt     ok  |                                             |
| 3 Taverne       |  | Ein schmaler Raum, ein Tisch, darauf     |
| 4 Im Wachhaus < |  | Wachstafeln in sauberen Stapeln ...      |
| 5 Zelle         |                                             |
| optional        |  Was passiert ...                           |
|  Der Bettler    |  Dialoge ...                                |
+-----------------+---------------------------------------------+
```

- **Links** der rote Faden des Kapitels der Runde: nummerierte Szenen, gespielte mit Haken, darunter die optionalen.
- **Rechts** nur die Szene: Name, Ort und Figuren als [Tags](../bausteine/tags.md), Vorlesetext abgesetzt, Text für den Spielleiter, Dialoge.
- Quests, Ereignisse, Figuren, Gegenstände und Wissen der Szene stehen **nicht** auf der Seite, sondern als Symbole mit Zahl in der Symbolleiste.

## Bausteine

- [Runden](runden.md) (Cockpit und die Symbole, die es immer gibt)
- [Kachel](../bausteine/kachel.md), [Tags](../bausteine/tags.md), [Popup eines Eintrags](../bausteine/eintrag-popup.md)
- Code: `gm/cockpit/session-story`, `gm/chapters/scene-thread`, `gm/chapters/scene-view`

## Leisten in dieser Ansicht

- **links, hier:** die Ansichten der Runde, „Story" aktiv.
- **oben:** Runde › Welt › Kapitel › Szene, Kapitel-Auswahl, Suche.

Symbolleiste, Abschnitt „zur Ansicht":

| Wort | voller Name | Klick |
| --- | --- | --- |
| Ort | Ort der Szene | Popup des Ortes |
| Figuren | Figuren der Szene | Popup mit Kacheln; Zahl |
| Quests | Quests der Szene | Popup mit Karten: Annehmen, Beendet, Auge; Zahl |
| Ereignisse | Ereignisse der Szene | Popup mit Karten, ganzer Text, Erledigt; Zahl |
| Wissen | Gegenstände und Wissen der Szene | Popup mit Kacheln; Zahl |
| Weiter | Führt zu | Popup: die Szenen, zu denen diese führt |
| Haupt | Hauptquests | Popup: alle Hauptquests mit Status |
| Freie | Freie Ereignisse | Popup: offene Ereignisse ohne Szene, nach „In diesem Kapitel" und „Übrige Welt" |
| Gespielt | Szene gespielt | schaltet |
| Nadel | Stecknadel | schaltet |
| Kampf hier | Kampf in dieser Szene | startet einen Kampf mit Gruppe und Figuren der Szene |

## Zustände

- **keine Szene gewählt:** „Wähle links eine Szene."
- **Kapitel ohne Szene:** „Dieses Kapitel hat noch keine Szene."

## Tastatur

1 öffnet die Story.

## Offen

entfällt
