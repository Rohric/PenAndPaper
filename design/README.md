# Design-Regeln

Hier steht, wie die Oberfläche von PenAndPaper aussieht und sich verhält. Jede Seite und jeder Baustein hat eine Datei. Der Code folgt diesen Dateien, nicht umgekehrt.

## Arbeitsweise

1. Vor jeder Arbeit am Frontend die Datei der betroffenen Seite lesen und die Dateien der Bausteine, auf die sie verweist.
2. Kommt etwas Neues dazu oder soll sich etwas ändern: zuerst die Design-Datei anpassen, dann bauen.
3. Eine neue Seite oder ein neuer Baustein bekommt eine neue Datei nach der Vorlage unten und einen Eintrag in der Liste.
4. Was noch nicht entschieden ist, steht unter „Offen" und wird mit Emil geklärt, bevor es gebaut wird.

## Vorlage

Jede Datei hat dieselben sieben Überschriften in derselben Reihenfolge. Trifft eine nicht zu, steht dort „entfällt".

```markdown
# Name

## Userstory
Als … will ich …, damit …

## Lösung
Skizze, dann der Aufbau von oben nach unten.

## Bausteine
Verweise auf die Bausteine und Seiten, auf denen diese Datei aufbaut.

## Leisten in dieser Ansicht
Was links, oben und unten steht.

## Zustände
Leer, lädt, Fehler, nichts gefunden.

## Tastatur
Tasten, die hier etwas tun.

## Offen
Was noch nicht entschieden ist.
```

## Die Dateien

### Grundlagen

- [Regeln](grundlagen/regeln.md): die festen Grundsätze, die für alles gelten
- [Ordnerbaum](grundlagen/ordnerbaum.md): wo im Code was liegt
- [Farben und Schrift](grundlagen/farben-und-schrift.md)
- [Breiten](grundlagen/breiten.md): Desktop und Handy
- [Schnelligkeit](grundlagen/schnelligkeit.md): Abfragen, Zeichnen, Ausliefern

### Bausteine

- [Fenster](bausteine/fenster.md): Popup, Seitenfenster, Dialog
- [Popup eines Eintrags](bausteine/eintrag-popup.md)
- [Seitenfenster eines Eintrags](bausteine/eintrag-seitenfenster.md)
- [Kachel](bausteine/kachel.md)
- [Eintrag lesen](bausteine/eintrag-lesen.md)
- [Auge](bausteine/auge.md)
- [Tags](bausteine/tags.md)
- [Symbolleiste](bausteine/symbolleiste.md)
- [Leiste links](bausteine/leiste-links.md)
- [Kopfleiste](bausteine/kopfleiste.md)
- [Formular](bausteine/formular.md)
- [Meldung](bausteine/meldung.md)
- [Charakterbogen](bausteine/charakterbogen.md)
- [Würfel](bausteine/wuerfel.md)
- [Notiz](bausteine/notiz.md)
- [Chat](bausteine/chat.md)

### Spielleiter (Desktop)

- [Rahmen](spielleiter/rahmen.md)
- [Welten](spielleiter/welten.md)
- [Kapitel und Szenen](spielleiter/kapitel-und-szenen.md)
- [Glossarfenster](spielleiter/glossarfenster.md)
- [Eintrag schreiben](spielleiter/eintrag-schreiben.md)
- [Runden](spielleiter/runden.md)
- [Storyfenster](spielleiter/storyfenster.md)
- [Masterfenster](spielleiter/masterfenster.md)
- [Questfenster](spielleiter/questfenster.md)
- [Notizfenster](spielleiter/notizfenster.md)
- [Spieleransicht](spielleiter/spieleransicht.md)
- [Kampffenster](spielleiter/kampffenster.md)
- [Figuren der Spieler](spielleiter/figuren-der-spieler.md)
- [LvUp](spielleiter/lvup.md): Bonuspunkte und Geistesblitz

### Spieler (Handy)

- [Rahmen](spieler/rahmen.md)
- [Anmeldung](spieler/anmeldung.md)
- [Meine Charaktere](spieler/meine-charaktere.md)
- [Charaktererstellung](spieler/charaktererstellung.md)
- [Charakter in der Runde](spieler/charakter-in-der-runde.md)
- [Meine Runden](spieler/meine-runden.md)
- [Runde](spieler/runde.md)
- [Würfeln](spieler/wuerfeln.md)
- [Quests](spieler/quests.md)
- [Chat](spieler/chat.md)
- [Glossar](spieler/glossar.md)
- [Notizen](spieler/notizen.md)
- [Gruppe](spieler/gruppe.md)
- [Kampf](spieler/kampf.md)
- [Tutorials](spieler/tutorials.md)
