# 🎲 Pen & Paper - Angular Frontend Setup

Diese Anleitung beschreibt die ersten Schritte, um das Angular-Frontend für die Pen & Paper App aufzusetzen und die ersten Komponenten für die Arbeit mit Dummy-Daten zu generieren.

## 1. Voraussetzungen
Stelle sicher, dass [Node.js](https://nodejs.org/) installiert ist. 
Installiere anschließend die Angular CLI (Command Line Interface) global auf deinem System:

```bash
npm install -g @angular/cli
```

## 2. Projekt erstellen
Erstelle das neue Angular-Projekt im Hauptordner (neben dem `backend`-Ordner). Wir nennen es `frontend`:

```bash
ng new frontend
```
* **Routing:** Wähle `Yes` (wir werden Routen für Profile, Kampagnen und Charaktere brauchen).
* **Stylesheet:** Wähle `SCSS` oder `CSS` (SCSS bietet sich für komplexere Stylings oft an).

Wechsle anschließend in den neuen Projektordner:
```bash
cd frontend
```

## 3. Ordnerstruktur & Architektur
Für eine saubere Trennung empfiehlt sich folgende Struktur innerhalb des `src/app/`-Verzeichnisses:
* `core/`: Für grundlegende Dinge wie Guards, Interceptors (später für Auth).
* `shared/`: Für geteilte UI-Komponenten (Buttons, Modals) und Interfaces.
* `features/`: Für die eigentlichen App-Bereiche (Campaigns, Characters, Player).

## 4. Die ersten Komponenten erstellen
Lass uns die wichtigsten Ansichten als Komponenten generieren, die zu deinem Django-Backend passen.

### Spieler & Dashboard
```bash
ng generate component features/dashboard
ng generate component features/player-profile
```

### Kampagnen (Game Master & Game Hero Sicht)
```bash
ng generate component features/campaigns/campaign-list
ng generate component features/campaigns/campaign-detail
```

### Charaktere
```bash
ng generate component features/characters/character-list
ng generate component features/characters/character-detail
```

## 5. Dummy-Daten Service anlegen
Damit das Frontend nicht leer ist und du das Layout bauen kannst, erstellen wir einen Service für Dummy-Daten.

```bash
ng generate service core/services/dummy-data
```

**Beispiel für Dummy-Daten (in Anlehnung an das Backend-Modell):**

Lege zuerst ein Interface in `src/app/shared/models/campaign.model.ts` an:
```typescript
export interface Campaign {
  id: number;
  name_campaign: string;
  description_campaign: string;
  game_master_id: number;
  characters: number[]; // IDs der verknüpften Charaktere
}
```

Füge dann im `DummyDataService` (`dummy-data.service.ts`) die Dummy-Werte hinzu:
```typescript
import { Injectable } from '@angular/core';
import { Campaign } from '../../shared/models/campaign.model';

@Injectable({
  providedIn: 'root'
})
export class DummyDataService {
  
  getDummyCampaigns(): Campaign[] {
    return [
      {
        id: 1,
        name_campaign: 'Das Verlies der Schatten',
        description_campaign: 'Eine gefährliche Reise in die Dunkelheit.',
        game_master_id: 1, // Z.B. der Game Master
        characters:
      },
      {
        id: 2,
        name_campaign: 'Die Suche nach dem Sonnenkristall',
        description_campaign: 'Ein Wettlauf gegen die Zeit, um die Welt zu retten.',
        game_master_id: 2,
        characters:
      }
    ];
  }
}
```

## 6. Projekt starten
Starte den Entwicklungsserver, um deine Fortschritte live im Browser zu sehen:

```bash
ng serve -o
```
Die App öffnet sich nun automatisch unter `http://localhost:4200/`.