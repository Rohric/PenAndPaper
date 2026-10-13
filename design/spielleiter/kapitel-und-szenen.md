# Kapitel und Szenen

## Userstory

Als Spielleiter will ich meine Geschichte Kapitel für Kapitel und Szene für Szene schreiben wie auf einer Seite Papier und dabei sehen, was in welcher Reihenfolge passiert und was wohin führt.

## Lösung

**Liste der Kapitel:** nummerierte Kacheln mit Name und Anfang des Textes. Ein Klick öffnet das Kapitel.

**Ein Kapitel** hat vier Ansichten, die als Links in der Kopfleiste stehen:

| Ansicht | Inhalt |
| --- | --- |
| **Szenen** | links der rote Faden (nummerierte Szenen, darunter die optionalen), rechts die gewählte Szene |
| **Quests** | die Quests des Kapitels als [Karten](../bausteine/kachel.md) |
| **Ereignisse** | die Ereignisse des Kapitels, mit den Szenen, an denen sie hängen |
| **Überblick** | Text des Kapitels, Vorlesetext, und was im Kapitel vorkommt (alles mit dem Tag des Kapitels) |

**Eine Szene lesen:** Name, Ort und Figuren als [Tags](../bausteine/tags.md), der Vorlesetext abgesetzt, der Text für den Spielleiter, Dialoge, „Führt zu" und „Kommt von".

**Eine Szene schreiben:** wie eine Seite Text von oben nach unten: Name, Ort, Figuren, Vorlesen, Was passiert, Ereignisse, Quests, Wissen, Führt zu. Kein Speicherknopf; kurz nach dem Tippen wird gespeichert, oben steht „Gespeichert".

**Kapitel-Tags:** Alles, was an einer Szene hängt, bekommt von selbst den Tag ihres Kapitels.

## Bausteine

- [Rahmen](rahmen.md), [Kachel](../bausteine/kachel.md), [Tags](../bausteine/tags.md), [Formular](../bausteine/formular.md), [Popup eines Eintrags](../bausteine/eintrag-popup.md)
- Code: `gm/chapters/` (`chapter-list`, `chapter-page`, `chapter-editor`, `chapter-links`, `scene-thread`, `scene-view`, `scene-form`, `event-scenes`)

## Leisten in dieser Ansicht

- **links, hier:** die Reiter der Welt (siehe [Welten](welten.md)), „Kapitel" ist aktiv.
- **oben:** Welt › Kapitel 2 › Szene; Links: Szenen, Quests, Ereignisse, Überblick.

Symbolleiste:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neues Kapitel bzw. Neue Szene | legt an und öffnet zum Schreiben |
| Schreiben | Szene schreiben | wechselt die gewählte Szene ins Schreiben; im Schreiben heißt es „Fertig" |
| Hoch, Runter | Szene im Faden verschieben | schaltet direkt |
| Hinzufügen | Quest oder Ereignis ins Kapitel | Popup: auswählen oder neu anlegen (Ansichten Quests, Ereignisse) |
| Bearbeiten | Kapitel bearbeiten | Formular im Überblick |
| Hilfe | Hilfe zu dieser Seite | Tutorial |

## Zustände

- **Kapitel ohne Szene:** „Noch keine Szene. Leg mit ‚Neu' die erste an."
- **keine Szene gewählt:** „Wähle links eine Szene."

## Tastatur

Im Schreiben springt Tab von Feld zu Feld.

## Offen

entfällt
