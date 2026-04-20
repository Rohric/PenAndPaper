# Pen & Paper - Backend API

Dieses Projekt ist das Backend für eine Pen & Paper Applikation, entwickelt mit Django und dem Django REST Framework. Es ermöglicht die Verwaltung von Spielern, Charakteren, Talenten und kompletten Kampagnen.

## 🚀 Funktionsweise und Workflow

Die Applikation ist um ein Rollensystem herum aufgebaut, das zwischen normalen Spielern und Spielleitern unterscheidet.

### 1. Registrierung & Profilerstellung
- **Benutzerkonto:** Jeder Nutzer muss sich zunächst registrieren und ein Konto anlegen.
- **Spielerprofil (Player Profile):** Nach der Registrierung erstellt der Nutzer ein Spielerprofil. Hierbei muss eine Rolle gewählt werden:
  - `Game Hero` (Normaler Spieler)
  - `Game Master` (Spielleiter)

### 2. Rollen & Berechtigungen

#### 🛡️ Game Hero (Player)
* **Fokus auf den eigenen Charakter:** Spieler können ihre eigenen Charaktere erstellen und bearbeiten.
* **Privatsphäre:** Spieler haben nur Zugriff auf ihre **eigenen** Charaktere. Die Charaktere von anderen Spielern sind für sie unsichtbar.
* **Talente:** Bei der Erstellung eines Charakters werden automatisch Grundtalente (Wissen, Sozial, Handeln) zugewiesen.

#### 👑 Game Master
* **Volle Kontrolle:** Der Game Master hat administrative Rechte im Spielgeschehen.
* **Kampagnenverwaltung:** Er kann neue Kampagnen erstellen, verwalten und Spieler sowie deren Charaktere zu diesen Kampagnen hinzufügen.
* **Charakter-Zugriff:** Der Master kann die Charaktere **aller** Spieler sehen, bearbeiten und sogar eigene Charaktere (z.B. NPCs) für die Welt erstellen.

## 🛠️ Technologie-Stack
- **Framework:** Django 6.0 / Python
- **API:** Django REST Framework (DRF)
- **Datenbank:** SQLite (Standard)

## 📦 Module / Apps
Das Projekt ist in verschiedene Apps unterteilt (Auszug):
- `user_auth_app`: Authentifizierung & Registrierung
- `player_profile_app`: Verwaltung der Spielerprofile und Rollen (Hero/Master)
- `character_app`: Charaktererstellung und -verwaltung
- `campaign_app`: Erstellung von Kampagnen und Gruppierung von Charakteren
- `talents_app` / `abilities_app`: Verwaltung von Fähigkeiten und Fertigkeiten

---

*Hinweis: Um lokale Tests durchzuführen, stelle sicher, dass du die virtuellen Umgebungen aktivierst, die Requirements installierst und die Datenbank-Migrationen (`python manage.py migrate`) ausführst.*