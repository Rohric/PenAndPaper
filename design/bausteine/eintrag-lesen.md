# Eintrag lesen

## Userstory

Als Spielleiter will ich einen Eintrag in immer derselben Reihenfolge lesen und dabei sehen, welche Teile die Spieler kennen.

## Lösung

Die Lese-Ansicht ist für alle Arten gleich aufgebaut: Ort, Figur, Quest, Ereignis, Gegenstand, Wissen, Szene und Kapitel. Was eine Art nicht hat, fehlt.

1. **Kopf:** Symbol oder Bild, Überzeile in der Farbe der Art (die Art und die Kategorie, „Ort · Stadt"; Wissen zeigt nur die Kategorie in ihrem Ton; ein Eintrag einer Runde endet mit „Nur diese Runde"), Name, Unterzeile (Beruf), Kapitel als [Tags](tags.md).
2. **Textblöcke** mit Überschrift: Beschreibung; bei Quests Ziel; bei Ereignissen Auslöser und „Was passiert"; bei Figuren der Steckbrief; bei Szenen und Kapiteln „Vorlesen" (abgesetzt wie zum Vorlesen) und „Was passiert" bzw. „Worum es geht".
3. **Wissen für Spieler:** Stück für Stück, jedes mit eigenem [Auge](auge.md).
4. **Wissen nur für dich:** abgesetzt, mit Schloss.
5. **Notiz (nur für dich):** die Notiz des Spielleiters am Eintrag, abgesetzt wie Wissen nur für dich, mit Schloss. Sie steht auch in jeder Runde da.
6. **Dialoge** und **Beispielsätze.**
7. **Listen:** Checkliste (in einer Runde mit Auge und Haken je Punkt), Fähigkeiten, Inventar.
8. **Verknüpfungen:** alle verknüpften Einträge als [Tags](tags.md) in beschrifteten Zeilen (bei Questgeber und Startgebiet in einer Runde mit Auge). Bei Kapiteln sind das die Szenen und alles, was den Tag des Kapitels trägt.
9. **Bilder.**

**Klappen:** Jeder Abschnitt ab 2 lässt sich am Titel [klappen](klappen.md), mit der Zahl, was drin ist. Die Verknüpfungen klappen als ein Abschnitt. Das Gerät merkt sich je Welt, was zu ist, für alle Einträge gleich.

In einer Runde stehen die Texte so da, wie die Runde sie hat: Was „In dieser Runde ändern“ geändert hat, steht an Stelle des Textes der Welt.

In einer Runde steht vor jedem Teil, den Spieler sehen können, ein [Auge](auge.md): am Namen, an Beschreibung, Ziel, Questgeber, Startgebiet, Auslöser, „Was passiert", an jedem Punkt der Checkliste und jedem Stück Wissen. Das Auge steht vor dem Titel und klappt nicht mit.

Dieselbe Lese-Ansicht steht im [Seitenfenster](eintrag-seitenfenster.md), auf der ganzen Seite eines Eintrags im Glossar und im Überblick eines Kapitels. Eine Szene liest man auf der Seite ihres Kapitels in ihrer eigenen Ansicht (mit den Ereignissen als Karten), im Seitenfenster in dieser.

Einen Knopf „Bearbeiten" hat die Lese-Ansicht nicht; er steht im Fuß des Fensters oder in der [Symbolleiste](symbolleiste.md).

Entschieden: Die Verknüpfungen bleiben in der Lese-Ansicht, weil die ganze Seite eines Eintrags keinen Reiter „Verbindungen" hat und weil Questgeber und Startgebiet in der Runde ein Auge brauchen.

## Bausteine

- [Auge](auge.md), [Tags](tags.md), [Klappen](klappen.md)
- Code: `components/entry/entry-view`, `entry-views`

## Leisten in dieser Ansicht

entfällt

## Zustände

- **leer:** „Hier steht noch nichts."

## Tastatur

entfällt

## Offen

entfällt
