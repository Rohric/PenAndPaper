# Schnelligkeit

## Userstory

Als Spielleiter mit acht Spielern und mehr will ich, dass die App während der Runde flüssig läuft: am Handy wie am Desktop, über WLAN wie über den Tunnel, auch wenn alle gleichzeitig würfeln, schreiben und lesen.

## Lösung

**Abfragen**
- Jedes Gerät fragt in einer Runde **eine** Adresse ab: `sessions/<id>/state/`. Sie liefert alles, was die Seite der Runde braucht, und dazu eine Kennung (`tag`).
- Das Gerät schickt die letzte Kennung mit (`?have=`). Hat sich nichts geändert, kommt die Antwort ohne Inhalt (`204`), und auf dem Gerät passiert nichts.
- Takt: alle 3 s, während eines Kampfes alle 1,5 s. Die Zahlen stehen an einer Stelle (`core/poll.ts`).
- Nie zwei Abfragen gleichzeitig. Was das Gerät selbst tut (würfeln, schreiben, aufdecken), löst sofort eine Abfrage aus.
- Ist der Bildschirm verdeckt oder das Handy gesperrt, wird nicht abgefragt; beim Wiederkommen sofort.
- Nach einem Fehler wird die Wartezeit länger, bis höchstens 30 s, und nach dem ersten Erfolg wieder normal.

**Zeichnen**
- Ein Signal, das eine Abfrage füllt, löst nur aus, wenn sich sein Inhalt wirklich geändert hat (`core/same.ts`, `equal: sameJson`).
- Im Leerlauf ändert sich am Bildschirm nichts, außer Zeitangaben wie „vor 2 Minuten".
- Listen haben immer ein festes `track`.

**Ausliefern**
- Zum Spielen: `npm run start:play` (WLAN, mit QR-Code) oder `npm run start:play:tunnel` (über das Internet). Beide bauen die App (`ng build`) und liefern sie über `frontend/tools/play-server.cjs` aus: verkleinert, gepackt, mit `/api` und `/media` zum Backend durchgereicht. Der Angular-Entwicklungsserver hängt immer Source-Maps an und packt nichts; er ist nur zum Entwickeln.
- Zum Entwickeln: `npm run start:lan` und `npm run start:tunnel`.

**Server**
- SQLite läuft im Modus WAL: Lesen und Schreiben halten sich nicht gegenseitig auf.
- Listen laden die Beziehungen ihrer Einträge auf einmal (`select_related`, `prefetch_related`), nicht je Eintrag.
- Hochgeladene Bilder werden verkleinert: Charaktere auf 800 px, Orte und Gegenstände auf 1600 px an der längsten Seite.

## Bausteine

- Code: `core/poll.ts` (`Poller`, `ROUND_MS`, `BATTLE_MS`), `core/same.ts` (`sameJson`), `backend/session_app/state.py`, `backend/core/images.py`, `frontend/tools/play-server.cjs`
- [Regeln](regeln.md), [Breiten](breiten.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

- **Verbindung weg:** der Hinweis „Verbindung unterbrochen" (Spieler) bzw. die rote Meldung; die Seite zeigt den letzten Stand weiter.
- **Bildschirm verdeckt:** keine Abfragen.

## Tastatur

entfällt

## Offen

- Server-Push (WebSockets) bräuchte einen anderen Server und neue Pakete. Solange eine Abfrage alle 3 s meist leer zurückkommt, ist das nicht nötig.
