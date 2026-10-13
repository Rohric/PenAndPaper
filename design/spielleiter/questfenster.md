# Questfenster

## Userstory

Als Spielleiter will ich alle Quests der Welt mit ihrem Stand in dieser Runde auf einem Brett sehen, sie annehmen, beenden und teilen und mitten im Spiel eine neue anlegen.

## Lösung

Zwei Blöcke untereinander: **Hauptquests** und **Nebenquests**. Jeder Block zeigt einen Status, den man über drei Schalter mit Zahl wählt: Laufend, Offen, Beendet.

Jede Quest ist eine [Karte](../bausteine/kachel.md): Art und Nummer, Status, Name, Ziel, „Checkliste 1 von 3", Verknüpfungen als [Tags](../bausteine/tags.md), rechts die Schalter Auge, Stecknadel, Notiz, Beendet; darunter „Annehmen".

Ein Klick auf den Namen öffnet das [Popup](../bausteine/eintrag-popup.md). Im [Seitenfenster](../bausteine/eintrag-seitenfenster.md), Reiter „Runde", stehen das Questlog der Gruppe und „In dieser Runde ändern" (Name, Ziel, Questgeber, Startgebiet, Szene; die Welt bleibt, wie sie ist).

Eine neu angelegte Quest ist eine Nebenquest am Kapitel der Runde, sofort angenommen und geteilt.

## Bausteine

- [Runden](runden.md), [Kachel](../bausteine/kachel.md), [Tags](../bausteine/tags.md), [Auge](../bausteine/auge.md)
- Code: `gm/cockpit/quest-board`, `components/play/quest-log`

## Leisten in dieser Ansicht

- **links, hier:** die Ansichten der Runde, „Quests" aktiv.
- **oben:** Runde › Welt › Kapitel, Suche.

Symbolleiste, Abschnitt „zur Ansicht":

| Wort | voller Name | Klick |
| --- | --- | --- |
| Neu | Neue Quest | Popup: Titel |
| Geteilte | Nur geteilte | schaltet |
| Angepinnt | Nur angepinnte | schaltet |

## Zustände

- **Block leer:** „Keine laufende Hauptquest." (je Status und Art)

## Tastatur

3 öffnet die Quests.

## Offen

entfällt
