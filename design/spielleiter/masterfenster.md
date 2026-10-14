# Masterfenster

## Userstory

Als Spielleiter will ich während des Spiels ein Fenster, in dem ich alles schnell finde, ansehe und benutze, ohne an einer Szene zu hängen und ohne die Welt zu ändern. Was ich gleich brauche, lege ich mir auf den Tisch. Auf dem Tisch habe ich Gruppen, die ich mit Inhalt fülle, auch mit Notizen, die ich behalte, in einen Eintrag umwandle oder einfach liegen lasse.

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

**Links, Notizen.** Die [Notizen](../bausteine/notiz.md) der Runde mit „Neue", darunter „Einträge mit Notiz" (Name und Anfang der Notiz). Ein Klick auf eine Notiz öffnet sie im Seitenfenster, ein Klick auf einen Eintrag sein Popup. Notizen, die auf dem Tisch liegen, stehen hier erst, wenn sie behalten werden.

**Mitte, von oben nach unten.**
1. **Suche in allem.** Solange Text im Feld steht, zeigt die Mitte nur die Treffer als [Kacheln](../bausteine/kachel.md) (höchstens 30).
2. **Zeitleiste der Szenen** des Kapitels: nummerierte Haltepunkte, gespielte markiert, die freien Szenen hinter einem Strich. Ein Klick öffnet das Popup der Szene.
3. **Mein Tisch.** Die Überschrift trägt den Kompass, das Zeichen des Masterfensters. Darunter die eigenen Gruppen des Spielleiters mit ihren Einträgen und Notizen. Eine Gruppe gibt es, solange etwas darin liegt (frisch angelegt bleibt sie leer, bis man die Seite verlässt). Jede Gruppe (jeder Tisch) lässt sich am Titel zu- und aufklappen; zugeklappt zeigt sie nur Titel und Zahl (Einträge und Notizen zusammen). Was zugeklappt ist, merkt sich das Gerät je Runde. Rechts in der Kopfzeile jeder Gruppe stehen „Notiz“ (legt eine neue, leere [Notiz auf dem Tisch](../bausteine/notiz.md) in diese Gruppe) und „Löschen“. „Ohne Gruppe“ hat kein „Notiz“: eine Notiz ohne Gruppe ist eine gewöhnliche Notiz und entsteht links mit „Neue“.

   „Löschen“ fragt zuerst in einem Popup: „Gruppe „X“ löschen? Die Einträge gehen vom Tisch, die Notizen werden gelöscht.“ (nur mit Einträgen: „… Die Einträge gehen vom Tisch.“, nur mit Notizen: „… Die Notizen werden gelöscht.“, bei einer leeren Gruppe nur „Gruppe „X“ löschen?“). Mit „Löschen“ gehen alle Einträge der Gruppe vom Tisch, ihre Notizen sind gelöscht, die Gruppe verschwindet, und dass sie zu- oder aufgeklappt war, ist vergessen. Die Einträge selbst bleiben in der Welt und in der Runde; es fällt nur ihr Platz auf dem Tisch weg. Eine Notiz, die nicht behalten oder umgewandelt wurde, ist dagegen verloren. Auch „Ohne Gruppe“ hat den Knopf; dort räumt er die losen Einträge vom Tisch.

   **Die Einträge einer Gruppe** liegen in zwei Spalten nebeneinander. Jeder Eintrag ist eine breite, niedrige Zeile, kein Quadrat: links die [Kachel](../bausteine/kachel.md), rechts daneben, nicht darunter, die Auswahl der Gruppe und „Vom Tisch“.

   ```
   v Für später  3                                                     [Notiz] [Löschen]
   +--------------------------------------+---------+  +--------------------------------------+---------+
   || (S) Figur              (A)(N)(+)    | [Grp v] |  || (O) Ort                (A)(N)(+)    | [Grp v] |
   ||     Sigrun                           | [Vom T.]|  ||     Wachhaus                         | [Vom T.]|
   ||     Hauptfrau der Stadtwache ...     |         |  ||     Ein schmaler Raum ...            |         |
   +--------------------------------------+---------+  +--------------------------------------+---------+
   ```

   **Eine Notiz auf dem Tisch** liegt genauso als breite, niedrige Zeile in der Gruppe, hinter den Einträgen. Links ein Kasten wie eine Kachel ohne Farbstreifen: oben klein „Notiz“ und rechts daneben das Symbol für das Seitenfenster, darunter Name und Beschreibung als Felder, die man an Ort und Stelle schreibt (sie speichern sich kurz nach dem Tippen). Rechts daneben die Auswahl der Gruppe und die drei Handgriffe „Behalten“, „Umwandeln“, „Löschen“.

   ```
   +--------------------------------------+-------------+
   | NOTIZ                           (S)  | [Grp v]     |
   | [Der Wirt lügt ..................]   | [Behalten]  |
   | [Er hat den Schlüssel zur Kammer ]   | [Umwandeln] |
   |                                      | [Löschen]   |
   +--------------------------------------+-------------+
   ```

   - **Behalten:** die Notiz geht vom Tisch und steht ab jetzt dauerhaft links bei den Notizen und im [Notizfenster](notizfenster.md).
   - **Umwandeln:** ein Popup „In was umwandeln?“ mit den Arten Szene, Ort, Figur, Quest, Ereignis, Gegenstand, Wissen, jede in ihrer Farbe. Ein Klick legt einen Eintrag nur dieser Runde mit Name und Beschreibung der Notiz an (eine Szene kommt ans Ende des Fadens im Kapitel der Runde, ihre Beschreibung wird „Was passiert“; ein Gegenstand bekommt die Kategorie „Gegenstand“), legt ihn in dieselbe Gruppe des Tisches und löscht die Notiz.
   - **Löschen:** fragt nach und löscht die Notiz.

   Zwei Spalten gibt es, sobald der Platz in der Gruppe für zwei Zeilen reicht (ungefähr 970 px, das ist ein Fenster ab etwa 1420 px Breite); auf einem schmaleren Desktop steht eine Spalte, damit die Kachel nicht zu schmal wird. Die Mindestbreite einer Zeile (`--placed-min`) steht in `gm.scss`. Die Kachel selbst ist die eine [Kachel](../bausteine/kachel.md) und wird hier nicht verändert.
