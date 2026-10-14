# LvUp

## Userstory

Als Spielleiter will ich meinen Spielern jederzeit Bonuspunkte geben, einzeln oder allen auf einmal, und ihre Geistesblitzpunkte auffüllen, für die ganze Gruppe oder für einzelne. Ich und der Spieler sollen sofort sehen, dass es geklappt hat.

## Lösung

Das Symbol **LvUp** im Abschnitt „immer" der Symbolleiste der Runde öffnet ein Popup. Es ersetzt „Kapitel abschließen": das Kapitel der Runde bleibt dabei, wie es ist; gewechselt wird es über das Auswahlfeld in der Kopfleiste.

```
LvUp                                                [x]
-------------------------------------------------------
Bonuspunkte                    [Allen +10] [Alle auf 0]
 Sigrun    (Anna)   frei: 4          [ − ] [ 10 ] [ + ]
 Thorgrim  (Ben)    frei: 0          [ − ] [  0 ] [ + ]
                              [Bonuspunkte geben]
-------------------------------------------------------
Geistesblitz                  [Ganze Gruppe auffüllen]
 Sigrun     2 von 5 übrig                  [Auffüllen]
 Thorgrim   5 von 5 übrig                  [Auffüllen]
```

**Bonuspunkte**
- Jeder Charakter hat ein Zahlenfeld, alle starten bei 0. Minus und Plus ändern um 1, das Feld nimmt jede Zahl ab 0.
- „Allen +10" zählt bei jedem 10 dazu; „Alle auf 0" setzt alle zurück.
- „Bonuspunkte geben" vergibt an alle mit mehr als 0 und setzt die Felder danach auf 0. Solange alles 0 ist, ist der Knopf ausgegraut.
- „frei" zeigt, wie viele Bonuspunkte der Charakter noch nicht verteilt hat.

**Geistesblitz**
- „übrig" zeigt die Geistesblitzpunkte des Charakters über alle drei Begabungen.
- „Auffüllen" gibt einem Charakter alle Geistesblitzpunkte zurück; ausgegraut, wenn er keinen verbraucht hat.
- „Ganze Gruppe auffüllen" gibt allen alles zurück. Das ersetzt „Neuer Abend".

**Einblendung** (siehe [Meldung](../bausteine/meldung.md), Ton „Belohnung"):
- beim Spielleiter: „Bonuspunkte gegeben: Sigrun +10, Thorgrim +5", „Geistesblitz aufgefüllt: ganze Gruppe", „Geistesblitz aufgefüllt: Sigrun"
- beim Spieler: „Du hast 10 Bonuspunkte bekommen", „Deine Geistesblitzpunkte sind wieder voll"; immer, egal welche Seite offen ist

## Bausteine

- [Fenster](../bausteine/fenster.md) (Popup), [Meldung](../bausteine/meldung.md), [Symbolleiste](../bausteine/symbolleiste.md)
- Code: `gm/cockpit/level-up-form.ts`; Server: `sessions/<id>/level/` (Bonuspunkte je Charakter), `sessions/<id>/inspiration/` (Geistesblitz, mit oder ohne Liste von Charakteren)

## Leisten in dieser Ansicht

Das Popup gehört zum Abschnitt „immer" der Symbolleiste der Runde (siehe [Runden](runden.md)).

## Zustände

- **kein Charakter in der Runde:** „Noch kein Charakter in der Runde."
- **alles auf 0:** „Bonuspunkte geben" ausgegraut.
- **Fehler:** rote Meldung, das Popup bleibt offen und behält die Zahlen.

## Tastatur

Tab geht durch die Felder; Enter in einem Zahlenfeld vergibt nichts, nur der Knopf.

## Offen

- Ein Protokoll, wer wann wie viele Punkte bekommen hat, gibt es nicht.
