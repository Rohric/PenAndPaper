import { Routes } from '@angular/router';

/** Pages of the game master area. */
export const GM_ROUTES: Routes = [
  { path: 'worlds', loadComponent: () => import('../worlds/world-list').then((m) => m.WorldList) },
  { path: 'worlds/:worldId', pathMatch: 'full', redirectTo: 'worlds/:worldId/lore' },
  {
    path: 'worlds/:worldId/:section',
    loadComponent: () => import('../worlds/world-workspace').then((m) => m.WorldWorkspace),
  },
  {
    path: 'characters',
    data: {
      title: 'Figuren',
      text: 'Hier siehst du später die Charaktere deiner Spieler und wählst sie für ein Abenteuer aus. Die Figuren deiner Welt schreibst du direkt in der Welt.',
    },
    loadComponent: () => import('./coming-soon').then((m) => m.ComingSoon),
  },
  { path: '', pathMatch: 'full', redirectTo: 'worlds' },
];
