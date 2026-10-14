# Kapitel und Szenen

## Userstory

Als Spielleiter will ich meine Geschichte Kapitel für Kapitel und Szene für Szene schreiben wie auf einer Seite Papier und dabei sehen, was in welcher Reihenfolge passiert und was wohin führt.

## Lösung

**Liste der Kapitel:** eine [Wand](../bausteine/wand.md) aus Kacheln der Art Kapitel, nach Nummer, in Gruppen nach Kategorie (zum Beispiel „Erster Akt"). Jede Kachel: „Kapitel 2 · Kategorie", Name, Anfang des Textes, klein „3 Szenen · 2 Quests · 4 Ereignisse". Ein Klick öffnet wie überall das Popup; „Zum Eintrag" öffnet das Kapitel. Was zuletzt angelegt und bearbeitet wurde, steht unter „Zuletzt" in der Symbolleiste, nicht auf der Seite.

**Ein Kapitel** hat vier Ansichten, die als Links in der Kopfleiste stehen:

| Ansicht | Inhalt |
| --- | --- |
| **Szenen** | links der rote Faden (nummerierte Szenen, darunter die optionalen; beide Gruppen klappbar), rechts die gewählte Szene |
| **Quests** | eine [Wand](../bausteine/wand.md) mit den Quests des Kapitels und denen seiner Szenen, als Kacheln |
| **Ereignisse** | eine Wand mit den Ereignissen des Kapitels und denen, die an seinen Szenen hängen; die Szenen stehen als Tags an der Kachel |
| **Überblick** | die [Lese-Ansicht](../bausteine/eintrag-lesen.md) des Kapitels: Vorlesen, Worum es geht, Notiz, die Szenen und alles mit dem Tag des Kapitels, alles klappbar |

**Quests und Ereignisse eines Kapitels:** Die Kacheln haben keine Knöpfe. Bearbeitet wird über Popup und Seitenfenster. Ins Kapitel nimmt man einen Eintrag mit „Zuordnen" (Popup mit einem Verknüpfungsfeld: die Einträge, die den Tag des Kapitels tragen; tippen fügt hinzu, das Kreuz nimmt heraus, „neu anlegen" legt an), oder im Formular des Eintrags unter „Kapitel". „Neu" und „neu anlegen" in der Filterleiste legen den Eintrag gleich mit dem Tag des Kapitels an. An welchen Szenen ein Ereignis hängt, setzt man in seinem Formular („Hängt an Szenen") oder in der Szene.

**Eine Szene lesen:** Überzeile „Szene am roten Faden" oder „Optionale Szene" mit Kategorie, Name, Ort und Figuren als [Tags](../bausteine/tags.md), der Vorlesetext abgesetzt, „Was passiert", Notiz, Dialoge, die Ereignisse als Karten, „Führt zu", „Kommt von", Quests, Wissen. Die Abschnitte lassen sich [klappen](../bausteine/klappen.md).

**Eine Szene schreiben:** wie eine Seite Text von oben nach unten: Name, Optionale Szene, Kategorie, Ort, Figuren, Vorlesen, Was passiert, Notiz (nur für dich), Dialoge, Ereignisse, Quests, Wissen, Führt zu. Kein Speicherknopf; kurz nach dem Tippen wird gespeichert, oben steht „Gespeichert". Unter „Führt zu" legt „neu anlegen" eine Szene in diesem Kapitel an.

**Kapitel-Tags:** Alles, was an einer Szene hängt, bekommt von selbst den Tag ihres Kapitels.

**Szenen und Kapitel im Fenster:** Wie jeder Eintrag haben Szene und Kapitel ein Popup und ein Seitenfenster mit „Bearbeiten" im Fuß. Im Seitenfenster bearbeitet man eine Szene im selben Formular wie hier.

Entschieden: Der Faden bekommt keine Filterleiste. Er ist eine kurze, nummerierte Liste; ein Filter würde die Nummern zerreißen. Gesucht wird in der Suche der Kopfleiste. Die Knöpfe „Bearbeiten" und „Aus dem Kapitel nehmen" in den Karten und das Feld „Hängt an Szenen" in jeder Karte sind weg; sie stehen im Seitenfenster, im Formular und in der Symbolleiste.

## Bausteine

- [Rahmen](rahmen.md), [Wand](../bausteine/wand.md), [Kachel](../bausteine/kachel.md), [Tags](../bausteine/tags.md), [Formular](../bausteine/formular.md), [Klappen](../bausteine/klappen.md), [Popup eines Eintrags](../bausteine/eintrag-popup.md), [Eintrag lesen](../bausteine/eintrag-lesen.md)
- Code: `gm/chapters/` (`chapter-list`, `chapter-page`, `chapter-editor`, `chapter-links`, `scene-thread`, `scene-view`, `scene-form`, `event-scenes`)

## Leisten in dieser Ansicht

- **links, hier:** die Reiter der Welt (siehe [Welten](welten.md)), „Kapitel" ist aktiv.
- **oben:** Welten › Welt › Kapitel › 2 · Name › Szene; Links: Szenen, Quests, Ereignisse, Überblick.

Symbolleiste, Liste der Kapitel:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neues Kapitel | Dialog: Name; legt an und öffnet das Kapitel |
| Filter | Filter zeigen bzw. verbergen | schaltet die Filterreihen |
| Alle zu, Alle auf | Alle Gruppen zu- bzw. aufklappen | schaltet direkt |

Symbolleiste, Szenen:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neue Szene | Dialog: Name und der Haken „Optionale Szene"; legt an und öffnet sie zum Bearbeiten |
| Bearbeiten | Szene bearbeiten | wechselt die gewählte Szene ins Formular; dort heißt es „Lesen" |
| Hoch, Runter | Szene im Faden nach oben bzw. unten schieben | schaltet direkt |
| Alle zu, Alle auf | Alle Abschnitte zu- bzw. aufklappen | schaltet direkt |

Symbolleiste, Quests bzw. Ereignisse:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neue Quest in diesem Kapitel bzw. Neues Ereignis in diesem Kapitel | Dialog: Name; legt mit dem Tag des Kapitels an und öffnet das Seitenfenster im Formular |
| Zuordnen | Quests dieses Kapitels bzw. Ereignisse dieses Kapitels | Popup mit dem Verknüpfungsfeld |
| Filter | Filter zeigen bzw. verbergen | schaltet die Filterreihen |
| Alle zu, Alle auf | Alle Gruppen zu- bzw. aufklappen | schaltet direkt |

Symbolleiste, Überblick:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Bearbeiten | Kapitel bearbeiten | Formular im Überblick; im Formular heißt es „Lesen" |
| Alle zu, Alle auf | Alle Abschnitte zu- bzw. aufklappen | schaltet direkt |

Dazu immer „Zuletzt" aus [Welten](welten.md). Die Hilfe zur Seite öffnet das Fragezeichen unten in der linken Leiste.

## Zustände

- **keine Kapitel:** „Noch kein Kapitel. Mit „Neu" unten in der Leiste legst du das erste an."
- **Kapitel ohne Szene:** „Noch keine Szene am Faden." im Faden.
- **Kapitel ohne Quest bzw. Ereignis:** „Dieses Kapitel hat noch keine Quest." bzw. „… kein Ereignis.", mit dem Hinweis auf „Neu" und „Zuordnen".
- **keine Szene gewählt:** „Wähle links eine Szene oder leg mit „Neu" unten in der Leiste eine an."

## Tastatur

Im Formular springt Tab von Feld zu Feld; Strg + Enter speichert das Kapitel.

## Offen

entfällt
