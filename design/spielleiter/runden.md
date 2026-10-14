# Runden

## Userstory

Als Spielleiter will ich eine Runde mit einer Welt und den Charakteren meiner Spieler starten, laufende Runden wiederfinden und meinen Spielern den Weg in die App zeigen.

## Lösung

**Liste der Runden:** Kacheln mit Name, Welt, Datum und den Charakteren; beendete Runden stehen blass darunter. Ein Klick öffnet das Cockpit im [Storyfenster](storyfenster.md).

**Neue Runde:** Dialog mit Name, Datum, Welt und den freien Charakteren. Ein Charakter spielt nur in einer laufenden Runde. Einträge mit „Von Anfang an für Spieler sichtbar" sind in der neuen Runde sofort aufgedeckt.

**Das Cockpit** ist die Runde selbst. Es hat sechs Ansichten als Reiter der Leiste links: [Story](storyfenster.md), [Master](masterfenster.md), [Quests](questfenster.md), Glossar ([Glossarfenster](glossarfenster.md)), [Notizen](notizfenster.md), [Spieleransicht](spieleransicht.md). Läuft ein Kampf, kommt [Kampf](kampffenster.md) dazu.

**Die Runde dichtet dazu, die Welt bleibt.** Die Welt ist vorgegeben (Grundsatz 9 der [Regeln](../grundlagen/regeln.md)). Ergibt sich beim Spielen etwas Neues, legt der Spielleiter es in der Runde an: „Neu“ in Story, Quests und Glossar, „neu anlegen“ in der Filterleiste, in der Suche und in jedem Verknüpfungsfeld, „Umwandeln“ einer Notiz auf dem Tisch. Ein solcher Eintrag gehört nur dieser Runde, trägt die Marke „Nur diese Runde“ und hat im Popup und im Seitenfenster „Bearbeiten“. Einen Eintrag der Welt ändert der Spielleiter nur für die Runde, im Seitenfenster unter „In dieser Runde ändern“ (siehe [Seitenfenster eines Eintrags](../bausteine/eintrag-seitenfenster.md)); die Runde zeigt ihn dann überall so. Die Welt und andere Runden sehen nichts davon.

Das Cockpit lädt die Welt und die Einträge dieser Runde einmal beim Öffnen und wieder nach eigenen Änderungen des Spielleiters, nie in der Abfrage alle paar Sekunden (siehe [Schnelligkeit](../grundlagen/schnelligkeit.md)).

**Symbole, die es in jeder Ansicht der Runde gibt** (Abschnitt „immer" der Symbolleiste):

| Wort | voller Name | Klick |
| --- | --- | --- |
| Gruppe | Die Gruppe | Popup: die Charakter-Kacheln mit Plus und Minus für das Leben und, wenn die Welt eine hat, die zweite Leiste; „Gruppe bearbeiten". Zahl: ungelesene geheime Nachrichten |
| Würfeln | Würfeln | Seitenfenster mit dem [Würfelfeld](../bausteine/wuerfel.md) |
| Chat | Chat der Gruppe | Seitenfenster. Zahl: neu |
| Kampf | Kampf | öffnet den laufenden Kampf oder startet einen mit der Gruppe, auch mit nur einem Charakter |
| Archiv | Archiv | Seitenfenster: erledigte Ereignisse und beendete Quests, mit „Zurückholen" |
| LvUp | Bonuspunkte und Geistesblitz | Popup: Bonuspunkte einzeln oder für alle, Geistesblitz für einzelne oder die ganze Gruppe auffüllen (siehe [LvUp](lvup.md)) |

Rechts in der Symbolleiste: Stecknadeln je Art mit Zahl (Popup mit [Tags](../bausteine/tags.md)) und „Wurf" (letzter Wurf, Popup mit „Alle Würfe").

**QR-Code für Spieler** liegt in der Liste der Runden als Symbol.

## Bausteine

- [Rahmen](rahmen.md), [Symbolleiste](../bausteine/symbolleiste.md), [Charakterbogen](../bausteine/charakterbogen.md), [Würfel](../bausteine/wuerfel.md), [Chat](../bausteine/chat.md)
- Code: `gm/sessions/` (`session-list`, `session-members`), `gm/cockpit/` (`session-cockpit`, `session-group`, `session-archive`, `level-up-form`, `item-gift-form`), `core/session-store`; die Einträge der Runde lädt `core/world-store` mit `openRound`, die Regeln der Änderungen und des Tisches stehen in `core/round.ts`

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
