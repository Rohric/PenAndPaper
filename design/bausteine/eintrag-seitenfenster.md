# Seitenfenster eines Eintrags

## Userstory

Als Spielleiter will ich einen Eintrag ganz lesen und, wenn ich darf, gleich dort ändern, während die Seite daneben stehen bleibt.

## Lösung

„Zum Eintrag" schließt das Seitenfenster und führt dorthin, wo der Eintrag zu Hause ist.

```
+---------------------------------------------+
| [<][>]  Quest · Der Schwarzmarkt        [x] |
| [LESEN] [Verbindungen] [Runde] [Notiz]      |
+---------------------------------------------+
| (Auge) Beschreibung                         |
|        Im Hafen wird geschmuggelt ...       |
| (zu)   Ziel                                 |
|        Finde den Händler                    |
| ...                                         |
+---------------------------------------------+
|              [Bearbeiten]  [Zum Eintrag]    |
+---------------------------------------------+
```

| Reiter | Inhalt | Wann |
| --- | --- | --- |
| **Lesen** | der ganze Eintrag: [Eintrag lesen](eintrag-lesen.md), in einer Runde mit [Augen](auge.md) | immer |
| **Verbindungen** | verknüpfte Einträge als [Kacheln](kachel.md) in beschrifteten Gruppen; ein Klick wechselt im selben Fenster dorthin; Knopf „Alles auf den Tisch" (Vorher fragt ein Popup, wohin: in eine **neue Gruppe** (der Name des Eintrags ist vorgeschlagen und lässt sich ändern) oder in eine **bestehende Gruppe** des Tisches.) in einer Runde | immer |
| **Runde** | Schalter (Angenommen, Beendet oder Erledigt, Stecknadel, Auf den Tisch, Alles zeigen, Alles verbergen); bei Quests das Questlog der Gruppe; bei einem Eintrag der Welt „In dieser Runde ändern" | nur in einer Runde |
| **Notiz** | Notiz des Spielleiters zu diesem Eintrag in dieser Runde, speichert sich beim Verlassen des Feldes | nur in einer Runde |

Das Seitenfenster gibt es für jede Art: Ort, Figur, Quest, Ereignis, Gegenstand, Wissen, Szene und Kapitel.

**Fuß:**
- Beim Schreiben der Welt: „Bearbeiten" wechselt in das Formular des Eintrags (siehe [Eintrag schreiben](../spielleiter/eintrag-schreiben.md)) und ändert die Welt; im Formular heißt der Knopf „Lesen" und führt zurück. Er steht bei jeder Art an derselben Stelle, auch bei Szenen (das Formular speichert sich dort selbst) und Kapiteln.
- In einer Runde gibt es keinen Knopf, der die Welt ändert. Einen Eintrag der Welt ändert man dort nur für die Runde, im Reiter „Runde" unter „In dieser Runde ändern". Ein Eintrag, den die Runde dazugedichtet hat (Marke „Nur diese Runde"), gehört ihr: Er hat „Bearbeiten" im Fuß wie beim Schreiben, im selben Formular, und das Formular speichert ihn bei der Runde. Die Welt ändert man beim Schreiben unter „Welten".
- „Zum Eintrag" ändert nichts. Es führt zu der Ansicht, in der der Eintrag zu Hause ist (beim Schreiben Glossar oder Kapitel, in einer Runde Story, Quests oder Glossar). In einer Runde fehlt es bei Kapiteln.
- Auf ganzen Seiten (Eintrag im Glossar, Lore, Überblick eines Kapitels, Szene) gibt es keinen Knopf „Bearbeiten" in der Seite; dort steht „Bearbeiten" und „Lesen" als Symbol in der [Symbolleiste](symbolleiste.md).

Im [Masterfenster](../spielleiter/masterfenster.md) gibt es kein „In dieser Runde ändern". Einträge der Welt werden dort nur angesehen und benutzt; Einträge der Runde haben auch dort „Bearbeiten".

**In dieser Runde ändern** gibt es für jede Art. Es ist ein kleines Formular mit den Texten, die eine Runde anders haben darf:

| Art | Felder |
| --- | --- |
| Ort, Figur, Gegenstand, Wissen | Name, Beschreibung |
| Ereignis | Name, Beschreibung, Auslöser, Was passiert |
| Szene | Name, Was passiert, Vorlesen |
| Quest | Name, Beschreibung, Ziel, dazu wie bisher Questgeber, Startgebiet und Entsteht in Szene |

- Die Felder stehen mit dem Text da, der in der Runde gerade gilt. Gespeichert wird beim Verlassen des Feldes, eine Verknüpfung beim Wählen.
- Unter einem geänderten Feld steht klein, was die Welt dort schreibt („In der Welt: …“).
- Ein geleertes Textfeld nimmt die Änderung weg; dann gilt wieder der Text der Welt. Ein Name bleibt nie leer.
- „Zurücksetzen“ nimmt alle Änderungen dieses Eintrags weg; er steht wieder so da wie in der Welt.
- Was die Runde geändert hat, zeigt sie überall: an der Kachel, im Popup, im Seitenfenster, in der Lese-Ansicht, in der Story und auf dem Questbrett. Die Spieler sehen den geänderten Namen, sobald der Eintrag aufgedeckt ist, die anderen Texte, sobald ihr Auge offen ist.
- Ein Eintrag der Runde hat kein „In dieser Runde ändern“; er wird gleich bearbeitet.
- In der Story öffnet „Bearbeiten“ dasselbe Formular für die offene Szene der Welt.

Entschieden: „In dieser Runde ändern“ gibt es für jede Art, mit den Texten aus der Tabelle oben (Emil: „Die Welt ist vorgegeben. Wenn sich während der Runde etwas ergibt, kann man das dazudichten. Es wird aber nicht in der Welt gespeichert.“).

Beim Bearbeiten wird das Fenster breit (720 px).

Entschieden: Bearbeiten gibt es an genau zwei Stellen: im Fuß der Fenster und, auf ganzen Seiten, in der Symbolleiste. Knöpfe „Bearbeiten" in Kacheln, Karten oder mitten in einer Seite gibt es nicht mehr.

## Bausteine

- [Fenster](fenster.md): das Seitenfenster
- [Eintrag lesen](eintrag-lesen.md), [Kachel](kachel.md), [Auge](auge.md), [Notiz](notiz.md)
- Code: `components/entry/entry-window`, `entry-session`, `entry-links`, `round-changes` („In dieser Runde ändern“, die Regeln in `core/round.ts`); das Formular wählt `gm/glossary/entry-form` nach der Art

## Leisten in dieser Ansicht

entfällt

## Zustände

- **ungespeicherte Änderungen:** Schließen und Blättern fragen nach.
- **Eintrag gelöscht:** „Diesen Eintrag gibt es nicht mehr."

## Tastatur

Wie jedes [Fenster](fenster.md). Im Formular speichert Strg + Enter.

## Offen

entfällt
