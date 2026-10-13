# Masterfenster

## Userstory

Als Spielleiter will ich während des Spiels ein Fenster, in dem ich alles schnell finde, ansehe und benutze, ohne an einer Szene zu hängen und ohne etwas zu ändern. Was ich gleich brauche, lege ich mir auf den Tisch.

## Lösung

Das Masterfenster ist unabhängig von der Story. Die Szene, die dort offen ist, spielt hier keine Rolle.

```
+-------------+--------------------------------------------+------+
| NOTIZEN     | [Suche in allem .......................]   | (An) |
| [+ Neue]    |                                            | (Be) |
| Verhörplan  | 1 - 2 - 3 - [4] - 5 | frei: o o             | (Cl) |
| Preise      |                                            |      |
| -----       | MEIN TISCH                                 |      |
| EINTRÄGE    |  Für später: [Eyvind] [Der Pilz]           |      |
| MIT NOTIZ   |  Kampf: [Wolf] [Räuber]                    |      |
| Sigrun      |                                            |      |
| Wachhaus    | [Szenen 6] [Quests 6] [Ereignisse 7]       |      |
|             | [Figuren 14] [Orte 9] [Gegenstände 5]      |      |
|             | [Wissen 11]                                |      |
|             |   Kacheln der offenen Schublade            |      |
+-------------+--------------------------------------------+------+
```

**Links, Notizen.** Die [Notizen](../bausteine/notiz.md) der Runde mit „Neue", darunter „Einträge mit Notiz" (Name und Anfang der Notiz). Ein Klick auf eine Notiz öffnet sie im Seitenfenster, ein Klick auf einen Eintrag sein Popup.

**Mitte, von oben nach unten.**
1. **Suche in allem.** Solange Text im Feld steht, zeigt die Mitte nur die Treffer als [Kacheln](../bausteine/kachel.md) (höchstens 30).
2. **Zeitleiste der Szenen** des Kapitels: nummerierte Haltepunkte, gespielte markiert, die freien Szenen hinter einem Strich. Ein Klick öffnet das Popup der Szene.
3. **Mein Tisch.** Die eigenen Gruppen des Spielleiters mit ihren Kacheln. Je Kachel die Auswahl der Gruppe und „Vom Tisch". Jede Gruppe (jeder Tisch) lässt sich am Titel zu- und aufklappen; zugeklappt zeigt sie nur Titel und Zahl der Kacheln. Was zugeklappt ist, merkt sich das Gerät je Runde.
4. **Schubladen.** Eine Reihe großer Knöpfe mit Zahl: Szenen, Quests, Ereignisse, Figuren, Orte, Gegenstände, Wissen. Genau eine ist offen (Start: Szenen), ein Klick auf die offene schließt sie. Darunter die Kacheln dieser Art nach den Filtern. Die offene Schublade wird je Runde gemerkt.

**Rechts, Charaktere.** Je Charakter der Gruppe ein runder Knopf mit Portrait, schmalem Lebensbalken und der Zahl ungelesener geheimer Nachrichten. Ein Klick öffnet links daneben ein Popup mit der Charakter-Kachel (Lebenspunkte setzen, Bogen, Nachrichten, Gegenstand).

**Kacheln im Master** tragen alle Schalter der Runde: Auge, Stecknadel, Notiz, Erledigt, Auf den Tisch.

**Ein Klick auf eine Kachel** öffnet das [Popup des Eintrags](../bausteine/eintrag-popup.md). Über seinen Reiter „Verbindungen" klickt man sich durch alles, was zusammenhängt; „Alles auf den Tisch" (im Popup, im [Seitenfenster](../bausteine/eintrag-seitenfenster.md) und im Popup einer Szene) legt den Eintrag und seine Verbindungen auf den Tisch. Vorher fragt ein Popup, wohin: in eine **neue Gruppe** (der Name des Eintrags ist vorgeschlagen und lässt sich ändern) oder in eine **bestehende Gruppe** des Tisches. Es gibt keinen Kasten „Dazu gehört" mehr auf der Seite.

**Nur ansehen und benutzen.** Im Master gibt es kein Bearbeiten: das Seitenfenster hat hier weder „Bearbeiten" noch „In dieser Runde ändern", die Kacheln kein „Zur Szene". Wer etwas ändern will, nimmt „Zum Eintrag" und landet in Story, Quests oder Glossar. Die Schalter der Runde (zeigen, anheften, abhaken, annehmen, auf den Tisch, notieren, Lebenspunkte) sind Spielen, nicht Bearbeiten, und bleiben.

**Filter** (Schalter in der Symbolleiste) wirken auf Schubladen und Suche, nicht auf „Mein Tisch":

| Schalter | Wirkung | Start |
| --- | --- | --- |
| Offen | blendet aus, was erledigt ist | an |
| Geteilt | nur, was die Spieler sehen | aus |
| Angepinnt | nur Einträge mit Stecknadel | aus |
| Kapitel | nur Einträge mit dem Tag des Kapitels der Runde | an |

## Bausteine

- [Runden](runden.md), [Kachel](../bausteine/kachel.md), [Popup eines Eintrags](../bausteine/eintrag-popup.md), [Seitenfenster eines Eintrags](../bausteine/eintrag-seitenfenster.md), [Notiz](../bausteine/notiz.md), [Charakterbogen](../bausteine/charakterbogen.md), [Tags](../bausteine/tags.md)
- Code: `gm/master/master-table`

## Leisten in dieser Ansicht

- **links, hier:** die Ansichten der Runde, „Master" aktiv.
- **oben:** Runde › Welt › Kapitel, Kapitel-Auswahl, Suche.

Symbolleiste, Abschnitt „zur Ansicht":

| Wort | voller Name | Klick |
| --- | --- | --- |
| Auf Tisch | Auf den Tisch legen | Popup: Suche und Zielgruppe; die Zielgruppe gilt auch für den Knopf an den Kacheln |
| Gruppe neu | Neue Gruppe anlegen | Popup: Name |
| Offen | Erledigtes ausblenden | schaltet |
| Geteilt | Nur für Spieler sichtbare | schaltet |
| Angepinnt | Nur angepinnte | schaltet |
| Kapitel | Nur dieses Kapitel | schaltet |

## Zustände

- **Tisch leer:** „Der Tisch ist leer. Mit ‚Auf Tisch' legst du Einträge dazu und sortierst sie in eigene Gruppen."
- **Schublade leer:** „Hier ist nichts, was zu den Filtern passt."
- **Suche ohne Treffer:** „Nichts gefunden."

## Tastatur

2 öffnet den Master. „/" springt in die Suche des Rahmens.

## Offen

entfällt
