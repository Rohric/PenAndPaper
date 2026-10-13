# Anmeldung

## Userstory

Als Spieler will ich mich am Handy mit Name und Passwort anmelden oder ein Konto anlegen, am besten über einen QR-Code, den der Spielleiter zeigt.

## Lösung

Eine Seite ohne Rahmen: Titel der App, die Felder Name und Passwort, der Hauptknopf „Anmelden", darunter der Wechsel zu „Konto anlegen" (mit Passwort wiederholen).

Am großen Bildschirm steht daneben der QR-Code, der ein Handy direkt zur Anmeldung bringt.

Nach der Anmeldung landet man bei [Meine Charaktere](meine-charaktere.md). Beim ersten Besuch öffnet sich das Tutorial „Willkommen, Spieler".

## Bausteine

- [Formular](../bausteine/formular.md), [Meldung](../bausteine/meldung.md)
- Code: `auth/auth-page`, `components/basic/login-qr`

## Leisten in dieser Ansicht

Keine. Die Anmeldung hat keinen Rahmen.

## Zustände

- **falsche Daten:** kurze Meldung oben und der Satz am Feld.

## Tastatur

Enter sendet das Formular.

## Offen

entfällt
