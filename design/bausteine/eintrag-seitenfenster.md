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
| **Runde** | Schalter (Angenommen, Beendet oder Erledigt, Stecknadel, Auf den Tisch, Alles zeigen, Alles verbergen); bei Quests das Questlog der Gruppe und „In dieser Runde ändern" | nur in einer Runde |
| **Notiz** | Notiz des Spielleiters zu diesem Eintrag in dieser Runde, speichert sich beim Verlassen des Feldes | nur in einer Runde |

**Fuß:**
- Beim Schreiben der Welt: „Bearbeiten" wechselt in das Formular des Eintrags (siehe [Eintrag schreiben](../spielleiter/eintrag-schreiben.md)) und ändert die Welt.
- In einer Runde gibt es keinen Knopf, der die Welt ändert. Bearbeitet wird dort nur für die Runde, im Reiter „Runde" unter „In dieser Runde ändern". Die Welt ändert man beim Schreiben unter „Welten".
- „Zum Eintrag" ändert nichts. Es führt zu der Ansicht, in der der Eintrag zu Hause ist (Story, Quests oder Glossar).

Im [Masterfenster](../spielleiter/masterfenster.md) gibt es auch kein „In dieser Runde ändern". Dort wird nur angesehen und benutzt.

Beim Bearbeiten wird das Fenster breit (720 px).

## Bausteine

- [Fenster](fenster.md): das Seitenfenster
- [Eintrag lesen](eintrag-lesen.md), [Kachel](kachel.md), [Auge](auge.md), [Notiz](notiz.md)
- Code: `components/entry/entry-window`, `entry-session`, `entry-links`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **ungespeicherte Änderungen:** Schließen und Blättern fragen nach.
- **Eintrag gelöscht:** „Diesen Eintrag gibt es nicht mehr."

## Tastatur

Wie jedes [Fenster](fenster.md). Im Formular speichert Strg + Enter.

## Offen

- „In dieser Runde ändern" gibt es bisher nur für Quests (Name, Ziel, Questgeber, Startgebiet, Szene). Für Orte, Figuren, Ereignisse und Wissen ist noch nicht entschieden, ob und was sich nur für eine Runde ändern lässt.
