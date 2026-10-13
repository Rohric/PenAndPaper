import { Component, inject, input, model, output } from '@angular/core';

import { WindowHead, WindowTab } from './window-head';
import { WindowStack } from './window-stack';

/**
 * A small window for a short look and short actions. It always stands in the middle of the screen; the page
 * behind it is a little darker and does not scroll. It closes with Escape, with its button or with a click beside it.
 */
@Component({
  selector: 'app-popup',
  imports: [WindowHead],
  template: `
    <div class="shade" (click)="closed.emit()"></div>
    <section class="popup" role="dialog" aria-modal="true" [attr.aria-label]="title()" [style.--popup-width.px]="size()">
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
      />
      <div class="popup__body"><ng-content /></div>
      <footer class="popup__foot"><ng-content select="[windowFoot]" /></footer>
    </section>
  `,
  styleUrl: './popup.scss',
})
export class Popup {
  readonly title = input.required<string>();
  readonly kind = input('');
  readonly tone = input('');
  /** The width in pixels the popup tries to have; it never gets wider than the screen. */
  readonly size = input(560);
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
