# PenAndPaper

Eine Web-App für Pen-and-Paper-Runden nach „How to be a Hero". Der Spielleiter schreibt Welten und leitet Runden am Desktop, die Spieler führen ihre Charaktere am Handy. `backend/` ist Django mit DRF, `frontend/` ist Angular. `backend-old/` wird nicht angefasst.

## Arbeitsregeln

- **Frontend: erst die Design-Regeln lesen.** Vor jeder Arbeit am Frontend `design/README.md` und die Dateien für die betroffene Seite und ihre Bausteine lesen. Kommt etwas Neues dazu oder ändert sich etwas, zuerst die Design-Datei anpassen, dann bauen. Neue Seiten bekommen eine eigene Design-Datei nach der Vorlage.
- **Bausteine wiederverwenden.** Fenster, Kachel, Leisten, Felder und Meldungen gibt es genau einmal unter `frontend/src/app/components/` und `global/`. Keinen zweiten Baustein für dieselbe Sache bauen.
- **Zwei Bereiche.** Seiten des Spielleiters (`gm/`) sind nur für den Desktop gebaut, Seiten der Spieler (`player/`) nur für das Handy. Media-Queries stehen nur in `frontend/src/styles/gm.scss` und `frontend/src/styles/player.scss`.
- **Models nur nach Rückfrage.** Jedes neue Model und jedes neue Feld mit Name und Inhalt mit Emil abstimmen, bevor es geschrieben wird.
- **Regeln des Spiels** stehen zweimal und müssen gleich rechnen: offizielles Regelwerk in `backend/character_app/utils.py` und `frontend/src/app/core/rules.ts`, Hausregeln in `backend/character_app/house_rules.py` und `frontend/src/app/core/house-rules.ts`.
- **Backend-Stil:** Funktionen höchstens 14 Zeilen, englische Docstrings im Imperativ, doppelte Anführungszeichen, Logik in `utils.py`, Views dünn.
- **Sprache:** Code, Kommentare und Docstrings englisch. Alles, was der Nutzer liest, deutsch in du-Form.
- **Nicht tun:** nicht committen (Emil committet selbst und bekommt eine Commit-Message als Vorschlag), keine Tests schreiben oder starten, keinen Dev-Server starten, die Welt „Pilzwahn" nicht neu laden.

## Prüfen

- `backend/`: `env/Scripts/python.exe manage.py check` und `env/Scripts/python.exe manage.py makemigrations --check --dry-run`
- `frontend/`: `npx ng build --configuration development`
