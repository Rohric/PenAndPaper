# Farben und Schrift

## Userstory

Als Nutzer will ich an der Farbe erkennen, was etwas ist und wohin ein Klick führt, damit ich nicht erst lesen muss.

## Lösung

Alle Werte stehen einmal in `frontend/src/styles/_tokens.scss`. Im Code einer Komponente steht nie eine Farbe als Zahl.

### Flächen und Text

| Token | Wert | Wofür |
| --- | --- | --- |
| `--bg` | `#111417` | Hintergrund der Seite, Fenster |
| `--surface` | `#181d22` | Kästen, Kacheln, Leisten |
| `--surface-2` | `#1f252b` | gedrückte und hervorgehobene Flächen |
| `--line`, `--line-2` | `#2b333b`, `#3a434c` | Linien, Ränder |
| `--text` | `#ebe6dc` | Text |
| `--soft` | `#cfc8ba` | Nebentext |
| `--muted` | `#a9b0b7` | Beschriftungen, Ausgeschaltetes |

### Bedeutung

| Token | Wert | Wofür |
| --- | --- | --- |
| `--accent` | `#e3a65c` | das Aktive, der Hauptknopf, Grundpunkte |
| `--info` | `#9cc3d1` | Hinweise, Bonuspunkte |
| `--danger` | `#f0b9a8` | Fehler, Löschen, Guthaben, „zu viel" |
| `--ok` | `#b9d8a6` | geglückt, gespeichert |

### Arten von Einträgen

| Art | Token | Wert |
| --- | --- | --- |
| Ort | `--kind-location` | `#6fd0c2` |
| Figur | `--kind-npc` | `#c4a7f0` |
| Quest | `--kind-quest` | `#f0c060` |
| Ereignis | `--kind-event` | `#f29477` |
| Wissen | `--kind-trivia` | `#8fb8f0` |
| Gegenstand | `--kind-item` | `#c3d977` |
| Szene | `--kind-scene` | `#f0a3c8` |
| Kapitel | `--kind-chapter` | `#d9d2c5` |

Eine Klasse `kind--…` setzt `--kind`. Alles darin (Streifen der Kachel, Symbol, Tag, Überzeile) nimmt diese Farbe. Eigene Kategorien und Tags des Nutzers bekommen einen von acht festen Tönen `--tag-1` bis `--tag-8`; derselbe Name bekommt immer denselben Ton.

### Schrift

- Überschriften und große Zahlen: `--font-display` (Cormorant Garamond).
- Alles andere: `--font-body` (IBM Plex Sans).
- Größen: Fließtext 15 px, klein 13 px, Beschriftung 12 px in Großbuchstaben mit weitem Abstand, Titel 22 bis 30 px.

### Abstände, Radien, Maße

| Token | Wert | Wofür |
| --- | --- | --- |
| `--gap-1` bis `--gap-5` | 4, 8, 12, 18, 28 px | alle Abstände |
| `--radius`, `--radius-sm` | 14, 10 px | Kästen und Fenster; Kacheln und Knöpfe |
| `--touch` | 44 px | kleinste Fläche zum Tippen |
| `--rail`, `--rail-open` | 56, 220 px | Leiste links |
| `--bar` | 52 px | Kopfleiste |
| `--content` | 1680 px | größte Breite des Inhalts beim Spielleiter |
| `--column` | 560 px | Spalte der Spieler |

### Ebenen

| Token | Wert | Was |
| --- | --- | --- |
| `--z-bar` | 30 | Leisten |
| `--z-menu` | 40 | Menü von links |
| `--z-side` | 41 | Seitenfenster |
| `--z-dock` | 44 | Leiste des Charakter-Editors |
| `--z-popup` | 45 | Popup |
| `--z-dialog` | 50 | Dialog |
| `--z-toast` | 60 | kurze Meldung |

## Bausteine

- [Kachel](../bausteine/kachel.md) und [Tags](../bausteine/tags.md) zeigen die Farben der Arten.

## Leisten in dieser Ansicht

entfällt

## Zustände

entfällt

## Tastatur

Der Fokus ist immer sichtbar: ein Rahmen in `--accent`.

## Offen

entfällt
