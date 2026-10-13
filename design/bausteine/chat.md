# Chat

## Userstory

Als Spieler will ich mit der Gruppe schreiben und dem Spielleiter etwas sagen können, das die anderen nicht lesen.

## Lösung

Zwei Kanäle, beide als Verlauf mit Blasen (eigene rechts, fremde links, Name über der ersten Blase einer Folge) und einem Feld zum Schreiben unten.

- **Gruppe:** alle in der Runde lesen mit, auch der Spielleiter.
- **Geheim:** zwischen dem Spielleiter und einem Charakter. Der Spielleiter hat je Charakter einen Verlauf.

Ungelesenes zeigt eine Zahl am Symbol. Solange der Kanal offen ist, gilt alles darin als gelesen.

## Bausteine

- Code: `components/play/` (`chat-thread`, `session-thread`)
- [Chat der Spieler](../spieler/chat.md); beim Spielleiter das Symbol „Chat" und die Charakter-Kachel

## Leisten in dieser Ansicht

Spieler: die Kanäle „Gruppe" und „Spielleiter" als Symbole der oberen Reihe.

## Zustände

- **leer:** „Noch keine Nachricht. Schreib die erste."

## Tastatur

Enter sendet, Umschalt + Enter macht eine neue Zeile.

## Offen

entfällt
