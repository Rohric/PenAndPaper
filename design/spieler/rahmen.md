# Rahmen der Spieler

## Userstory

Als Spieler will ich die App mit einer Hand am Handy bedienen: oben klebt nichts, unten liegt immer dieselbe Leiste, und das Menü hole ich nur, wenn ich es brauche.

## Lösung

Gebaut für das Handy ab 320 px. Am großen Bildschirm bleibt dieselbe Spalte 560 px breit und steht mittig.

```
+--------------------------------+
| Pilzwahn · Kapitel 2           |  Überzeile und Titel, scrollen mit
| Runde am Dienstag              |
|                                |
|        ... Inhalt ...          |
|                                |
+--------------------------------+
| Bogen  Würfeln  Bearb.  Blitz ?|  obere Reihe: zur Seite
| Menü Runde Charak. Quests Chat |  Hauptreihe: immer
+--------------------------------+
```

- **Oben** nur Überzeile und Titel der Seite als Anfang des Inhalts ([Kopfleiste](../bausteine/kopfleiste.md)). Nichts klebt oben.
- **Unten** die [Symbolleiste](../bausteine/symbolleiste.md) mit zwei Reihen. Sie bleibt stehen.
- **Menü:** das Symbol ganz links in der Hauptreihe fährt das Menü von links aus ([Leiste links](../bausteine/leiste-links.md)).
- [Fenster](../bausteine/fenster.md): Popups kommen von unten über der Leiste, das Seitenfenster füllt den ganzen Schirm.

**Hauptreihe:**

| Ort | Symbole |
| --- | --- |
| außerhalb einer Runde | Menü, Charaktere, Runden, Regeln |
| in einer Runde | Menü, Runde, Charakter, Quests, Chat; Kampf, solange einer läuft |

**Menü:** Gruppe „immer" (Charaktere, Runden, Regeln), Fuß (Hilfe zur offenen Seite, Name des Kontos, „Zum Spielleiter" wenn freigeschaltet, Abmelden). Die Seiten einer Runde stehen nie im Menü: was zur Runde gehört (Glossar, Notizen, Gruppe), steht in der Runde selbst, in der oberen Reihe der Symbolleiste.

Braucht eine Seite den unteren Rand selbst (der Charakter-Editor), deckt sie die Leiste ab und zeigt ihre eigene.

## Bausteine

- [Symbolleiste](../bausteine/symbolleiste.md), [Leiste links](../bausteine/leiste-links.md), [Kopfleiste](../bausteine/kopfleiste.md), [Fenster](../bausteine/fenster.md), [Breiten](../grundlagen/breiten.md)
- Code: `global/frame/player-frame`, `global/tool-bar/player-tool-bar`, `global/side-rail/`

## Leisten in dieser Ansicht

Diese Datei beschreibt die Leisten selbst. Was eine Seite in die obere Reihe legt, steht in ihrer Datei.

## Zustände

- **Verbindung unterbrochen:** ein ruhiger Hinweis oben im Inhalt, der letzte Stand bleibt stehen.

## Tastatur

Esc schließt Menü und Fenster.

## Offen

entfällt
