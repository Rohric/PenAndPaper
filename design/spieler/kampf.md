# Kampf der Spieler

## Userstory

Als Spieler will ich im Kampf sehen, wer dran ist, meinen Angriff oder meine Aktion selbst würfeln, entscheiden, ob ich pariere, und meinen Zug selbst abschließen.

## Lösung

Startet der Spielleiter einen Kampf, erscheint in der Hauptreihe das Symbol **Kampf**. Es trägt einen Punkt, sobald man etwas tun muss (man ist dran, eine Parade wartet, der eigene Zug lässt sich abschließen). Endet der Kampf, verschwindet das Symbol; ist die Seite gerade offen, wechselt die App zur Seite Runde.

Auf der Seite, von oben nach unten:

1. **Kopf:** „Runde 3", Name des Kampfes.
2. **Zeitleiste:** alle Teilnehmer in der Reihenfolge der Initiative; wer dran ist, ist markiert; der eigene Charakter trägt „(du)". Von der eigenen Gruppe sieht man die Lebenspunkte, von Gegnern nicht.
3. **Der offene Wurf:** Angriff, Parade, Schaden.
   - Wird man selbst getroffen: Auswahl „Parieren mit" und die Knöpfe „Parieren" / „Nicht parieren". Eine Parade geht einmal pro Runde.
   - Ist es der eigene Zug und die Parade entschieden: der Knopf **„Zug abschließen"**. Damit zählt der Wurf und der Nächste ist dran.
   - sonst der Satz, worauf gewartet wird.
4. **Du bist dran** (kein Wurf offen): je nach gewähltem Symbol „Angriff" (Ziel, Angriff mit, Waffe, „Angriff würfeln") oder „Aktion" (Was tust du, Haken „Dafür muss ich würfeln", „Probe würfeln" / „Aktion ansagen").

Fähigkeit, Waffe und Ziel des letzten Zugs merkt sich das Handy.

## Bausteine

- [Runde](runde.md), [Würfel](../bausteine/wuerfel.md)
- Regeln: Tutorial „Regelwerk", Kapitel „Der Kampf"
- Code: `player/session/player-battle`, `components/play/` (`battle-timeline`, `battle-exchange`)

## Leisten in dieser Ansicht

Obere Reihe:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Angriff | Angreifen | wählt den Angriff; ausgegraut, wenn man nicht dran ist oder ein Wurf offen ist |
| Aktion | Andere Aktion | wählt die andere Aktion; ausgegraut wie oben |
| Abschließen | Zug abschließen | schließt den eigenen Zug ab; ausgegraut, wenn es nichts abzuschließen gibt |
| Verlauf | Verlauf | Popup: was im Kampf passiert ist |
| Hilfe | Kampfregeln | Tutorial „Regelwerk" an der Stelle „Der Kampf" |

## Zustände

- **kein Kampf:** „Gerade wird nicht gekämpft."
- **eigener Charakter kampfunfähig:** die Zeitleiste zeigt ihn ausgegraut, es gibt nichts zu tun.

## Tastatur

entfällt

## Offen

entfällt