4. **Schubladen.** Eine Reihe großer Knöpfe mit Zahl: Szenen, Quests, Ereignisse, Figuren, Orte, Gegenstände, Wissen. Genau eine ist offen (Start: Szenen), ein Klick auf die offene schließt sie. Darunter die Kacheln dieser Art nach den Filtern. Die offene Schublade wird je Runde gemerkt.

**Rechts, Charaktere.** Je Charakter der Gruppe ein runder Knopf mit Portrait, schmalem Lebensbalken und der Zahl ungelesener geheimer Nachrichten. Ein Klick öffnet links daneben ein Popup mit der Charakter-Kachel (Lebenspunkte setzen, Bogen, Nachrichten, Gegenstand).

**Kacheln im Master** tragen alle Schalter der Runde: Auge, Stecknadel, Notiz, Erledigt, Auf den Tisch.

**Ein Klick auf eine Kachel** öffnet das [Popup des Eintrags](../bausteine/eintrag-popup.md). Über seinen Reiter „Verbindungen" klickt man sich durch alles, was zusammenhängt; „Alles auf den Tisch" (im Popup, im [Seitenfenster](../bausteine/eintrag-seitenfenster.md) und im Popup einer Szene) legt den Eintrag und seine Verbindungen auf den Tisch. Vorher fragt ein Popup, wohin: in eine **neue Gruppe** (der Name des Eintrags ist vorgeschlagen und lässt sich ändern) oder in eine **bestehende Gruppe** des Tisches. Es gibt keinen Kasten „Dazu gehört" mehr auf der Seite.

