import { Component } from '@angular/core';

import { SideRail } from '../side-rail/side-rail';
import { PlayerToolBar } from '../tool-bar/player-tool-bar';

/**
 * The frame of the players, built for the phone: the page as one column, nothing sticks on top, the bar of
 * symbols stays at the bottom and the menu slides in from the left. On a large screen the column stays in the middle.
 */
@Component({
  selector: 'app-player-frame',
  imports: [SideRail, PlayerToolBar],
  template: `
    <div class="frame">
      <main class="frame__content"><ng-content /></main>
      <app-player-tool-bar />
      <app-side-rail mode="menu" />
    </div>
  `,
})
export class PlayerFrame {}
