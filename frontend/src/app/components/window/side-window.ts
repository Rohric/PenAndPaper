import { Component, input, model, output } from '@angular/core';

import { WindowHead, WindowTab } from './window-head';

/**
 * A window at the right side of the screen for reading and editing; the page behind it stays in view.
 * On the phone it fills the whole screen. The page decides when it is there.
 */
@Component({
  selector: 'app-side-window',
  imports: [WindowHead],
  template: `
    <div class="veil" (click)="closed.emit()"></div>
    <aside class="side" role="dialog" [class.side--wide]="wide()" [attr.aria-label]="title()">
      <app-window-head
        [title]="title()"
        [kind]="kind()"
        [tone]="tone()"
        [tabs]="tabs()"
        [(tab)]="tab"
        [canBack]="canBack()"
        [canForward]="canForward()"
        (back)="back.emit()"
        (forward)="forward.emit()"
        (closed)="closed.emit()"
      >
        <ng-content select="[windowAction]" />
      </app-window-head>
      <div class="side__body"><ng-content /></div>
      <footer class="side__foot"><ng-content select="[windowFoot]" /></footer>
    </aside>
  `,
  styleUrl: './side-window.scss',
})
export class SideWindow {
  readonly title = input.required<string>();
  readonly kind = input('');
  readonly tone = input('');
  /** A wider window, for a whole character sheet or a form. */
  readonly wide = input(false);
  readonly tabs = input<WindowTab[]>([]);
  readonly tab = model('');
  readonly canBack = input(false);
  readonly canForward = input(false);
  readonly back = output<void>();
  readonly forward = output<void>();
  readonly closed = output<void>();
}
