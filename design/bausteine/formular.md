# Formular

## Userstory

Als Nutzer will ich in jedem Formular dieselben Felder gleich bedienen und sofort sehen, ob etwas gespeichert ist oder was fehlt.

## Lösung

**Felder.** Ein Feld ist eine Beschriftung über einer Eingabe. Mehrere kurze Felder stehen nebeneinander in einem Raster, lange Texte über die ganze Breite. Textfelder wachsen mit dem Inhalt.

**Reihenfolge in jedem Formular eines Eintrags** (was eine Art nicht hat, fehlt; die Stelle der anderen bleibt):

| | Feld | Wo |
| --- | --- | --- |
| 1 | Name (bei Quests dazu Art und Nummer, bei Kapiteln die Nummer) | Kopf |
| 2 | Symbol und Bild | Kopf |
| 3 | **Kategorie** | Kopf |
| 4 | Kapitel (verknüpfte [Tags](tags.md)) | Kopf |
| 5 | Speichern und Löschen mit dem Stand | Ende des Kopfs |
| 6 | Haken „Von Anfang an für Spieler sichtbar" | Texte |
| 7 | Beschreibung | Texte |
| 8 | die eigenen Texte der Art (Ziel, Checkliste, Auslöser, Was passiert, Vorlesen …) | Texte |
| 9 | Wissen für Spieler, Wissen nur für dich | Texte |
| 10 | **Notiz (nur für dich)** | Texte, immer als Letztes |
| 11 | Dialoge | eigener Kasten |
| 12 | Verknüpfungen | eigener Kasten „Verknüpfungen" |
| 13 | was sofort gespeichert wird (Ereignisse eines Orts, Gegenstände, Szenen eines Ereignisses) | eigene Kästen, mit dem Satz „Das wird sofort gespeichert." |

**Kategorie:** freier Text mit Vorschlägen. Beim Tippen schlägt das Feld die Kategorien vor, die diese Art in der Welt schon hat. Neben der Beschriftung steht ein Punkt im Ton der Kategorie. Darunter: „Im Glossar filterst und gruppierst du nach der Kategorie." Bei Wissen und Gegenständen zusätzlich: „Gegenstand" macht den Eintrag zu einem Gegenstand.

**Notiz (nur für dich):** ein Textfeld, darunter „Nur du siehst sie, auch in jeder Runde." Es ist etwas anderes als die Notiz einer Runde (siehe [Notiz](notiz.md)): die Notiz am Eintrag gehört zur Welt und steht in jeder Runde in der Lese-Ansicht.

**Verknüpfungen** setzt man durch Tippen, siehe [Tags](tags.md). Jedes Verknüpfungsfeld bietet „neu anlegen" an und öffnet bei einem Klick auf einen gesetzten Tag dessen Popup.

**Listen** (Wissen, Checkliste, Dialoge, Inventar, Beispielsätze): jede Zeile mit ihren Feldern und einem Knopf zum Entfernen, darunter ein Knopf zum Hinzufügen.

**Zähler** (Punkte): Beschriftung, Minus, Zahl, Plus, alle mindestens 44 px groß.

**Speichern:**
- Lange Texte der Welt (Szenen) speichern sich kurz nach dem Tippen von selbst; oben steht „Gespeichert".
- Formulare mit Knopf haben „Speichern" und „Löschen" (rot) am Ende des Kopfs, gleich unter den ersten Feldern; daneben steht „Ungespeicherte Änderungen", solange etwas offen ist. Strg + Enter speichert von überall im Formular.
- Was in einem eigenen Kasten „sofort gespeichert" wird, speichert beim Wählen; Kategorie und Notiz einer Figur speichern beim Verlassen des Feldes (die Figur selbst speichert ihr Editor).
- Am Handy ist der Speicherknopf rund, unten rechts, und erscheint nur, wenn etwas geändert ist (siehe [Charaktererstellung](../spieler/charaktererstellung.md)).
- Nach dem Speichern und bei einem Fehler erscheint oben eine kurze [Meldung](meldung.md). Fehlermeldungen stehen nie als Kasten am Seitenanfang.
- Meldungen der Regeln stehen direkt unter dem Feld, das sie betrifft.

**Verlassen mit ungespeicherten Änderungen** fragt nach.

Entschieden: Speichern bleibt am Ende des Kopfs statt ganz unten, weil die Formulare lang sind und der Kopf beim Öffnen immer zu sehen ist. Die Notiz steht als Letztes bei den Texten, direkt nach dem Wissen nur für dich: beides sieht nur der Spielleiter.

## Bausteine

- Code: `components/form/` (`link-picker`, `category-field`, `chapter-field`, `id-select`, `symbol-picker`, die Listen-Editoren, `entry-texts-editor` mit Platz für die eigenen Texte und der Notiz, `editor-bar`, `auto-grow`)
- [Tags](tags.md), [Meldung](meldung.md), [Eintrag schreiben](../spielleiter/eintrag-schreiben.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

- **gesperrtes Feld:** ausgegraut, mit einem Schloss und einem Satz, warum.

## Tastatur

Tab springt von Feld zu Feld. Enter in einer einzeiligen Liste legt die nächste Zeile an. Strg + Enter speichert.

## Offen

entfällt
