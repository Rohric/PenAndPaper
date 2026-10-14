# Storyfenster

## Userstory

Als Spielleiter will ich im Spiel die Szene vor mir haben, die gerade läuft, mit dem Text zum Vorlesen, und alles, was zu ihr gehört, mit einem Klick erreichen, ohne dass es mir den Text verdrängt. Ergibt sich beim Spielen eine neue Szene oder läuft eine anders, will ich sie für diese Runde schreiben, ohne die Welt zu ändern.

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

- **Links** der rote Faden des Kapitels der Runde: nummerierte Szenen, gespielte mit Haken, darunter die optionalen. Szenen, die diese Runde dazugedichtet hat, stehen dort wie die anderen, mit dem Chip „Nur diese Runde“.
- **Rechts** nur die Szene: Name, Ort und Figuren als [Tags](../bausteine/tags.md), Vorlesetext abgesetzt, Text für den Spielleiter, Dialoge.
- Quests, Ereignisse, Figuren, Gegenstände und Wissen der Szene stehen **nicht** auf der Seite, sondern als Symbole mit Zahl in der Symbolleiste.
- Name und Texte stehen so da, wie die Runde sie hat („In dieser Runde ändern“).

**Neu:** „Neu“ fragt im Dialog nach dem Namen und dem Haken „Optionale Szene“, wie auf der Seite des Kapitels. Die Szene gehört nur dieser Runde, kommt ins Kapitel der Runde (ans Ende des Fadens oder zu den optionalen) und öffnet sich rechts im Formular zum Schreiben. Das Formular ist dasselbe wie beim Schreiben der Welt und speichert sich von selbst.

**Bearbeiten:** wechselt rechts die offene Szene ins Formular; in der Leiste heißt es dann „Lesen“. Eine Szene dieser Runde öffnet das Formular der Szene. Eine Szene der Welt öffnet „In dieser Runde ändern“ (Name, Was passiert, Vorlesen); die Welt bleibt, wie sie ist.

## Bausteine

- [Runden](runden.md) (Cockpit und die Symbole, die es immer gibt)
- [Kachel](../bausteine/kachel.md), [Tags](../bausteine/tags.md), [Popup eines Eintrags](../bausteine/eintrag-popup.md)
- [Seitenfenster eines Eintrags](../bausteine/eintrag-seitenfenster.md) („In dieser Runde ändern“), [Kapitel und Szenen](kapitel-und-szenen.md) (Dialog und Formular einer Szene)
- Code: `gm/cockpit/session-story`, `gm/chapters/scene-thread`, `gm/chapters/scene-view`, `gm/chapters/scene-form`, `components/entry/round-changes`

## Leisten in dieser Ansicht

- **links, hier:** die Ansichten der Runde, „Story" aktiv.
- **oben:** Runde › Welt › Kapitel › Szene, Kapitel-Auswahl, Suche.

Symbolleiste, Abschnitt „zur Ansicht":

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neue Szene in dieser Runde | Dialog: Name und der Haken „Optionale Szene“; legt die Szene in dieser Runde an und öffnet sie zum Schreiben |
| Bearbeiten | Szene bearbeiten bzw. Szene für diese Runde ändern | wechselt die offene Szene ins Formular bzw. in „In dieser Runde ändern“; dort heißt es „Lesen“ |
| Ort | Ort der Szene | Popup des Ortes |
| Figuren | Figuren der Szene | Popup mit Kacheln; Zahl |
| Quests | Quests der Szene | Popup mit Karten: Annehmen, Beendet, Auge; Zahl |
| Ereignisse | Ereignisse der Szene | Popup mit Karten, ganzer Text, Erledigt; die Figuren des Ereignisses und wohin es führt stehen als Tags an seiner Karte (nicht unter „Figuren" der Szene); Zahl |
| Wissen | Gegenstände und Wissen der Szene | Popup mit Kacheln; Zahl |
| Weiter | Führt zu | Popup: die Szenen, zu denen diese führt |
| Haupt | Hauptquests | Popup: alle Hauptquests mit Status |
| Freie | Freie Ereignisse | Popup: offene Ereignisse ohne Szene, nach „Nur diese Runde", „In diesem Kapitel" und „Übrige Welt" |
| Gespielt | Szene gespielt | schaltet |
| Nadel | Stecknadel | schaltet |
| Kampf hier | Kampf in dieser Szene | startet einen Kampf mit Gruppe und Figuren der Szene |

## Zustände

- **keine Szene gewählt:** „Wähle links eine Szene."
- **Kapitel ohne Szene:** „Dieses Kapitel hat noch keine Szene."
- **kein Kapitel:** „Neu“ ist ausgegraut, bis oben ein Kapitel gewählt ist.
- **keine Szene offen:** „Bearbeiten“ ist ausgegraut.

## Tastatur

1 öffnet die Story.

## Offen

entfällt
