import { Component, ElementRef, inject } from '@angular/core';

import { SideRail } from '../side-rail/side-rail';
import { GmToolBar } from '../tool-bar/gm-tool-bar';
import { TopBar } from '../top-bar/top-bar';
import { NavService } from './nav.service';

const TYPING = 'input, textarea, select, [contenteditable]';

/**
 * The frame of the game master, built for the desktop: the rail with the tabs on the left, the bar with the
 * place and the links of the view on top, the page in the middle and the bar of tools at the bottom.
 * The digits 1 to 9 open the tabs of the place, "/" jumps into the search.
 */
@Component({
  selector: 'app-gm-frame',
  imports: [SideRail, TopBar, GmToolBar],
  template: `
    <div class="frame" [class.is-open]="nav.railOpen()">
      <app-side-rail />
      <div class="frame__main">
        <app-top-bar />
        <main class="frame__content"><ng-content /></main>
        <app-gm-tool-bar />
      </div>
    </div>
  `,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class GmFrame {
  protected readonly nav = inject(NavService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Follow the keys of the frame, unless the user is typing somewhere or holds a modifier. */
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (event.ctrlKey || event.altKey || event.metaKey || target?.closest?.(TYPING)) {
      return;
    }
    if (event.key === '/') {
      event.preventDefault();
      this.host.nativeElement.querySelector<HTMLElement>('app-top-bar input')?.focus();
      return;
    }
    const tab = this.nav.here.items()[Number(event.key) - 1];
    if (tab) {
      this.nav.go(tab);
    }
  }
}
