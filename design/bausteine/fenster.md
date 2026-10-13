# Fenster

## Userstory

Als Nutzer will ich, dass sich alles, was sich öffnet, gleich anfühlt: derselbe Kopf, derselbe Knopf zum Schließen, dieselben Pfeile. Ich will kurz nachsehen können, ohne die Seite zu verlieren, und erst dann tiefer gehen, wenn ich es brauche.

## Lösung

Es gibt drei Fenster. Sie teilen Kopf, Fuß und Bedienung; nur der Inhalt wechselt.

```
+----------------------------------------------+
| [<] [>]  Quest · Der Schwarzmarkt        [x] |   Kopf
| [Lesen] [Verbindungen] [Runde] [Notiz]       |   Reiter (nur wenn nötig)
+----------------------------------------------+
|                                              |
|  Inhalt des gewählten Reiters                |   Inhalt, scrollt für sich
|                                              |
+----------------------------------------------+
|                      [Zum Eintrag] [Fertig]  |   Fuß (nur wenn nötig)
+----------------------------------------------+
```

| Fenster | Wofür | Wo | Größe |
| --- | --- | --- | --- |
| **Popup** | kurze Information, kurze Handgriffe | immer mittig im Bildschirm; die Seite dahinter ist leicht abgedunkelt und scrollt nicht | Spielleiter: 360 bis 880 px breit, höchstens 70 % der Höhe. Spieler: fast volle Breite, höchstens 80 % der Höhe |
| **Seitenfenster** | lesen und bearbeiten | rechts über der Seite, die Seite bleibt sichtbar | Spielleiter: 520 px (ab 1600 px: 600 px), breit: 720 px. Spieler: ganzer Schirm |
| **Dialog** | unterbricht: Tutorial, etwas Neues anlegen | Mitte, die Seite ist abgedunkelt | Spielleiter: bis 860 px. Spieler: ganzer Schirm |

### Die Fensterregel

1. Jeder Klick auf ein Symbol, eine Kachel oder einen Link öffnet zuerst ein **Popup**.
2. Vom Popup geht es ins **Seitenfenster** (lesen, bearbeiten) oder direkt **zum Eintrag** (die Seite, auf der er zu Hause ist).
3. Vom Seitenfenster geht es nur noch **zum Eintrag**. Es hat alles, was das Popup hat, und mehr.
4. Es ist immer nur ein Popup offen. Wer vom Popup ins Seitenfenster oder zum Eintrag geht, schließt damit das Popup. Wer vom Seitenfenster zum Eintrag geht, schließt damit das Seitenfenster.
5. Nichts wird als Kasten in die Seite geschoben.

Ausnahmen, die direkt etwas tun und kein Fenster öffnen: Schalter (Auge, Stecknadel, Erledigt), Reiter, die Pfeile selbst.

### Der Kopf

- **Pfeile** gehen im Verlauf dieses Fensters zurück und vor. Folgt man im Fenster einer Verknüpfung, wechselt der Inhalt im selben Fenster. Ohne Verlauf sind die Pfeile ausgegraut.
- **Art und Titel:** die Art in der Farbe der Art, daneben der Name.
- **Reiter:** eine kleine Zeile, nur wenn das Fenster mehrere Inhalte hat.
- **Schließen** steht immer rechts oben.

### Der Fuß

Knöpfe rechts, der wichtigste ganz rechts. Wege zu anderen Fenstern („Seitenfenster", „Zum Eintrag") stehen links davon.

## Bausteine

- Code: `components/window/` mit `window-head`, `popup`, `side-window`, `dialog` und dem Verlauf `window-history`.
- [Popup eines Eintrags](eintrag-popup.md) und [Seitenfenster eines Eintrags](eintrag-seitenfenster.md) sind die häufigsten Inhalte.
- [Symbolleiste](symbolleiste.md): ihre Symbole öffnen Popups.
- [Breiten](../grundlagen/breiten.md), [Farben und Schrift](../grundlagen/farben-und-schrift.md) (Ebenen).

## Leisten in dieser Ansicht

Popup und Dialog decken die Leisten des Rahmens mit ab: solange eines offen ist, ist die Seite dahinter abgedunkelt, scrollt nicht und nimmt keine Klicks an. Unter dem Seitenfenster bleibt die Seite sichtbar.

## Zustände

- **leer:** ein Satz im Inhalt, was hier stehen wird.
- **lädt:** der Kopf steht schon, der Inhalt folgt.
- **Fehler:** eine [Meldung](meldung.md) oben; das Fenster bleibt offen.
- **Eintrag gibt es nicht mehr:** „Diesen Eintrag gibt es nicht mehr." im Inhalt.

## Tastatur

- Esc schließt das oberste Fenster (erst Popup, dann Seitenfenster).
- Alt + Pfeil links und rechts: zurück und vor im Verlauf.
- Ein Klick neben ein Popup (auf die abgedunkelte Seite) schließt es. Ein Klick neben das Seitenfenster schließt es nicht, wenn darin ungespeicherte Änderungen stehen.

## Offen

entfällt
