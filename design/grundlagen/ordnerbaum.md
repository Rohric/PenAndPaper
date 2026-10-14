# Ordnerbaum

## Userstory

Als Emil will ich an einem Ordnernamen erkennen, ob etwas ein Baustein für alle ist, zum Rahmen gehört oder eine Seite eines Bereichs ist, damit jede Datei genau einen Platz hat.

## Lösung

```
frontend/src/
├── styles.scss            Einstieg, lädt die Dateien aus styles/
├── styles/
│   ├── _tokens.scss       Farben, Schrift, Abstände, Maße, Ebenen
│   ├── _base.scss         Grundtext, Links, Fokus
│   ├── _parts.scss        gemeinsame Klassen: Kasten, Kachel, Tag, Knopf, Feld, Reiter
│   ├── gm.scss            Desktop: Rahmen und Breiten des Spielleiters
│   └── player.scss        Handy: Rahmen und Breiten der Spieler
└── app/
    ├── core/              ohne Oberfläche: API, Anmeldung, Models, Regeln, Stores; dazu die Regeln der Wände
    │                      (wall.ts: suchen, filtern, gruppieren), das Gedächtnis des Klappens (folds.ts) und was eine
    │                      Runde für sich hat (round.ts: Änderungen je Art, Gruppen des Tisches, Notiz umwandeln)
    ├── global/            der Rahmen, der immer da ist
    │   ├── frame/         wählt den Rahmen des Bereichs
    │   ├── side-rail/     Leiste links und Menü von links
    │   ├── top-bar/       Kopfleiste
    │   ├── tool-bar/      Symbolleiste und ihr Dienst
    │   ├── tutorial/      Tutorial-Fenster und Texte
    │   └── toast/         kurze Meldungen
    ├── components/        Bausteine mit einem Aussehen
    │   ├── window/        Popup, Seitenfenster, Dialog, gemeinsamer Kopf (window-head), Verlauf (window-history), Reihenfolge und Scrollsperre (window-stack)
    │   ├── entry/         die eine Kachel (entry-card, Inhalt aus entry-face), die Wand aus Kacheln (entry-wall, ihre Kacheln aus wall-tiles), Popup (entry-popup) und Seitenfenster (entry-window) eines Eintrags, Verbindungen (entry-links), Schalter der Runde (entry-session), „In dieser Runde ändern“ (round-changes), die Frage zum Tisch (table-ask), Lese-Ansicht, Auge, Tags
    │   ├── form/          Felder, Auswahl, Listen-Editoren, die Filterleiste (filter-bar), die Felder „Kapitel“ (chapter-field), „Kategorie“ (category-field) und „Notiz (nur für dich)“ (note-field), wachsende Textfelder (auto-grow), der Dialog „Neu anlegen“ (name-dialog)
    │   ├── character/     Bogen, Editor, Skillung, Punkte
    │   ├── play/          was beide Bereiche in der Runde teilen: Würfel, Chat, Notizen, Questlog, Kampfteile
    │   └── basic/         Symbol, Portrait, Zeitangabe, Klappen (fold)
    ├── gm/                Seiten des Spielleiters (Desktop)
    │   ├── worlds/  chapters/  glossary/
    │   ├── sessions/  cockpit/  master/ (mit der Notiz auf dem Tisch, table-note)  battle/
    │   └── characters/
    ├── player/            Seiten der Spieler (Handy)
    │   ├── characters/  sessions/  session/
    └── auth/              Anmeldung und Registrierung
```

Regeln:

- `core/` kennt keine Komponenten. `components/` und `global/` kennen keine Seiten aus `gm/` und `player/`.
- Eine Seite liegt in dem Bereich, in dem sie gezeigt wird. Was beide Bereiche brauchen, ist ein Baustein unter `components/`.
- Eine Komponente besteht aus `name.ts` und, wenn nötig, `name.html` und `name.scss`. Styles stehen in der `.scss`-Datei, nicht im Code.
- In einer `.scss`-Datei einer Komponente steht nur, was nur sie betrifft. Farben, Abstände und Maße kommen aus den Tokens. Keine Media-Queries.

## Bausteine

- [Regeln](regeln.md)
- [Breiten](breiten.md)
- [Farben und Schrift](farben-und-schrift.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

entfällt

## Tastatur

entfällt

## Offen

entfällt
