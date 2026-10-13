# Würfel

## Userstory

Als Spieler will ich einen Wurf sehen, als würde ich ihn selbst werfen, und sofort verstehen, ob er gelungen ist. Als Spielleiter will ich für jeden würfeln können, auch heimlich.

## Lösung

Der Server würfelt jeden Wurf. Es gibt zwei Arten:

- **Probe:** ein W100 gegen einen Wert. Ergebnis: kritischer Erfolg, Erfolg, Fehlschlag, Patzer.
- **Freier Wurf:** ein W100 oder ein bis zehn W10, mit Summe.

**Darstellung eines Wurfs:** kurze Bewegung, dann die Zahl groß, das Ergebnis in Worten und eine Skala von 1 bis 100 mit den vier Bereichen und der Stelle des Wurfs. Kritisch in Akzentfarbe, Patzer rot.

**Würfelfeld:** die Werte des Charakters als Knöpfe (Begabungen, dann Fähigkeiten) und die freien Würfel. Der Spielleiter wählt vorher, für wen er würfelt (Charakter der Gruppe oder Figur der Welt), und kann „Heimlich" anhaken.

**Geistesblitz:** Nach einer misslungenen Probe, die kein Patzer war, erscheint „Geistesblitz einsetzen · Begabung · noch N", solange die Begabung Punkte hat.

**Liste der Würfe:** die letzten Würfe der Runde, neueste oben: wer, worauf, Zahl, Ergebnis. Heimliche Würfe sieht nur der Spielleiter, mit Schloss.

## Bausteine

- Code: `components/play/` (`dice-roll`, `roll-panel`, `session-rolls`)
- Regeln: [Würfeln der Spieler](../spieler/wuerfeln.md)

## Leisten in dieser Ansicht

Der letzte Wurf steht beim Spielleiter rechts in der [Symbolleiste](symbolleiste.md), bei den Spielern als Symbol „Würfe" auf der Seite Runde.

## Zustände

- **noch kein Wurf:** „Noch kein Wurf."

## Tastatur

entfällt

## Offen

entfällt
