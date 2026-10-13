# Tutorials

## Userstory

Als neuer Spieler will ich genau erklärt bekommen, was How to be a Hero ist und wie gespielt wird, mit Beispielen. Als erfahrener Nutzer will ich schnell eine bestimmte Regel oder eine Seite der App nachschlagen.

## Lösung

Tutorials sind Texte in einem [Dialog](../bausteine/fenster.md). Jeder Schritt hat Überschrift, Text und, wenn es passt, eine Liste, ein Beispiel oder einen Tipp.

```
+------------------------------------------------------+
| [Alle Themen] [<- Meine Runden]   Regelwerk      [x] |
+-------------------+----------------------------------+
| WAS IST DAS?      |  Kritischer Erfolg               |
|  1 Erzählen       |                                  |
|  2 Am Tisch       |  Das erste Zehntel deines Werts  |
| DIE PROBE         |  ist kritisch, eine 1 immer.     |
| 16 Der W100       |                                  |
|[18 Kritisch ]     |  BEISPIEL                        |
| 19 Patzer         |  Wert 56: 1 bis 5 sind kritisch. |
+-------------------+----------------------------------+
|  [Schließen]                    [Zurück]  [Weiter]   |
+------------------------------------------------------+
```

- **Senkrechte Leiste der Schritte** links, scrollbar; der offene Schritt ist farbig. Am Desktop Nummer und Titel mit Kapitelüberschriften, am Handy eine schmale Spalte nur mit Nummern.
- **Alle Themen:** ein Menü mit drei Punkten zum Aufklappen: „Regelwerk How to be a Hero" (seine Kapitel), „Spieler" (seine Tutorials), „Spielleiter" (nur wenn freigeschaltet).
- **Zurück-Taste oben:** zurück zu dem Tutorial und Schritt, von dem man kam.
- **Hausregeln** tragen die Marke „Hausregel" und die Zeile „Gilt in unserer Runde, steht nicht im offiziellen Regelwerk."

**Die Tutorials:**

| Punkt | Tutorial | Inhalt |
| --- | --- | --- |
| Regelwerk | Regelwerk How to be a Hero | sechs Kapitel: Was ist das, Dein Charakter, Die Probe, Der Kampf, Vor- und Nachteile, Unsere Hausregeln. Eine Beispielfigur (Mara) für alle Rechnungen |
| Spieler | Willkommen, Spieler | erster Besuch: worum es geht, erster Charakter, in eine Runde kommen, die Leiste unten |
| Spieler | Meine Charaktere | anlegen, Erstellung, offene Punkte, Speichern, Bogen, was in der Runde anders ist |
| Spieler | Meine Runden | die Seiten der Runde, Würfeln, Quests, Chat, Kampf |
| Spielleiter | elf Tutorials | Welten, Kapitel, Szenen, Glossar, die Arten, Runden und Cockpit |

**Einstiege:** „Regeln" in der Hauptreihe, „Hilfe" in der oberen Reihe jeder Seite (öffnet an der passenden Stelle), „Neu hier? So wird gespielt" bei der leeren Liste der Charaktere, die Hilfe-Knöpfe in der Skillung.

Quelle der Regeln: das offizielle Wiki howtobeahero.de (CC BY-NC-SA 4.0), in eigenen Worten, mit Quellenzeile im ersten Schritt jedes Kapitels.

## Bausteine

- [Fenster](../bausteine/fenster.md) als Dialog
- Code: `global/tutorial/` (`tutorial-window`, `tutorial-content`, `tutorial-button`), `core/tutorial.service`

## Leisten in dieser Ansicht

Der Dialog deckt die Leisten ab.

## Zustände

entfällt

## Tastatur

Esc schließt. Pfeil rechts und links blättern die Schritte.

## Offen

entfällt
