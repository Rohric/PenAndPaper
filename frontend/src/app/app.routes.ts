import { Routes } from '@angular/router';

import { authGuard, gameMasterGuard, guestGuard } from './core/auth.guard';
import { leaveGuard } from './core/leave.guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    data: { mode: 'login' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    data: { mode: 'register' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'player', pathMatch: 'full', redirectTo: 'player/characters' },
      {
        path: 'player/characters',
        loadComponent: () => import('./features/player/player-home').then((m) => m.PlayerHome),
      },
      {
        path: 'player/sessions',
        loadComponent: () => import('./features/sessions/my-sessions').then((m) => m.MySessions),
      },
      {
        path: 'player/sessions/:sessionId',
        loadComponent: () => import('./features/sessions/player-session').then((m) => m.PlayerSession),
      },
      {
        path: 'player/characters/:id',
        canDeactivate: [leaveGuard],
        loadComponent: () => import('./features/player/character-page').then((m) => m.CharacterPage),
      },
      {
        path: 'gm',
        canActivate: [gameMasterGuard],
        loadChildren: () => import('./features/gm/gm.routes').then((m) => m.GM_ROUTES),
      },
      { path: '', pathMatch: 'full', redirectTo: 'player/characters' },
    ],
  },
  { path: '**', redirectTo: '' },
];
