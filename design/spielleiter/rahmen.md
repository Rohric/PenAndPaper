# Rahmen des Spielleiters

## Userstory

Als Spielleiter will ich auf jeder Seite denselben Rahmen: links die Reiter, oben nur der Ort und die Links der Ansicht, unten die Symbolleiste. So finde ich alles an derselben Stelle, egal ob ich schreibe oder leite.

## Lösung

Gebaut für den Desktop ab 1024 px.

```
+----+--------------------------------------------------------------+
|[W] | Pilzwahn › Kapitel 2          [Szenen][Quests] …    [Suche]  |  Kopfleiste
|[R] +--------------------------------------------------------------+
|[F] |                                                              |
|----|                 Inhalt (höchstens 1680 px, mittig)           |
|[St]|                                                              |
|[Ma]|                                                              |
|[Qu]|                                                              |
|----+--------------------------------------------------------------+
|[?] | Symbolleiste: immer | zur Ansicht | rechts                   |  Symbolleiste
|[>>]|                                                              |
+----+--------------------------------------------------------------+
 Leiste links: 56 px, ausgefahren 220 px
```

- **Links** die [Leiste links](../bausteine/leiste-links.md): Gruppe „immer" mit Welten, Runden, Figuren; Gruppe „hier" mit den Reitern des Orts; Fuß mit Hilfe und Ausfahren.
- **Oben** die [Kopfleiste](../bausteine/kopfleiste.md): Ort als Krümel, Links der Ansicht, Suche. Sie bleibt stehen.
- **Unten** die [Symbolleiste](../bausteine/symbolleiste.md), auf jeder Seite. Sie bleibt stehen.
- **Inhalt** scrollt zwischen Kopf und Symbolleiste. Er wird nicht breiter als 1680 px und steht dann mittig.
- [Fenster](../bausteine/fenster.md) liegen über dem Inhalt: Popups über ihrem Symbol, das Seitenfenster rechts, der Dialog in der Mitte.

Jede Seite meldet beim Rahmen an: ihren Ort (Krümel), ihre Links der Ansicht, ihre Reiter für die Gruppe „hier" und ihre Symbole. Verlässt man die Seite, verschwinden sie.

## Bausteine

- [Leiste links](../bausteine/leiste-links.md), [Kopfleiste](../bausteine/kopfleiste.md), [Symbolleiste](../bausteine/symbolleiste.md), [Fenster](../bausteine/fenster.md)
- [Breiten](../grundlagen/breiten.md)
- Code: `global/frame/` (`frame`, `gm-frame`, `nav.service`), `global/side-rail/`, `global/top-bar/`, `global/tool-bar/`

## Leisten in dieser Ansicht

Diese Datei beschreibt die Leisten selbst. Was eine Seite hineinlegt, steht in ihrer Datei.

## Zustände

- **nicht angemeldet:** kein Rahmen, die [Anmeldung](../spieler/anmeldung.md).
- **nicht als Spielleiter freigeschaltet:** der Bereich ist gesperrt, man landet bei den Spielern.

## Tastatur

- 1 bis 9: Reiter der Gruppe „hier".
- „/": Suche.
- Esc: oberstes Fenster schließen.

## Offen

entfällt
