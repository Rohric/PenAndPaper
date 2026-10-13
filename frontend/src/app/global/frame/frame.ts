import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { TutorialService } from '../../core/tutorial.service';
import { ToastOutlet } from '../toast/toast-outlet';
import { TutorialWindow } from '../tutorial/tutorial-window';
import { GmFrame } from './gm-frame';
import { NavService } from './nav.service';
import { PlayerFrame } from './player-frame';

/**
 * Pick the frame of the area and render the current page inside it: the pages of the game master are built
 * for the desktop, the pages of the players for the phone. The area decides, not the width of the window.
 */
@Component({
  selector: 'app-frame',
  imports: [RouterOutlet, GmFrame, PlayerFrame, ToastOutlet, TutorialWindow],
  template: `
    @if (nav.area() === 'gm') {
      <app-gm-frame><router-outlet /></app-gm-frame>
    } @else {
      <app-player-frame><router-outlet /></app-player-frame>
    }
    <app-toast-outlet />
    <app-tutorial-window />
  `,
  host: { '[class.area-gm]': "nav.area() === 'gm'", '[class.area-player]': "nav.area() === 'player'" },
  styleUrl: './frame.scss',
})
export class Frame {
  protected readonly nav = inject(NavService);

  constructor() {
    // Pick up a game master switch the admin set since the last login.
    const auth = inject(AuthService);
    auth.refresh().subscribe({ error: () => undefined });
    inject(TutorialService).openOnFirstVisit(auth.isGameMaster() ? 'start' : 'start-player');
  }
}
