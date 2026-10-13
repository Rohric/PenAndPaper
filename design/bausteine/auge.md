# Auge

## Userstory

Als Spielleiter will ich an jedem Eintrag und an jedem seiner Teile sehen und schalten, ob die Spieler ihn kennen, ohne dafür einen eigenen Abschnitt aufzuschlagen.

## Lösung

Ein kleiner Symbolknopf. Offenes Auge in Akzentfarbe: die Spieler sehen es. Durchgestrichenes Auge, gedämpft: verborgen.

| Wo | Was es schaltet |
| --- | --- |
| an der [Kachel](kachel.md) und am Namen | der Eintrag steht bei den Spielern (zunächst nur der Name) |
| an einem Textblock | dieser Teil ist sichtbar: Beschreibung, Ziel, Questgeber, Startgebiet, Auslöser, „Was passiert" |
| an einem Punkt der Checkliste | der Punkt ist sichtbar; der Haken daneben heißt erledigt |
| an einem Stück „Wissen für Spieler" | die Gruppe hat es herausgefunden |

- Ist das Auge am Namen aus, sind die kleinen Augen blass: vorgemerkt, wirkt erst mit dem Namen.
- „Wissen nur für dich" trägt ein Schloss und lässt sich nicht schalten.
- Das Auge gilt für diese Runde. Die Welt bleibt unverändert.
- Beim Schreiben der Welt gibt es kein Auge, nur den Haken „Von Anfang an für Spieler sichtbar": neue Runden starten dann mit Auge an für Name und Beschreibung.

## Bausteine

- Code: `components/entry/eye-toggle` (`app-eye`)
- [Kachel](kachel.md), [Eintrag lesen](eintrag-lesen.md)

## Leisten in dieser Ansicht

entfällt

## Zustände

entfällt

## Tastatur

Mit Tab erreichbar, Leertaste oder Enter schaltet. Für Vorleser nennt der Knopf, was er schaltet („Beschreibung zeigen").

## Offen

entfällt
