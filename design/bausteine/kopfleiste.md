# Kopfleiste

## Userstory

Als Nutzer will ich oben immer dasselbe Bild: wo ich bin und welche Links zu dieser Ansicht gehören. Das Hauptmenü gehört nicht dorthin.

## Lösung

```
Spielleiter (52 px hoch)
| Pilzwahn › Kapitel 2 › Im Wachhaus   [Szenen][Quests][Ereignisse][Überblick]   [Suche] |

Spieler (scrollt mit der Seite)
| Pilzwahn · Kapitel 2
| Runde am Dienstag
```

**Spielleiter**, von links nach rechts:
1. **Ort als Krümel:** Welt › Kapitel › Szene oder Runde › Welt › Kapitel. Jeder Krümel außer dem letzten ist ein Link.
2. **Links der Ansicht:** Reiter, die nur zu dieser Ansicht gehören (zum Beispiel die vier Reiter eines Kapitels) und ihre wenigen eigenen Auswahlfelder (Kapitel der Runde).
3. **Suche** über die ganze Welt, rechts: Orte, Figuren, Quests, Ereignisse, Gegenstände, Wissen, Szenen und Kapitel, nach Name und Text. Ein Treffer öffnet das [Popup des Eintrags](eintrag-popup.md). Heißt kein Eintrag genau so wie der Text, bietet die Liste unten „„Text" neu anlegen als …" für jede Art des Glossars an; das legt an und öffnet das Seitenfenster im Formular. In einer Runde wird nichts angelegt.

Die Kopfleiste bleibt beim Spielleiter oben stehen.

**Spieler:** nur eine kleine Überzeile und der Titel der Seite, als normaler Anfang der Seite. Nichts klebt. Links der Ansicht stehen in der [Symbolleiste](symbolleiste.md).

Was nicht in die Kopfleiste gehört: Hauptmenü, Konto, Hilfe (alles in der [Leiste links](leiste-links.md)), Werkzeuge (in der Symbolleiste).

## Bausteine

- Code: `global/top-bar/`, Ort und Links meldet die Seite über `global/frame/nav.service` an
- [Leiste links](leiste-links.md), [Symbolleiste](symbolleiste.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

- **Seite ohne eigenen Ort:** nur der Name der Seite („Welten").

## Tastatur

„/" setzt beim Spielleiter den Fokus in die Suche.

## Offen

entfällt
