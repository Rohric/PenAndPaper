# Runden

## Userstory

Als Spielleiter will ich eine Runde mit einer Welt und den Charakteren meiner Spieler starten, laufende Runden wiederfinden und meinen Spielern den Weg in die App zeigen.

## Lösung

**Liste der Runden:** Kacheln mit Name, Welt, Datum und den Charakteren; beendete Runden stehen blass darunter. Ein Klick öffnet das Cockpit im [Storyfenster](storyfenster.md).

**Neue Runde:** Dialog mit Name, Datum, Welt und den freien Charakteren. Ein Charakter spielt nur in einer laufenden Runde. Einträge mit „Von Anfang an für Spieler sichtbar" sind in der neuen Runde sofort aufgedeckt.

**Das Cockpit** ist die Runde selbst. Es hat sechs Ansichten als Reiter der Leiste links: [Story](storyfenster.md), [Master](masterfenster.md), [Quests](questfenster.md), Glossar ([Glossarfenster](glossarfenster.md)), [Notizen](notizfenster.md), [Spieleransicht](spieleransicht.md). Läuft ein Kampf, kommt [Kampf](kampffenster.md) dazu.

**Symbole, die es in jeder Ansicht der Runde gibt** (Abschnitt „immer" der Symbolleiste):

| Wort | voller Name | Klick |
| --- | --- | --- |
| Gruppe | Die Gruppe | Popup: die Charakter-Kacheln, „Neuer Abend", „Gruppe bearbeiten". Zahl: ungelesene geheime Nachrichten |
| Würfeln | Würfeln | Seitenfenster mit dem [Würfelfeld](../bausteine/wuerfel.md) |
| Chat | Chat der Gruppe | Seitenfenster. Zahl: neu |
| Kampf | Kampf | öffnet den laufenden Kampf oder startet einen mit der Gruppe |
| Archiv | Archiv | Seitenfenster: erledigte Ereignisse und beendete Quests, mit „Zurückholen" |
| Kapitel | Kapitel abschließen | Seitenfenster: Bonuspunkte je Charakter |

Rechts in der Symbolleiste: Stecknadeln je Art mit Zahl (Popup mit [Tags](../bausteine/tags.md)) und „Wurf" (letzter Wurf, Popup mit „Alle Würfe").

**QR-Code für Spieler** liegt in der Liste der Runden als Symbol.

## Bausteine

- [Rahmen](rahmen.md), [Symbolleiste](../bausteine/symbolleiste.md), [Charakterbogen](../bausteine/charakterbogen.md), [Würfel](../bausteine/wuerfel.md), [Chat](../bausteine/chat.md)
- Code: `gm/sessions/` (`session-list`, `session-members`), `gm/cockpit/` (`session-cockpit`, `session-group`, `session-archive`, `chapter-close-form`, `item-gift-form`), `core/session-store`

## Leisten in dieser Ansicht

- **links, hier:** in der Liste nichts; in einer Runde Story, Master, Quests, Glossar, Notizen, Spieleransicht (und Kampf).
- **oben:** in der Liste „Runden"; in einer Runde Runden › Name der Runde › Welt › Kapitel, am Ende die Szene (Story) oder „Kampf"; das Auswahlfeld für das Kapitel, Suche.

Symbolleiste der Liste:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neue Runde | Dialog |
| QR-Code | QR-Code für Spieler | Popup |

Die Hilfe zur Seite öffnet das Fragezeichen unten in der linken Leiste.

## Zustände

- **keine Runde:** „Noch keine Runde. Starte mit ‚Neu' deine erste."
- **kein freier Charakter:** im Dialog der Satz „Alle Charaktere spielen schon in einem Abenteuer."

## Tastatur

1 bis 6 für die Ansichten der Runde.

## Offen

entfällt
