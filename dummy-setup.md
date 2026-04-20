# 🚀 Angular Dummy Frontend - Setup & Routing

Dieses Dokument enthält die Befehle und den Code, um den Klick-Dummy für das Pen & Paper Frontend aufzubauen, ohne dass eine echte Backend-Verbindung benötigt wird.

## 1. Komponenten generieren
Öffne dein Terminal im Ordner `frontend` und führe folgende Befehle aus, um die Struktur für unsere Screens zu erstellen:

```bash
# Auth Screens
ng generate component features/auth/register
ng generate component features/auth/login

# Profilauswahl
ng generate component features/profile-select

# Charakter-Screens (falls noch nicht erstellt)
ng generate component features/characters/character-list
ng generate component features/characters/character-detail
```

## 2. Das Dummy-Daten Modell (Interfaces)
Damit TypeScript und dein HTML wissen, welche Daten existieren, legen wir Interfaces an, die deinem Django-Backend (`CharacterProfile` und `Talent`) entsprechen.

Erstelle eine Datei `src/app/shared/models/character.model.ts` (Ordner ggf. anlegen) und füge folgenden Code ein:

```typescript
export interface Talent {
  name: 'WISSEN' | 'SOZIAL' | 'HANDELN';
  grund_punkte: number;
  bonus_punkte: number;
  geistesblitz_punkte: number;
  // Nur fürs Frontend-Design: Fiktive Fähigkeiten, die zum Talent gehören
  faehigkeiten: { name: string; wert: number }[];
}

export interface CharacterProfile {
  id: number;
  name: string;
  alter: number;
  beruf: string;
  geschlecht: string;
  beschreibung: string;
  lore: string;
  health_points: number;
  talents: Talent[];
}
```

## 3. Der Dummy-Service mit unserem Charakter
Erstelle nun den Service (falls noch nicht geschehen):
```bash
ng generate service core/services/character-dummy
```

Öffne `src/app/core/services/character-dummy.service.ts` und füge unseren detaillierten Charakter ein:

```typescript
import { Injectable } from '@angular/core';
import { CharacterProfile } from '../../shared/models/character.model';

@Injectable({
  providedIn: 'root'
})
export class CharacterDummyService {

  getDummyCharacter(): CharacterProfile {
    return {
      id: 1,
      name: 'Thorin Eichenschild',
      alter: 149,
      beruf: 'Krieger / Schmied',
      geschlecht: 'Männlich',
      beschreibung: 'Ein stämmiger Zwerg mit einem dichten, geflochtenen Bart und einer tiefen Narbe über dem linken Auge.',
      lore: 'Thorin verlor seine Heimat an einen Drachen und sucht nun nach Rache und altem Zwergengold.',
      health_points: 100,
      talents: [
        {
          name: 'WISSEN',
          grund_punkte: 5,
          bonus_punkte: 2,
          geistesblitz_punkte: 1,
          faehigkeiten: [
            { name: 'Alchemie', wert: 3 },
            { name: 'Geschichte', wert: 8 },
            { name: 'Naturkunde', wert: 5 }
          ]
        },
        {
          name: 'SOZIAL',
          grund_punkte: 4,
          bonus_punkte: 1,
          geistesblitz_punkte: 2,
          faehigkeiten: [
            { name: 'Überreden', wert: 6 },
            { name: 'Einschüchtern', wert: 12 },
            { name: 'Menschenkenntnis', wert: 4 }
          ]
        },
        {
          name: 'HANDELN',
          grund_punkte: 12,
          bonus_punkte: 4,
          geistesblitz_punkte: 3,
          faehigkeiten: [
            { name: 'Schwertkampf', wert: 16 },
            { name: 'Schmieden', wert: 14 },
            { name: 'Athletik', wert: 10 }
          ]
        }
      ]
    };
  }
}
```

## 4. Das Angular Routing einrichten
Wir verbinden nun unsere generierten Komponenten mit URLs, damit wir einfach durchklicken können.
Öffne die Datei `src/app/app.routes.ts` und konfiguriere die Routen:

```typescript
import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ProfileSelectComponent } from './features/profile-select/profile-select.component';
import { CharacterListComponent } from './features/characters/character-list/character-list.component';
import { CharacterDetailComponent } from './features/characters/character-detail/character-detail.component';

export const routes: Routes = [
  // Startseite leitet direkt zur Registrierung weiter
  { path: '', redirectTo: '/register', pathMatch: 'full' },
  
  // Auth & Rollenauswahl
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile-select', component: ProfileSelectComponent },
  
  // Charaktere
  { path: 'characters', component: CharacterListComponent },
  { path: 'characters/:id', component: CharacterDetailComponent },
  
  // Fallback, falls eine unbekannte URL aufgerufen wird
  { path: '**', redirectTo: '/register' }
];
```

## 5. Klick-Navigation im HTML (Beispiel)
Um z.B. vom Login zur Profilauswahl zu kommen, nutzt du im HTML einfach `routerLink`:

**`login.component.html`**
```html
<h2>Login</h2>
<!-- Formular-Felder hier -->
<button routerLink="/profile-select">Einloggen (Dummy)</button>
```