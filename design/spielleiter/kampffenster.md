# Kampffenster

## Userstory

Als Spielleiter will ich einen Kampf nach den Regeln führen, ohne zu rechnen: sehen, wer dran ist, einen Angriff oder eine andere Aktion würfeln lassen, die Parade entscheiden und den Zug abschließen.

## Lösung

Nur der Spielleiter startet einen Kampf: „Kampf" nimmt die Gruppe, „Kampf hier" im [Storyfenster](storyfenster.md) zusätzlich die Figuren der Szene.

Auf dem Schirm, von oben nach unten:
1. **Zeitleiste:** alle Teilnehmer als Portraits in der Reihenfolge der Initiative; wer dran ist, ist markiert, wer kampfunfähig ist, ausgegraut. Ein Klick auf ein Portrait gibt oder nimmt Zustände („gefroren" für zwei Züge).
2. **Der offene Wurf** (wenn einer offen ist): Angriff, Parade, Schaden als Zeilen. Wartet der Treffer auf die Parade: Auswahl der Parade und „Parade würfeln" / „Keine Parade".
3. **Der Zug** (wenn kein Wurf offen ist): Schalter „Angriff" / „Andere Aktion", wer, wen, womit, Wert und Schaden; „Angriff würfeln" bzw. „Probe würfeln" / „Aktion festhalten".

Ein gewürfelter Angriff zählt erst, wenn der Zug abgeschlossen ist. Ein Spieler kann seinen eigenen Zug selbst abschließen; verwerfen kann nur der Spielleiter.

Teilnehmer, Verlauf und die Schritte des Kampfes liegen in der Symbolleiste, nicht auf der Seite.

## Bausteine

- [Runden](runden.md), [Würfel](../bausteine/wuerfel.md), [Charakterbogen](../bausteine/charakterbogen.md)
- Code: `gm/battle/battle-view`, `components/play/` (`battle-timeline`, `battle-exchange`, `battle-memory`)

## Leisten in dieser Ansicht

- **links, hier:** die Ansichten der Runde und „Kampf" (aktiv), solange einer läuft.
- **oben:** Runde › Kampf: Name, „Runde 3".

Symbolleiste, Abschnitt „zur Ansicht":

| Wort | voller Name | Klick |
| --- | --- | --- |
| Teilnehmer | Teilnehmer | Popup: alle mit Lebenspunkten (setzbar), „überrascht", Entfernen. Zahl |
| Verlauf | Verlauf | Popup: was passiert ist, neuestes oben |
| Initiative | Initiative würfeln | startet Runde 1 (nur vor dem Beginn) |
| Nächster | Nächster ist dran | gibt den Zug weiter, ohne Wurf |
| Abschließen | Zug abschließen | der offene Wurf zählt, der Nächste ist dran |
| Verwerfen | Wurf verwerfen | der offene Wurf verschwindet |
| Aufnehmen | Teilnehmer aufnehmen | Popup: Figur der Welt oder freier Teilnehmer |
| Beenden | Kampf beenden | beendet den Kampf |

Was gerade nicht geht, ist ausgegraut.

## Zustände

- **Kampf noch nicht begonnen:** nur Teilnehmer und „Initiative".
- **Kampf beendet:** „Die Lebenspunkte der Spielercharaktere stehen schon auf ihren Bögen."

## Tastatur

entfällt

## Offen

entfällt
