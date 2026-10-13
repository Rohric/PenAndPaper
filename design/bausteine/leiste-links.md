# Leiste links

## Userstory

Als Nutzer will ich links alle Reiter als Symbole haben, mit einem Klick dort sein und die Leiste ausfahren können, wenn ich die Namen lesen oder das Konto wechseln will.

## Lösung

Die Leiste hat zwei Gruppen und einen Fuß.

- **immer:** was es in diesem Bereich überall gibt.
- **hier:** die Reiter des Orts, an dem man gerade ist. Die offene Seite meldet sie an.
- **Fuß:** Hilfe, Ausfahren. Ausgefahren zusätzlich: Name des Kontos, Wechsel zwischen Spieler und Spielleiter (nur wenn freigeschaltet), Abmelden.

### Spielleiter: feste Leiste

```
eingefahren (56 px)        ausgefahren (220 px)
+----+                     +----------------------+
|[W] |  immer              | [W] Welten           |
|[R] |                     | [R] Runden           |
|[F] |                     | [F] Figuren          |
|----|                     |----------------------|
|[St]|  hier               | [St] Story        1  |
|[Ma]|                     | [Ma] Master       2  |
|[Qu]|                     | [Qu] Quests       3  |
|----|                     |----------------------|
|[?] |                     | [?] Hilfe            |
|[>>]|                     | emil · Spielleiter   |
+----+                     | [Spieler] [Abmelden] |
                           | [<<] einfahren       |
                           +----------------------+
```

- Eingefahren stehen nur Symbole; der Name erscheint beim Drüberfahren.
- Ausgefahren steht hinter jedem Reiter der Gruppe „hier" seine Taste (1 bis 9).
- Der Zustand (ein- oder ausgefahren) wird gemerkt.
- Der aktive Reiter ist in Akzentfarbe hinterlegt. Ein Reiter kann eine Zahl tragen (zum Beispiel neue Notizen).

### Spieler: Menü von links

Am Handy gibt es keine feste Leiste. Das Symbol **Menü** ganz links in der [Symbolleiste](symbolleiste.md) fährt dasselbe Menü von links aus, die Seite dahinter ist abgedunkelt. Ein Tipp auf einen Reiter oder neben das Menü schließt es.

```
+------------------+-------------+
| Charaktere       |             |
| Runden           |   (Seite    |
| Regeln           |   abgedunkelt)
| ---------------- |             |
| Glossar          |             |
| Notizen          |             |
| Gruppe           |             |
| ---------------- |             |
| emil  [Abmelden] |             |
+------------------+-------------+
```

### Was wo steht

| Ort | immer | hier |
| --- | --- | --- |
| Spielleiter, Liste der Welten | Welten, Runden, Figuren | – |
| Spielleiter, in einer Welt | wie oben | Kapitel, Lore, Orte, Figuren, Quests, Ereignisse, Gegenstände, Wissen |
| Spielleiter, in einer Runde | wie oben | Story, Master, Quests, Glossar, Notizen, Spieleransicht; Kampf, solange einer läuft |
| Spieler, außerhalb einer Runde | Charaktere, Runden, Regeln | – |
| Spieler, in einer Runde | wie oben | Glossar, Notizen, Gruppe |

## Bausteine

- Code: `global/side-rail/`, Reiter anmelden über `global/frame/nav.service`
- [Kopfleiste](kopfleiste.md), [Symbolleiste](symbolleiste.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

- **Gruppe „hier" leer:** die Trennlinie und die Gruppe fehlen.

## Tastatur

Spielleiter: die Ziffern 1 bis 9 öffnen die Reiter der Gruppe „hier". Esc schließt das Menü der Spieler.

## Offen

entfällt
