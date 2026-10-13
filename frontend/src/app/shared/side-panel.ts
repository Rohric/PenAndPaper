import { Component, input, output } from '@angular/core';

import { Icon } from './icon';

/**
 * A window at the right side of the screen, over the page: it shows something
 * without leaving the page behind it. The page decides when it is there.
 */
@Component({
  selector: 'app-side-panel',
  imports: [Icon],
  template: `
    <div class="veil" (click)="closed.emit()"></div>
    <aside class="drawer" role="dialog" [class.drawer--wide]="wide()" [attr.aria-label]="title()">
      <header class="drawer__head">
        <h2 class="subtitle">{{ title() }}</h2>
        <div class="row">
          <ng-content select="[panelAction]" />
          <button type="button" class="btn btn--small" (click)="closed.emit()">
            <app-icon name="close" [size]="16" />
            Schließen
          </button>
        </div>
      </header>
      <ng-content />
    </aside>
  `,
  styles: `
    // One view for both screens: a panel on the right that never gets wider than the screen.
    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 41;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: min(520px, 100%);
      padding: 16px;
      overflow-y: auto;
      border-left: 1px solid var(--line);
      background: var(--bg);
    }

    .drawer--wide {
      width: min(720px, 100%);
    }

    .drawer__head {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }
  `,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class SidePanel {
  readonly title = input.required<string>();
  /** A wider window, for a whole character sheet. */
  readonly wide = input(false);
  readonly closed = output<void>();
}
