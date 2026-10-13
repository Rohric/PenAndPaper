import { Component, inject, input, model, output } from '@angular/core';

import { WindowHead, WindowTab } from './window-head';
import { WindowStack } from './window-stack';

/**
 * A large window in the middle of the screen that interrupts: a tutorial, or the form for something new.
 * The page behind it is dark and does not scroll. A click beside it does not close it, so nothing typed gets lost.
 */
@Component({
  selector: 'app-dialog',
  imports: [WindowHead],
  template: `
    <div class="veil"></div>
    <section class="dialog" role="dialog" aria-modal="true" [attr.aria-label]="title()" [style.--dialog-width.px]="size()">
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
      <div class="dialog__body"><ng-content /></div>
      <footer class="dialog__foot"><ng-content select="[windowFoot]" /></footer>
    </section>
  `,
  styleUrl: './dialog.scss',
})
export class Dialog {
  readonly title = input.required<string>();
  readonly kind = input('');
  readonly tone = input('');
  /** A width in pixels for a small dialog; without one the dialog is as wide as the area allows. */
  readonly size = input<number | null>(null);
  readonly tabs = input<WindowTab[]>([]);
  readonly tab = model('');
  readonly canBack = input(false);
  readonly canForward = input(false);
  readonly back = output<void>();
  readonly forward = output<void>();
  readonly closed = output<void>();

  constructor() {
    inject(WindowStack).cover();
  }
}
