# Eintrag schreiben

## Userstory

Als Spielleiter will ich jeden Eintrag der Welt im selben Formular schreiben, egal welche Art, und dabei festlegen, was die Spieler von Anfang an sehen, zu welchen Kapiteln er gehört, in welche Kategorie er fällt und was ich mir dazu merke.

## Lösung

Ein Eintrag wird im [Seitenfenster](../bausteine/eintrag-seitenfenster.md) geschrieben (Knopf „Bearbeiten" im Fuß, das Fenster wird breit) oder auf seiner ganzen Seite (Symbol „Bearbeiten" in der Symbolleiste). Die Felder stehen für alle Arten in derselben Reihenfolge, siehe [Formular](../bausteine/formular.md):

1. Name
2. Symbol (und Bilder bei Orten und Gegenständen)
3. **Kategorie**, freier Text mit den Kategorien dieser Art als Vorschlag
4. **Kapitel** als verknüpfte [Tags](../bausteine/tags.md)
5. Speichern und Löschen
6. Haken **„Von Anfang an für Spieler sichtbar"**, darunter: „Gilt für neue Runden. In einer laufenden Runde schaltest du das Auge."
7. Beschreibung
8. eigene Texte der Art
9. Wissen für Spieler, Wissen nur für dich
10. **Notiz (nur für dich)**, darunter: „Nur du siehst sie, auch in jeder Runde."
11. Dialoge
12. Verknüpfungen
13. was sofort gespeichert wird

| Art | im Kopf | eigene Texte | Verknüpfungen | sofort gespeichert |
| --- | --- | --- | --- | --- |
| Ort | – | – | Liegt in | Ereignisse an diesem Ort (ein Ereignis hat genau einen Ort, es zieht also hierher um), Gegenstände |
| Figur | siehe unten | | | |
| Quest | Art (Haupt- oder Nebenquest), Nummer | Ziel, Checkliste | Questgeber, Startgebiet, Entsteht in Szene, Beteiligte Figuren | Gegenstände |
| Ereignis | – | Auslöser, Was passiert | Ort, Figuren, Führt zu (Szenen, zu denen das Ereignis führen kann) | Hängt an Szenen |
| Gegenstand, Wissen | – | – (Schaden einer Waffe als Wissen nur für dich „Schaden: 2W10+1") | Orte, Figuren, Quests, Ereignisse | – |
| Kapitel | Nummer | Worum es geht, Zum Vorlesen | – (was im Kapitel vorkommt, trägt seinen Tag) | – |
| Szene | Haken „Optionale Szene" | Vorlesen, Was passiert | Ort, Figuren, Ereignisse, Quests, Wissen, Führt zu | alles, die Szene speichert sich selbst |

**Figur:** Oben der Kasten „In dieser Welt" mit Kategorie, Kapitel, Anzutreffen in, Gegenstände der Welt bei dieser Figur und Notiz (nur für dich); das wird sofort gespeichert, Kategorie und Notiz beim Verlassen des Feldes. Darunter der Editor des Charakters mit seinem eigenen Speichern: Steckbrief, Werte, Skillung, Inventar, Besondere Fähigkeiten, Beispielsätze (siehe [Charakterbogen](../bausteine/charakterbogen.md)).

**Szene:** wie eine Seite Text, ohne Speicherknopf (siehe [Kapitel und Szenen](kapitel-und-szenen.md)); Kategorie steht unter dem Haken „Optionale Szene", die Notiz nach Dialoge.

**Neu anlegen** geht überall mit dem Namen und öffnet danach das Formular:
- das Symbol „Neu" in der Symbolleiste fragt in einem Dialog nach dem Namen;
- „„Text" neu anlegen" in der [Filterleiste](../bausteine/filterleiste.md) einer Wand, wenn kein Eintrag so heißt;
- „„Text" neu anlegen als …" in der Suche der [Kopfleiste](../bausteine/kopfleiste.md), mit der Art zur Wahl;
- in jedem Verknüpfungsfeld legt „neu anlegen" den Eintrag mit seinem Namen sofort an und verknüpft ihn; das Formular öffnet sich dabei nicht, ein Klick auf den neuen Tag zeigt ihn.
Einträge des Glossars öffnen sich im Seitenfenster im Formular, ein Kapitel auf seiner Seite, eine Szene im Faden ihres Kapitels zum Bearbeiten (in einer Runde in der Story).

**Einträge einer Runde:** Was der Spielleiter in einer Runde anlegt („Neu“, „neu anlegen“ in der Filterleiste, in der Suche der Kopfleiste und in jedem Verknüpfungsfeld, „Umwandeln“ einer Notiz auf dem Tisch), ist ein Eintrag nur dieser Runde (siehe [Regeln](../grundlagen/regeln.md), Grundsatz 9). Er wird im selben Formular geschrieben und bei der Runde gespeichert. Es fehlen nur, was für eine Runde nichts bedeutet: das Feld „Kapitel“ (Einträge einer Runde tragen keine Kapitel) und der Haken „Von Anfang an für Spieler sichtbar“ (in der laufenden Runde schaltet man das Auge). Verknüpfen darf er mit Einträgen der Welt und der Runde. Die Kästen, die sofort andere Einträge ändern (Ereignisse an diesem Ort, Gegenstände, Hängt an Szenen), bieten nur Einträge der Runde an, weil ein Eintrag der Welt sich beim Spielen nicht ändert.

**Speichern:** Knopf am Ende des Kopfs mit seinem Stand, oder Strg + Enter. Danach eine kurze [Meldung](../bausteine/meldung.md) („Gespeichert" oder der Grund), und das Formular wechselt zurück zum Lesen.

Entschieden: Kategorie und Notiz haben bei jeder Art denselben Platz (Kategorie im Kopf, Notiz als Letztes bei den Texten), damit man sie nicht suchen muss. Bei Figuren liegen sie im Kasten „In dieser Welt", weil der Charakter-Editor auch außerhalb der Welt benutzt wird.

## Bausteine

- [Seitenfenster eines Eintrags](../bausteine/eintrag-seitenfenster.md), [Formular](../bausteine/formular.md), [Tags](../bausteine/tags.md)
- Code: `gm/glossary/` (`entry-form`, `entry-editor`, `location-editor`, `quest-editor`, `event-editor`, `trivia-editor`, `world-npc-editor`), `gm/chapters/` (`chapter-editor`, `scene-form`), `components/form/` (`entry-texts-editor`, `category-field`, `editor-bar`)

## Leisten in dieser Ansicht

entfällt (das Formular liegt im Seitenfenster oder auf der ganzen Seite eines Eintrags)

## Zustände

- **ungespeicherte Änderungen:** Schließen fragt nach.
- **Fehler beim Speichern:** kurze Meldung oben, das Formular bleibt offen.

## Tastatur

Strg + Enter speichert.

## Offen

entfällt
