# Questfenster

## Userstory

Als Spielleiter will ich alle Quests der Welt und dieser Runde mit ihrem Stand auf einem Brett sehen, sie annehmen, beenden und teilen und mitten im Spiel eine neue anlegen, die nur zu dieser Runde gehört.

## Lösung

Zwei Blöcke untereinander: **Hauptquests** und **Nebenquests**. Jeder Block zeigt einen Status, den man über drei Schalter mit Zahl wählt: Laufend, Offen, Beendet.

Jede Quest ist eine [Karte](../bausteine/kachel.md): Art und Nummer, Status, Name, Ziel, „Checkliste 1 von 3", Verknüpfungen als [Tags](../bausteine/tags.md), rechts die Schalter Auge, Stecknadel, Notiz, Beendet; darunter „Annehmen".

Ein Klick auf den Namen öffnet das [Popup](../bausteine/eintrag-popup.md). Im [Seitenfenster](../bausteine/eintrag-seitenfenster.md), Reiter „Runde", stehen das Questlog der Gruppe und, bei einer Quest der Welt, „In dieser Runde ändern" (Name, Beschreibung, Ziel, Questgeber, Startgebiet, Szene; die Welt bleibt, wie sie ist). Die Karten zeigen die Quest, wie die Runde sie hat.

„Neu" fragt im Dialog nach dem Namen. Die neue Quest ist eine Nebenquest **nur dieser Runde** (Marke „Nur diese Runde"), sofort angenommen und mit den Spielern geteilt, und öffnet sich im Seitenfenster im Formular. Sie trägt kein Kapitel; Einträge einer Runde tragen keine Kapitel. Popup und Seitenfenster haben bei ihr „Bearbeiten".

## Bausteine

- [Runden](runden.md), [Kachel](../bausteine/kachel.md), [Tags](../bausteine/tags.md), [Auge](../bausteine/auge.md)
- [Eintrag schreiben](eintrag-schreiben.md) (Einträge einer Runde)
- Code: `gm/cockpit/quest-board`, `components/play/quest-log`, `components/form/name-dialog`

## Leisten in dieser Ansicht

- **links, hier:** die Ansichten der Runde, „Quests" aktiv.
- **oben:** Runde › Welt › Kapitel, Suche.

Symbolleiste, Abschnitt „zur Ansicht":

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neue Quest in dieser Runde | Dialog: Name; danach öffnet das Seitenfenster im Formular |
| Geteilte | Nur geteilte | schaltet |
| Angepinnt | Nur angepinnte | schaltet |

## Zustände

- **Block leer:** „Keine laufende Hauptquest." (je Status und Art)

## Tastatur

3 öffnet die Quests.

## Offen

entfällt
