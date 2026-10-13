import { Routes } from '@angular/router';

import { authGuard, gameMasterGuard, guestGuard } from './core/auth.guard';
import { leaveGuard } from './core/leave.guard';
import { Frame } from './global/frame/frame';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    data: { mode: 'login' },
    loadComponent: () => import('./auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    data: { mode: 'register' },
    loadComponent: () => import('./auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: '',
    component: Frame,
    canActivate: [authGuard],
    children: [
      { path: 'player', pathMatch: 'full', redirectTo: 'player/characters' },
      {
        path: 'player/characters',
        loadComponent: () => import('./player/characters/player-home').then((m) => m.PlayerHome),
      },
      {
        path: 'player/sessions',
        loadComponent: () => import('./player/sessions/my-sessions').then((m) => m.MySessions),
      },
      {
        path: 'player/sessions/:sessionId',
        loadComponent: () => import('./player/session/player-session').then((m) => m.PlayerSession),
      },
      {
        path: 'player/characters/:id',
        canDeactivate: [leaveGuard],
        loadComponent: () => import('./player/characters/character-page').then((m) => m.CharacterPage),
      },
      {
        path: 'gm',
        canActivate: [gameMasterGuard],
        loadChildren: () => import('./gm/gm.routes').then((m) => m.GM_ROUTES),
      },
      { path: '', pathMatch: 'full', redirectTo: 'player/characters' },
    ],
  },
  { path: '**', redirectTo: '' },
];
