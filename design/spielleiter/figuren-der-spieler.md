# Figuren der Spieler

## Userstory

Als Spielleiter will ich die Charaktere aller Spieler sehen, wissen, wer frei ist und wer in welchem Abenteuer spielt, und das ändern, was nur mir gehört: Budgets und Lebenspunkte.

## Lösung

Links die Liste der Charaktere, rechts der gewählte [Charakterbogen](../bausteine/charakterbogen.md) zum Lesen.

- **Liste:** Portrait, Name, Konto des Spielers, Marke „frei" oder der Name des Abenteuers als Tag (führt zur Runde). Filter: Alle, Frei, je Abenteuer.
- **Leveln:** ein kleines Formular am Bogen mit dem, was nur der Spielleiter setzt: Budget Grundpunkte, Budget Bonuspunkte, Lebenspunkte und ihr Maximum.

Der Spielleiter schreibt nicht im Charakter der Spieler. Die Figuren der Welt (NSC) stehen nicht hier, sondern im [Glossar](glossarfenster.md).

## Bausteine

- [Rahmen](rahmen.md), [Charakterbogen](../bausteine/charakterbogen.md), [Formular](../bausteine/formular.md)
- Code: `gm/characters/player-characters`

## Leisten in dieser Ansicht

- **links:** „Figuren" in der Gruppe „immer" aktiv; „hier" leer.
- **oben:** „Figuren der Spieler".

Symbolleiste:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Leveln | Budgets und Lebenspunkte | Popup mit dem Formular für den gewählten Charakter |
| Hilfe | Hilfe zu dieser Seite | Tutorial |

## Zustände

- **kein Charakter:** „Noch kein Spieler hat einen Charakter angelegt."
- **keiner gewählt:** „Wähle links einen Charakter."

## Tastatur

entfällt

## Offen

entfällt
