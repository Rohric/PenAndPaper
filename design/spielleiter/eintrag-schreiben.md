# Eintrag schreiben

## Userstory

Als Spielleiter will ich jeden Eintrag der Welt im selben Formular schreiben, egal welche Art, und dabei festlegen, was die Spieler von Anfang an sehen und zu welchen Kapiteln er gehört.

## Lösung

Ein Eintrag wird im [Seitenfenster](../bausteine/eintrag-seitenfenster.md) geschrieben (Knopf „Bearbeiten", das Fenster wird breit). Die Felder stehen für alle Arten in derselben Reihenfolge, siehe [Formular](../bausteine/formular.md):

1. Name
2. Symbol (und Bilder bei Orten und Gegenständen)
3. **Kapitel** als verknüpfte [Tags](../bausteine/tags.md)
4. Haken **„Von Anfang an für Spieler sichtbar"**, darunter: „Gilt für neue Runden. In einer laufenden Runde schaltest du das Auge."
5. Beschreibung
6. eigene Felder der Art
7. Wissen für Spieler, Wissen nur für dich
8. Verknüpfungen
9. Löschen

| Art | eigene Felder |
| --- | --- |
| Ort | „Liegt in"; „Ereignisse an diesem Ort" (verknüpfen oder neu anlegen, wird sofort gespeichert; ein Ereignis hat genau einen Ort, es zieht also hierher um) |
| Figur | Steckbrief, Werte, Skillung, Inventar, Besondere Fähigkeiten, Beispielsätze (im Editor des Charakters, siehe [Charakterbogen](../bausteine/charakterbogen.md)); Ort, an dem man sie antrifft |
| Quest | Art (Haupt- oder Nebenquest), Nummer, Ziel, Checkliste, Questgeber, Startgebiet, Szene, beteiligte Figuren, Dialoge |
| Ereignis | Auslöser, Was passiert, Ort, Figuren (suchen oder neu anlegen), Führt zu (Szenen, zu denen das Ereignis führen kann), Dialoge. So hat eine Szene mehrere mögliche Ereignisse, jedes mit eigenen Figuren und eigenem Weg weiter. |
| Gegenstand, Wissen | Kategorie; Schaden bei Waffen; Orte, Figuren, Quests, Ereignisse, an denen es hängt |

**Neu anlegen:** das Symbol „Neu" fragt in einem Dialog nur nach dem Namen und öffnet dann das Formular. In jedem Verknüpfungsfeld legt „neu anlegen" den Eintrag mit seinem Namen sofort an.

**Speichern:** Knopf im Fuß des Fensters mit seinem Stand; danach eine kurze [Meldung](../bausteine/meldung.md).

## Bausteine

- [Seitenfenster eines Eintrags](../bausteine/eintrag-seitenfenster.md), [Formular](../bausteine/formular.md), [Tags](../bausteine/tags.md)
- Code: `gm/glossary/` (`entry-form`, `entry-editor`, `location-editor`, `quest-editor`, `event-editor`, `trivia-editor`, `world-npc-editor`), `components/form/entry-texts-editor`

## Leisten in dieser Ansicht

entfällt (das Formular liegt im Seitenfenster)

## Zustände

- **ungespeicherte Änderungen:** Schließen fragt nach.
- **Fehler beim Speichern:** kurze Meldung oben, das Formular bleibt offen.

## Tastatur

Strg + Enter speichert.

## Offen

entfällt
