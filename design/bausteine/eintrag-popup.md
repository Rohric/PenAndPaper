# Popup eines Eintrags

## Userstory

Als Spielleiter will ich im Spiel mit einem Klick sehen, wer oder was ein Eintrag ist, ihn den Spielern zeigen oder anheften und mich zu dem durchklicken, was mit ihm zusammenhängt, ohne die Seite zu verlassen.

## Lösung

```
+------------------------------------------+
| [<][>]  Figur · Sigrun               [x] |
| [KURZ] [Verbindungen 5]                  |
+------------------------------------------+
| Hauptfrau der Stadtwache. Leise Stimme,  |
| Narbe am Kinn. Misstraut jedem Fremden.  |
|                                          |
| (Auge) (Nadel) (ok) (+Tisch)             |
| Notiz: lügt über den Heiler              |
+------------------------------------------+
|        [Seitenfenster]  [Zum Eintrag]    |
+------------------------------------------+
```

Das Popup gibt es für jede Art: Ort, Figur, Quest, Ereignis, Gegenstand, Wissen, Szene und Kapitel.

**Reiter „Kurz":**
- die ersten Zeilen des Textes (höchstens sechs): Beschreibung, bei Quests das Ziel, bei Ereignissen „Was passiert", bei Szenen und Kapiteln der Vorlesetext
- die Notiz des Spielleiters am Eintrag („Notiz (nur für dich)") als eine abgesetzte Zeile, wenn es eine gibt
- die Kapitel als [Tags](tags.md)
- in einer Runde die Schalter: [Auge](auge.md), Stecknadel, Erledigt (Szene: Gespielt, Quest: Beendet), bei Quests „Annehmen", „Auf den Tisch"
- in einer Runde „Alles auf den Tisch": legt den Eintrag und seine Verbindungen auf den Tisch. Vorher fragt ein Popup, wohin: in eine **neue Gruppe** (der Name des Eintrags ist vorgeschlagen und lässt sich ändern) oder in eine **bestehende Gruppe** des Tisches.
- in einer Runde die Notiz des Spielleiters als eine Zeile; ein Klick macht sie zum Feld

**Reiter „Verbindungen":** die verknüpften Einträge in beschrifteten Gruppen als [Tags](tags.md). Ein Klick auf einen Tag wechselt im selben Popup zu diesem Eintrag; der Pfeil links geht zurück.

**Fuß**, bei jeder Art gleich, von links nach rechts:
- „Bearbeiten" (nur beim Schreiben der Welt, nicht in einer Runde) öffnet das [Seitenfenster](eintrag-seitenfenster.md) gleich im Formular und schließt das Popup. Auch Szenen und Kapitel werden so bearbeitet.
- „Seitenfenster" öffnet den Eintrag im [Seitenfenster](eintrag-seitenfenster.md) zum Lesen und schließt das Popup.
- „Zum Eintrag" führt dorthin, wo er zu Hause ist (Glossar, Kapitel, Szene im Kapitel), und schließt das Popup ebenfalls. In einer Runde fehlt es bei Kapiteln, weil ein Kapitel dort keine eigene Seite hat.

Das Popup steht immer mittig im Bildschirm, die Seite dahinter ist leicht abgedunkelt und scrollt nicht.

Außerhalb einer Runde (beim Schreiben der Welt) fehlen die Schalter und die Notiz der Runde.

Entschieden: Szenen und Kapitel öffnen beim Schreiben der Welt wie alle anderen zuerst das Popup, statt gleich die Seite zu wechseln. So geht „Bearbeiten" überall denselben Weg: Popup, Seitenfenster im Formular.

## Bausteine

- [Fenster](fenster.md): das Popup mit Kopf, Reitern und Fuß
- [Tags](tags.md), [Auge](auge.md)
- Code: `components/entry/entry-popup`, Verbindungen aus `components/entry/entry-links`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **keine Verbindungen:** „Mit nichts verknüpft." im Reiter, die Zahl am Reiter fehlt.
- **kein Text:** „Hier steht noch nichts."
- **Eintrag gelöscht:** „Diesen Eintrag gibt es nicht mehr."

## Tastatur

Wie jedes [Fenster](fenster.md): Esc, Alt + Pfeile.

## Offen

entfällt