**Nur ansehen und benutzen.** Einträge der Welt werden im Master nicht bearbeitet: das Seitenfenster hat bei ihnen weder „Bearbeiten" noch „In dieser Runde ändern", die Kacheln kein „Zur Szene". Wer etwas ändern will, nimmt „Zum Eintrag" und landet in Story, Quests oder Glossar. Die Schalter der Runde (zeigen, anheften, abhaken, annehmen, auf den Tisch, notieren, Lebenspunkte) sind Spielen, nicht Bearbeiten, und bleiben. Der Tisch selbst ist Spielen: Gruppen, Notizen auf dem Tisch und das Umwandeln gehören dazu. Einträge dieser Runde (Marke „Nur diese Runde") haben auch hier „Bearbeiten", weil sie der Runde gehören.

**Filter** (Schalter in der Symbolleiste) wirken auf Schubladen und Suche, nicht auf „Mein Tisch":

| Schalter | Wirkung | Start |
| --- | --- | --- |
| Offen | blendet aus, was erledigt ist | an |
| Geteilt | nur, was die Spieler sehen | aus |
| Angepinnt | nur Einträge mit Stecknadel | aus |
| Kapitel | nur Einträge mit dem Tag des Kapitels der Runde; was die Runde dazugedichtet hat, trägt kein Kapitel und bleibt immer stehen | an |

## Bausteine

- [Runden](runden.md), [Kachel](../bausteine/kachel.md), [Popup eines Eintrags](../bausteine/eintrag-popup.md), [Seitenfenster eines Eintrags](../bausteine/eintrag-seitenfenster.md), [Notiz](../bausteine/notiz.md), [Charakterbogen](../bausteine/charakterbogen.md), [Tags](../bausteine/tags.md)
- Zeichen: Der Kompass (`compass`) steht für das Masterfenster: am Reiter „Master“ und an der Überschrift „Mein Tisch“. Die Fahne gehört nur den Ereignissen, siehe [Farben und Schrift](../grundlagen/farben-und-schrift.md). „Gruppe neu“ trägt die Mappe (`folder`), „Gruppe löschen“ den Mülleimer (`trash`).
- Code: `gm/master/master-table`, `gm/master/table-note` (Notiz auf dem Tisch), die Gruppen und das Umwandeln in `core/round.ts`

## Leisten in dieser Ansicht

- **links, hier:** die Ansichten der Runde, „Master" aktiv.
- **oben:** Runde › Welt › Kapitel, Kapitel-Auswahl, Suche.

Symbolleiste, Abschnitt „zur Ansicht":

| Wort | voller Name | Klick |
| --- | --- | --- |
| Auf Tisch | Auf den Tisch legen | Popup: Suche und Zielgruppe; die Zielgruppe gilt auch für den Knopf an den Kacheln |
| Gruppe neu | Neue Gruppe anlegen | Popup: Name; die neue Gruppe ist das Ziel für den nächsten Eintrag |
| Offen | Erledigtes ausblenden | schaltet |
| Geteilt | Nur für Spieler sichtbare | schaltet |
| Angepinnt | Nur angepinnte | schaltet |
| Kapitel | Nur dieses Kapitel | schaltet |

## Zustände

- **Gruppe löschen:** Popup „Gruppe „X“ löschen? Die Einträge gehen vom Tisch, die Notizen werden gelöscht.“ mit „Abbrechen“ und „Löschen“ (Gefahr-Knopf). Esc und ein Klick daneben brechen ab.
- **Umwandeln ohne Kapitel:** hat die Runde kein Kapitel, ist „Szene“ im Popup ausgegraut, mit dem Satz „Für eine Szene wähle oben ein Kapitel.“
- **Umwandeln geht schief:** kurze Meldung oben; die Notiz bleibt liegen.
- **Tisch leer:** „Der Tisch ist leer. Mit ‚Auf Tisch' legst du Einträge dazu und sortierst sie in eigene Gruppen."
- **Schublade leer:** „Hier ist nichts, was zu den Filtern passt."
- **Suche ohne Treffer:** „Nichts gefunden."

## Tastatur

2 öffnet den Master. „/" springt in die Suche des Rahmens.

## Offen

entfällt
