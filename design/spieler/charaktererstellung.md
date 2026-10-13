# Charaktererstellung

## Userstory

Als Spieler will ich meinen Charakter am Handy bauen, wie es das Regelwerk vorsieht: 400 Punkte verteilen, bis alles passt. Ich will dabei immer sehen, wie viele Punkte offen sind, ohne dass mir oben etwas den Schirm wegnimmt.

## Lösung

Die Erstellung gilt, solange der Charakter in **keiner laufenden Runde** spielt. Es gilt nur das Regelwerk. Bonuspunkte, Staffel und Guthaben kommen hier nirgends vor: kein Zähler, kein Tag, kein Kreis, kein Balken.

```
+--------------------------------+
| [Zum Bogen]                    |
| HANDELN   [Begabungswert 18]   |
|           [Geistesblitz 2]     |
|   Holzfällen              78   |
|   Grund   [-] 60 [+]           |
|   Axtkampf                68   |
|   Grund   [-] 50 [+]           |
|   ...                          |
+--------------------------------+
| (37)   [P] [S] [I] [E]    (ok) |
+--------------------------------+
```

**Nichts klebt oben.** Der Editor deckt die Symbolleiste ab und zeigt unten seine eigene Leiste:

- **Links der Punkte-Tag:** ein Kreis in der Farbe der Grundpunkte mit der Zahl der offenen Grundpunkte, ohne Schrift. Blass bei 0, voll rot bei weniger als 0. Ein Tipp öffnet die Punkteübersicht als Popup (Balken Grundpunkte, die drei Begabungen mit Wert und Geistesblitz).
- **Mitte die Abschnitte** als Symbole: Profil, Skillung, Inventar, Extra. Ein Tipp wechselt und scrollt nach oben.
- **Rechts der Speicherknopf:** rund, nur mit Haken. Er erscheint erst, wenn etwas geändert ist. Bei Fehlern ist er rot und trägt ihre Zahl.

**Abschnitte:**

| Abschnitt | Inhalt |
| --- | --- |
| Profil | Name, Symbol und Bild, Alter, Geschlecht, Beruf, Beschreibung, Hintergrundgeschichte; Lebenspunkte und Budgets zum Lesen; Löschen |
| Skillung | je Begabung ein Kasten mit Begabungswert und Geistesblitz; je Fähigkeit Name, Wert groß rechts, ein Zähler „Grund", Beschreibung, Entfernen; „Fähigkeit" zum Hinzufügen |
| Inventar | Gegenstände und Waffen (Schaden in W10 und Bonus), Haken „verstecken" |
| Extra | besondere Fähigkeiten mit Würfelbedingung |

**Regeln, die die App prüft:** mindestens 1 Punkt je Fähigkeit; kein Wert über 100 („‚Schwert' hat Wert 104. Höchstwert ist 100: Verteile 4 Punkte in Handeln um."); nicht mehr als das Budget der Grundpunkte. Die Meldung steht direkt unter der Fähigkeit.

Trägt eine Fähigkeit Punkte aus früheren Abenteuern, steht unter dem Zähler eine Zeile zum Lesen: „+15 aus Abenteuern".

**Speichern:**
- geglückt: oben kurz „Gespeichert", der Knopf verschwindet, man ist wieder am Bogen.
- Fehler der Regeln: oben kurz „2 Fehler in der Skillung", und die Seite springt zur ersten Stelle.
- Fehler vom Server: oben kurz die Meldung in Rot. Kein Kasten am Seitenanfang.

## Bausteine

- [Charakterbogen](../bausteine/charakterbogen.md), [Formular](../bausteine/formular.md), [Meldung](../bausteine/meldung.md), [Fenster](../bausteine/fenster.md)
- weiter mit [Charakter in der Runde](charakter-in-der-runde.md)
- Code: `components/character/` (`character-editor`, `skill-editor`, `points-overview`), Regeln in `core/rules.ts`

## Leisten in dieser Ansicht

Die Symbolleiste ist abgedeckt. Es gilt die Leiste des Editors (siehe Lösung).

## Zustände

- **Name fehlt:** zählt als Fehler; der Speicherknopf führt zum Profil.
- **ungespeicherte Änderungen:** „Zum Bogen" und Verlassen fragen nach.

## Tastatur

entfällt

## Offen

entfällt
