import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { LayoutService } from '../core/layout.service';
import { TutorialService } from '../core/tutorial.service';
import { TutorialWindow } from '../shared/tutorial-window';
import { ShellDesktop } from './shell-desktop';
import { ShellMobile } from './shell-mobile';

/** Pick the frame that fits the screen and render the current page inside it. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, ShellDesktop, ShellMobile, TutorialWindow],
  template: `
    @if (layout.isMobile()) {
      <app-shell-mobile><router-outlet /></app-shell-mobile>
    } @else {
      <app-shell-desktop><router-outlet /></app-shell-desktop>
    }
    <app-tutorial-window />
  `,
})
export class Shell {
  protected readonly layout = inject(LayoutService);

  constructor() {
    // Pick up a game master switch the admin set since the last login.
    inject(AuthService).refresh().subscribe({ error: () => undefined });
    inject(TutorialService).openOnFirstVisit();
  }
}
