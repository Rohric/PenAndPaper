# Symbolleiste

## Userstory

Als Nutzer will ich unten immer dieselbe Leiste haben, in der die Werkzeuge und Informationen liegen, die ich gerade brauchen könnte, damit der Schirm frei bleibt für das, was ich lese.

## Lösung

Die Leiste liegt immer unten. Jedes Symbol hat ein Zeichen, ein kurzes Wort darunter und, wenn es etwas zu zählen gibt, eine Zahl oder einen Punkt. Der volle Name erscheint beim Drüberfahren.

Ein Symbol tut eines von zwei Dingen: es **schaltet** direkt (dann wirkt es gedrückt) oder es **öffnet ein Popup** über sich (siehe [Fenster](fenster.md)).

### Spielleiter: eine Reihe, drei Abschnitte

```
| immer                | zur Ansicht                       | rechts            |
| Gruppe Würfeln Chat2 | Ort Figuren3 Quests2 Ereign.2 ... | Nadeln 4  Wurf 41 |
```

1. **immer:** auf jeder Seite gleich. In einer Runde: Gruppe, Würfeln, Chat, Kampf, Archiv, Kapitel.
2. **zur Ansicht:** was die offene Seite anmeldet. Wechselt die Seite, wechselt die Mitte.
3. **rechts:** in einer Runde die Stecknadeln (ein Symbol je Art, nur Arten mit Nadeln) und der letzte Wurf.

### Spieler: zwei Reihen

```
| Bogen  Würfeln  Bearb.  Blitz2  ? |   zur Seite (niedriger)
| Menü  Runde3  Charak.  Quests1  Chat2 |   Hauptreihe
```

Die untere Reihe ist die Hauptreihe, ganz links steht immer **Menü** (siehe [Leiste links](leiste-links.md)). Die obere Reihe gehört zur offenen Seite und fehlt, wenn die Seite nichts anmeldet. Läuft ein Kampf, kommt in der Hauptreihe das Symbol **Kampf** dazu.

### Regeln

- Wörter sind kurz (höchstens zehn Zeichen). Der volle Name steht als Titel am Symbol.
- Jede Seiten-Datei führt ihre Symbole als Tabelle auf: Wort, voller Name, was der Klick tut.
- Informationen, die nicht dauernd sichtbar sein müssen (Quests und Ereignisse einer Szene, Gruppe, Würfe, Verlauf), stehen als Symbol mit Zahl in der Leiste, nicht als Abschnitt auf der Seite.
- Ein Symbol, das gerade nichts tun kann, ist ausgegraut, nicht weg.
- Dieselben Handgriffe heißen auf jeder Seite gleich und stehen in dieser Reihenfolge: „Neu", „Bearbeiten" (im Formular „Lesen"), „Zuordnen", eigene Symbole der Seite (etwa „Hoch", „Runter"), „Filter", „Alle zu", „Alle auf". Knöpfe in der Seite, die dasselbe tun, gibt es nicht.
- Braucht eine Komponente den unteren Rand selbst (der Charakter-Editor der Spieler), deckt sie die Leiste ab.

## Bausteine

- [Fenster](fenster.md): Popups der Symbole
- Code: `global/tool-bar/tools.service` (Symbole anmelden), `gm-tool-bar`, `player-tool-bar`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **keine Symbole zur Ansicht:** der mittlere Abschnitt bzw. die obere Reihe fehlt.

## Tastatur

Mit Tab erreichbar. Esc schließt das Popup eines Symbols.

## Offen

entfällt
