# Meldung

## Userstory

Als Nutzer will ich sofort sehen, ob etwas geklappt hat oder nicht, egal wo auf der Seite ich gerade bin, ohne nach oben scrollen zu müssen.

## Lösung

**Kurze Meldung (Toast).** Erscheint oben in der Mitte, über allem, und verschwindet nach einigen Sekunden von selbst. Ein Tipp nimmt sie sofort weg. Höchstens drei gleichzeitig.

| Ton | Rand | Wofür |
| --- | --- | --- |
| neutral | Linie | Neuigkeiten („Neue Quest: Der Schwarzmarkt") |
| gut | grün | „Gespeichert" |
| Fehler | rot | Speichern ging nicht, Verbindung, Regel verletzt |

Regeln:
- Jedes Speichern, das der Nutzer auslöst, bekommt eine Meldung: „Gespeichert" oder der Grund, warum nicht.
- Fehler vom Server erscheinen als kurze Meldung, nicht als Kasten am Seitenanfang.
- Hat ein Formular Fehler der Regeln, sagt die Meldung, wie viele („2 Fehler in der Skillung"), und die Seite springt zur ersten Stelle.

**Hinweis in der Seite.** Ein ruhiger Kasten für Dinge, die bleiben, solange sie gelten: „Dein Charakter spielt in einem Abenteuer …", „Verbindung unterbrochen …". Kein Kasten für einmalige Fehler.

**Meldung am Feld.** Was die Regeln zu einem Feld sagen, steht direkt darunter, rot wenn es das Speichern sperrt, grau wenn es nur ein Hinweis ist.

**Leer.** Ein ruhiger Kasten mit einem Satz, was hier stehen wird und wie man anfängt.

## Bausteine

- Code: `global/toast/` (`ToastService.show(text, tone)`), Klassen `notice` und `empty` in `styles/_parts.scss`

## Leisten in dieser Ansicht

entfällt

## Zustände

entfällt

## Tastatur

Kurze Meldungen werden Vorlesern angesagt und nehmen keinen Fokus.

## Offen

entfällt
