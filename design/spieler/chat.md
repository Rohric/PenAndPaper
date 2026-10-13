# Chat der Spieler

## Userstory

Als Spieler will ich während der Runde mit der Gruppe schreiben und dem Spielleiter heimlich etwas sagen können.

## Lösung

Die Seite zeigt einen von zwei Kanälen, siehe [Chat](../bausteine/chat.md):

- **Gruppe:** „Alle in der Runde lesen mit, auch der Spielleiter."
- **Spielleiter:** „Nur du und der Spielleiter lesen das." Der Kanal gehört zum eigenen Charakter.

Der Verlauf füllt die Seite, das Feld zum Schreiben steht unten über der Symbolleiste.

## Bausteine

- [Runde](runde.md), [Chat](../bausteine/chat.md)
- Code: `components/play/` (`chat-thread`, `session-thread`)

## Leisten in dieser Ansicht

Obere Reihe:

| Wort | Klick |
| --- | --- |
| Gruppe | zeigt den Chat der Gruppe. Zahl: ungelesen |
| Spielleiter | zeigt die geheimen Nachrichten. Zahl: ungelesen |
| Hilfe | Tutorial „Meine Runden" an der Stelle „Chat" |

## Zustände

- **leer:** „Noch keine Nachricht. Schreib die erste."
- **kein Charakter in der Runde:** „Ohne Charakter in der Runde gibt es keine geheimen Nachrichten."

## Tastatur

Enter sendet.

## Offen

entfällt
