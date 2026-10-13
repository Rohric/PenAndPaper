import { Routes } from '@angular/router';

/** Pages of the game master area. A world has two parts: its chapters and its glossary. */
export const GM_ROUTES: Routes = [
  { path: 'worlds', loadComponent: () => import('../worlds/world-list').then((m) => m.WorldList) },
  {
    path: 'worlds/:worldId',
    loadComponent: () => import('../worlds/world-workspace').then((m) => m.WorldWorkspace),
    children: [
      { path: 'chapters', loadComponent: () => import('../worlds/chapter-list').then((m) => m.ChapterList) },
      { path: 'chapters/:chapterId', loadComponent: () => import('../worlds/chapter-page').then((m) => m.ChapterPage) },
      { path: 'glossary', pathMatch: 'full', redirectTo: 'glossary/lore' },
      { path: 'glossary/:section', loadComponent: () => import('../worlds/glossary').then((m) => m.Glossary) },
      { path: '**', redirectTo: 'chapters' },
    ],
  },
  { path: 'sessions', loadComponent: () => import('../sessions/session-list').then((m) => m.SessionList) },
  {
    path: 'sessions/:sessionId',
    loadComponent: () => import('../sessions/session-cockpit').then((m) => m.SessionCockpit),
  },
  {
    path: 'characters',
    loadComponent: () => import('./player-characters').then((m) => m.PlayerCharacters),
  },
  { path: '', pathMatch: 'full', redirectTo: 'worlds' },
];
