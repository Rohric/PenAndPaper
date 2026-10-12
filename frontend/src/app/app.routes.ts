import { Routes } from '@angular/router';

import { authGuard, gameMasterGuard, guestGuard } from './core/auth.guard';
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
      {
        path: 'player',
        loadComponent: () => import('./features/player/player-home').then((m) => m.PlayerHome),
      },
      {
        path: 'gm',
        canActivate: [gameMasterGuard],
        loadChildren: () => import('./features/gm/gm.routes').then((m) => m.GM_ROUTES),
      },
      { path: '', pathMatch: 'full', redirectTo: 'player' },
    ],
  },
  { path: '**', redirectTo: '' },
];
