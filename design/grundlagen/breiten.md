# Breiten

## Userstory

Als Emil will ich keine verschachtelten Media-Queries pflegen. Der Spielleiter sitzt am großen Bildschirm, die Spieler haben das Handy in der Hand; dafür wird gebaut und für nichts sonst.

## Lösung

Es gibt genau zwei Dateien mit Media-Queries.

### `styles/gm.scss`, Bereich Spielleiter

Gilt unter der Klasse `area-gm` am Rahmen. Gebaut wird ab 1024 px.

| Breite | Was sich ändert |
| --- | --- |
| ab 1024 px | Grundzustand: Leiste links 56 px, Kacheln in zwei bis drei Spalten |
| ab 1280 px | Kacheln in drei bis vier Spalten, Seitenfenster 520 px |
| ab 1600 px | größere Abstände, Seitenfenster 600 px |
| über 1680 px Inhalt | der Inhalt wächst nicht weiter und steht mittig; die Leiste links bleibt am Rand |

Unter 1024 px wird nichts angepasst. Die Seite bleibt benutzbar und lässt sich seitlich schieben.

### `styles/player.scss`, Bereich Spieler

Gilt unter der Klasse `area-player` am Rahmen. Gebaut wird ab 320 px.

| Breite | Was sich ändert |
| --- | --- |
| ab 320 px | Grundzustand: eine Spalte, 14 px Rand |
| ab 400 px | 18 px Rand, Symbole der Leiste etwas breiter |
| ab 560 px | die Spalte bleibt 560 px breit und steht mittig, auch am großen Bildschirm |

### Regeln

- Komponenten enthalten keine Media-Queries. Braucht ein Baustein in den Bereichen verschiedene Maße, stehen sie in `gm.scss` und `player.scss`.
- Einzige Ausnahme: `prefers-reduced-motion` schaltet Bewegung ab.
- Der Rahmen hängt am Bereich: `/gm` zeigt den Rahmen des Spielleiters, `/player` den der Spieler, egal wie breit das Fenster ist.

## Bausteine

- [Rahmen Spielleiter](../spielleiter/rahmen.md)
- [Rahmen Spieler](../spieler/rahmen.md)
- [Fenster](../bausteine/fenster.md): Popup und Seitenfenster haben je Bereich eigene Maße

## Leisten in dieser Ansicht

entfällt

## Zustände

entfällt

## Tastatur

entfällt

## Offen

entfällt
