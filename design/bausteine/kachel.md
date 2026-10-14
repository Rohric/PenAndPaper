# Kachel

## Userstory

Als Nutzer will ich einen Eintrag überall sofort wiedererkennen: gleiche Form, gleiche Farbe, gleiche Schalter an derselben Stelle, egal ob im Glossar, in einer Schublade oder in einem Popup.

## Lösung

Ein Baustein für jeden Eintrag der Welt (Ort, Figur, Quest, Ereignis, Gegenstand, Wissen, Szene, Kapitel), in drei Größen. Der Aufbau ist immer derselbe: Farbstreifen der Art links, Symbol oder Bild, Überzeile und Name, Text, rechts die Schalter.

```
TAG (eine Zeile, in Fließtext, Popups, Verknüpfungen)
  [|Sigrun]   [|Schwarzmarkt]

KACHEL (Wände, Schubladen, Listen, Suche, Zuletzt)
+|-------------------------------------+
|| (S) Figur · Wache          (A)(N)(+) |
||     Sigrun                           |
||     Hauptfrau der Stadtwache ...     |
||     [Kap. 1] [Kap. 2]                |
+|-------------------------------------+

KARTE (geöffnete Szene, Questbrett der Runde)
+|-------------------------------------+
|| (Q) Quest · laufend     (A)(N)(ok)(+)|
||     Der Schwarzmarkt                 |
||     Ziel: Finde den Händler          |
||     Checkliste 1 von 3               |
||     Questgeber [Bettler] Ort [Hafen]  |
+|-------------------------------------+
```

| Größe | Text | Zusatz | Wo |
| --- | --- | --- | --- |
| **Tag** | nur der Name | – | Verknüpfungen, Reiter „Verbindungen" im Popup, Fließtext |
| **Kachel** | Ziel oder Auslöser in einer Zeile, dann bis zwei Zeilen Text | Kapitel als kleine Tags; alle Verbindungen als Tags (Orte, Quests, Ereignisse) | jede [Wand](wand.md), Schubladen, Listen, Suche, „Zuletzt" |
| **Karte** | bis vier Zeilen, oder der ganze Text | wie die Kachel | nur die Ereignisse einer geöffneten Szene und das Questbrett der Runde |

**Alle Tags:** Eine Kachel zeigt alle ihre Tags, keine Kürzung mit „+N". Hat sie mehr als vier Tags, ist sie in einer Wand von Anfang an zwei Spalten breit, damit sie nicht überfüllt aussieht.

**Maße:** Innenabstand `--gap-2` oben und unten, `--gap-3` seitlich; Symbol 28 px; Name 16 px. Die kleinste Breite steht als `--tile-min` in `styles/gm.scss` (ab 1024 px 260 px, ab 1280 px 280 px). Texte werden abgeschnitten, nie die Kachel länger.

