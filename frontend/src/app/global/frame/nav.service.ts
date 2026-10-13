import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from '../core/auth.service';

export type Mode = 'player' | 'gm';

export interface NavItem {
  label: string;
  path: string;
}

const MODES: { id: Mode; label: string; home: string }[] = [
  { id: 'player', label: 'Spieler', home: '/player/characters' },
  { id: 'gm', label: 'Spielleiter', home: '/gm' },
];

const NAV: Record<Mode, NavItem[]> = {
  player: [
    { label: 'Meine Charaktere', path: '/player/characters' },
    { label: 'Meine Runden', path: '/player/sessions' },
  ],
  gm: [
    { label: 'Welten', path: '/gm/worlds' },
    { label: 'Runden', path: '/gm/sessions' },
    { label: 'Figuren', path: '/gm/characters' },
  ],
};

/** Menu state both frames share: the current area, its links and the area switch. */
@Injectable({ providedIn: 'root' })
export class ShellNav {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly modes = MODES;
  readonly mode = computed<Mode>(() => (this.url().startsWith('/gm') ? 'gm' : 'player'));
  readonly modeLabel = computed(() => MODES.find((m) => m.id === this.mode())?.label ?? '');
  readonly items = computed(() => NAV[this.mode()]);
  readonly canSwitch = this.auth.isGameMaster;

  /** Open the start page of the player or the game master area. */
  switchTo(mode: Mode): void {
    const target = MODES.find((m) => m.id === mode);
    void this.router.navigateByUrl(target?.home ?? '/player');
  }
}
