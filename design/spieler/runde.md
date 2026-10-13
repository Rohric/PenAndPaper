# Runde

## Userstory

Als Spieler will ich beim Blick aufs Handy sofort sehen, wie es meinem Charakter geht und was seit meinem letzten Blick neu ist.

## Lösung

Die Runde hat fünf Seiten in der Hauptreihe (Runde, Charakter, Quests, Chat, und Kampf, solange einer läuft) und drei Seiten, die zur Runde gehören (Glossar, Notizen, Gruppe). Die drei stehen als Schalter in der oberen Reihe, solange „Runde" offen ist; „Runde" in der Hauptreihe bleibt dabei gedrückt und führt zurück zur Übersicht. Diese Datei beschreibt die Seite **Runde**.

```
+--------------------------------+
| Pilzwahn · Kapitel 2           |
| Runde am Dienstag              |
| +----------------------------+ |
| | (M) Mara · Holzfällerin    | |
| | Lebenspunkte 82 von 100    | |
| | [=========---]             | |
| | [Handeln 2/2] [Wissen 1/1] | |
| +----------------------------+ |
| Neu seit deinem letzten Blick  |
| [Neue Quest: Schwarzmarkt]     |
| [Neuer Gegenstand: Dietrich]   |
+--------------------------------+
```

- **Mein Charakter:** Portrait, Name, Beruf, Lebensbalken, Geistesblitzpunkte je Begabung.
- **Neu seit deinem letzten Blick:** neue Quests, neue Einträge im Glossar, erhaltene Gegenstände, geänderte Lebenspunkte, Notizen, Nachrichten. Ein Tipp führt dorthin.
- Die letzten Würfe stehen nicht auf der Seite, sondern als Symbol „Würfe".
- Kommt etwas Neues dazu, während man spielt, erscheint oben eine kurze [Meldung](../bausteine/meldung.md).

## Bausteine

- [Rahmen](rahmen.md), [Meldung](../bausteine/meldung.md), [Würfel](../bausteine/wuerfel.md)
- die anderen Seiten: [Würfeln](wuerfeln.md), [Quests](quests.md), [Chat](chat.md), [Kampf](kampf.md), [Glossar](glossar.md), [Notizen](notizen.md), [Gruppe](gruppe.md)
- Code: `player/session/` (`player-session`, `player-feed`)

## Leisten in dieser Ansicht

- **oben:** Welt und Kapitel, Name der Runde.
- **Hauptreihe:** Menü, Runde (Zahl: Neues), Charakter, Quests (Zahl: neue), Chat (Zahl: ungelesen), Kampf (Punkt, wenn man etwas tun muss).
- **Obere Reihe (Seite Runde):** Gesehen, Würfe, Glossar, Notizen, Gruppe. Auf Glossar, Notizen und Gruppe bleiben die drei Schalter stehen. Am Ende jeder Reihe steht „Hilfe".

Obere Reihe der Seite Runde:

| Wort | voller Name | Klick |
| --- | --- | --- |
| Gesehen | Alles gesehen | räumt die Liste „Neu" auf; ausgegraut, wenn nichts neu ist |
| Würfe | Letzte Würfe | Popup mit den letzten Würfen der Gruppe |
| Glossar, Notizen, Gruppe | die Seiten der Runde | wechselt zur Seite; „Runde" in der Hauptreihe führt zurück |
| Hilfe | Hilfe zur Runde | Tutorial |

## Zustände

- **nichts Neues:** „Nichts Neues. Neue Quests, Gegenstände, Nachrichten und Notizen erscheinen hier."
- **kein Charakter in der Runde:** „Keiner deiner Charaktere spielt in dieser Runde."
- **Verbindung unterbrochen:** ruhiger Hinweis, der letzte Stand bleibt.

## Tastatur

entfällt

## Offen

entfällt
