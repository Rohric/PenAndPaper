# Formular

## Userstory

Als Nutzer will ich in jedem Formular dieselben Felder gleich bedienen und sofort sehen, ob etwas gespeichert ist oder was fehlt.

## Lösung

**Felder.** Ein Feld ist eine Beschriftung über einer Eingabe. Mehrere kurze Felder stehen nebeneinander in einem Raster, lange Texte über die ganze Breite. Textfelder wachsen mit dem Inhalt.

**Reihenfolge in jedem Formular eines Eintrags:**
1. Name
2. Symbol und Bild
3. Kapitel (verknüpfte [Tags](tags.md))
4. Haken „Von Anfang an für Spieler sichtbar"
5. Beschreibung
6. die eigenen Felder der Art (Ziel, Auslöser, Ort, Kategorie …)
7. Wissen für Spieler, Wissen nur für dich
8. Verknüpfungen
9. Löschen, ganz unten, rot

**Verknüpfungen** setzt man durch Tippen, siehe [Tags](tags.md).

**Listen** (Wissen, Checkliste, Dialoge, Inventar, Beispielsätze): jede Zeile mit ihren Feldern und einem Knopf zum Entfernen, darunter ein Knopf zum Hinzufügen.

**Zähler** (Punkte): Beschriftung, Minus, Zahl, Plus, alle mindestens 44 px groß.

**Speichern:**
- Lange Texte der Welt (Szenen) speichern sich kurz nach dem Tippen von selbst; oben steht „Gespeichert".
- Formulare mit Knopf zeigen ihren Stand am Knopf: „Speichern" (etwas geändert), „Gespeichert", „2 Fehler".
- Am Handy ist der Speicherknopf rund, unten rechts, und erscheint nur, wenn etwas geändert ist (siehe [Charaktererstellung](../spieler/charaktererstellung.md)).
- Nach dem Speichern und bei einem Fehler erscheint oben eine kurze [Meldung](meldung.md). Fehlermeldungen stehen nie als Kasten am Seitenanfang.
- Meldungen der Regeln stehen direkt unter dem Feld, das sie betrifft.

**Verlassen mit ungespeicherten Änderungen** fragt nach.

## Bausteine

- Code: `components/form/` (`link-picker`, `id-select`, `symbol-picker`, die Listen-Editoren, `entry-texts-editor`, `auto-grow`)
- [Tags](tags.md), [Meldung](meldung.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

- **gesperrtes Feld:** ausgegraut, mit einem Schloss und einem Satz, warum.

## Tastatur

Tab springt von Feld zu Feld. Enter in einer einzeiligen Liste legt die nächste Zeile an.

## Offen

entfällt