**Tags der Verbindungen:** kompakt, damit sie auch in einer schmalen Spalte (etwa am Tisch des Masters) in einer breiten Zeile fließen und sich nicht stapeln. Sie stehen nach ihrem Verhältnis zusammen: ein kleines graues Wort („Questgeber", „Figur", „Ort"), dahinter die Namen als kleine Tags in der Farbe ihrer Art, alles in einer Zeile, die umbricht. Ein Ort zeigt, worin er liegt, die Orte darin, Figuren, Quests und Ereignisse dort, Gegenstände, Wissen und Szenen dort. Ein Ereignis zeigt seinen Ort, seine Figuren, seine Szenen, wohin es führt, Gegenstände und Wissen. Eine Quest zeigt Questgeber, Startgebiet, Szene, Figuren und Gegenstände. Ein Klick auf einen Tag öffnet das Popup dieses Eintrags.

**Überzeile:** die Art, dann die Kategorie („Ort · Stadt", „Kapitel 2 · Erster Akt"); bei Quests in einer Runde der Status (offen, laufend, beendet); bei Orten „in …". Wissen zeigt statt der Art nur seine Kategorie, und die ganze Kachel nimmt den Ton der Kategorie.

**Nur diese Runde:** Ein Eintrag, den der Spielleiter in einer Runde dazugedichtet hat, trägt am Ende seiner Überzeile die Marke „Nur diese Runde“ („Ort · Stadt · Nur diese Runde“, „Nebenquest · laufend · Nur diese Runde“). Sie steht überall an dieser einen Stelle: in der Überzeile von Kachel und Karte, im Kopf von Popup und Seitenfenster, in der Überzeile der Lese-Ansicht und der Ansicht einer Szene. Wo es keine Überzeile gibt, im Faden der Szenen, steht sie als kleiner Chip hinter dem Namen, wie „gespielt“. Wird die Überzeile in einer schmalen Kachel abgeschnitten, steht sie beim Drüberfahren ganz da. Ein Tag zeigt nur den Namen und keine Marke. Ein Eintrag der Welt, den die Runde nur geändert hat („In dieser Runde ändern“), trägt keine Marke; er zeigt einfach den Text der Runde. Beim Schreiben der Welt gibt es die Marke nicht, weil die Welt die Einträge der Runden nie zeigt.

**Text:** der Anfang der Beschreibung; bei Figuren der Beruf; bei Szenen der Vorlesetext; bei Kapiteln der Anfang des Textes und darunter klein „3 Szenen · 2 Quests · 4 Ereignisse".

**Schalter rechts** (nur in einer Runde, in dieser Reihenfolge): [Auge](auge.md), Stecknadel, Notiz, Erledigt (Szene, Quest, Ereignis), Auf den Tisch (im Master). Außerhalb einer Runde hat eine Kachel keine Knöpfe; Handgriffe stehen im [Popup](eintrag-popup.md), im [Seitenfenster](eintrag-seitenfenster.md) oder in der [Symbolleiste](symbolleiste.md).

**Zur Szene:** In der Story legt der Chip „Zur Szene“ einen Eintrag in die offene Szene, aber nur in eine Szene dieser Runde. Eine Szene der Welt bekommt in der Runde keine neuen Verknüpfungen, weil das die Welt ändern würde.

**Klick auf den Namen:** öffnet das [Popup des Eintrags](eintrag-popup.md), bei jeder Art, auch bei Szenen und Kapiteln. Ein Tag tut dasselbe. In einer Runde öffnet eine Szene in der Story.

**Lose Kachel:** Was kein Eintrag der Welt ist, aber wie einer aussieht (ein Gegenstand, den nur ein Charakter der Gruppe trägt), ist dieselbe Kachel mit „Getragen von …" in der Überzeile. Ein Klick öffnet den Bogen des Charakters.

**Erledigt:** der Name ist durchgestrichen und blass.

Die **Charakter-Kachel** (Spielercharakter in der Gruppe) ist ein eigener Baustein im selben Rahmen: Portrait, Name, Lebensbalken, Zahl ungelesener Nachrichten.

Entschieden: Karten nur dort, wo ein Eintrag gelesen wird, während er gespielt wird. Im Glossar und im Kapitel sind Quests und Ereignisse Kacheln wie alles andere; sie waren als Karten zu groß.

## Bausteine

- [Farben und Schrift](../grundlagen/farben-und-schrift.md): Farbe der Art
- [Auge](auge.md), [Tags](tags.md), [Popup eines Eintrags](eintrag-popup.md), [Wand](wand.md)
- Code: `components/entry/entry-card` (Inhalt aus `entry-face`); Charakter: `components/character/character-tile`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **Eintrag gelöscht:** die Kachel wird nicht gezeichnet.
- **kein Text:** die Kachel bleibt zweizeilig.

## Tastatur

Der Name ist ein Knopf und mit Tab erreichbar; Enter öffnet das Popup. Die Schalter folgen in der Reihenfolge von links nach rechts.

## Offen

entfällt
