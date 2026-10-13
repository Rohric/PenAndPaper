import { Component, inject, input, model, output } from '@angular/core';

import { Icon } from '../basic/icon';
import { WindowStack } from './window-stack';

/** One tab of a window. */
export interface WindowTab {
  id: string;
  label: string;
  /** A number on the tab; nothing is shown for 0 or null. */
  count?: number | null;
}

/**
 * The head every window shares: the arrows through what the window showed, the kind and the title, the buttons
 * of the window with "close" at the right, and a small row of tabs when the window has more than one part.
 * Escape closes the window on top, Alt with an arrow goes back and forward.
 */
@Component({
  selector: 'app-window-head',
  imports: [Icon],
  template: `
    <header class="head">
      @if (canBack() || canForward()) {
        <div class="head__arrows">
          <button type="button" class="btn btn--small" aria-label="Zurück" title="Zurück (Alt + Pfeil links)" [disabled]="!canBack()" (click)="back.emit()">
            <app-icon name="back" [size]="14" />
          </button>
          <button type="button" class="btn btn--small" aria-label="Vor" title="Vor (Alt + Pfeil rechts)" [disabled]="!canForward()" (click)="forward.emit()">
            <app-icon name="right" [size]="14" />
          </button>
        </div>
      }
      <div class="head__title">
        @if (kind()) {
          <span [class]="'kicker ' + tone()">{{ kind() }}</span>
        }
        <strong class="head__name">{{ title() }}</strong>
      </div>
      <div class="head__actions">
        <ng-content />
        <button type="button" class="btn btn--small" aria-label="Schließen" title="Schließen (Esc)" (click)="closed.emit()">
          <app-icon name="close" [size]="14" />
        </button>
      </div>
    </header>
    @if (tabs().length > 1) {
      <nav class="tabs head__tabs" aria-label="Teile des Fensters">
        @for (item of tabs(); track item.id) {
          <button type="button" class="tabs__tab" [class.is-active]="item.id === tab()" [attr.aria-current]="item.id === tab() ? 'true' : null" (click)="tab.set(item.id)">
            {{ item.label }}
            @if (item.count) {
              <span class="chip">{{ item.count }}</span>
            }
          </button>
        }
      </nav>
    }
  `,
  styleUrl: './window-head.scss',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class WindowHead {
  private readonly stack = inject(WindowStack);

  readonly title = input.required<string>();
  /** The kind of what is shown, like "Quest"; it stands before the title. */
  readonly kind = input('');
  /** The colour class of the kind, like "kind--quests". */
  readonly tone = input('');
  readonly tabs = input<WindowTab[]>([]);
  readonly tab = model('');
  readonly canBack = input(false);
  readonly canForward = input(false);
  readonly back = output<void>();
  readonly forward = output<void>();
  readonly closed = output<void>();

  constructor() {
    this.stack.enter(this);
  }

  /** Follow the keys of the window, but only while it is the one on top. */
  protected onKey(event: KeyboardEvent): void {
    if (!this.stack.isTop(this)) {
      return;
    }
    if (event.key === 'Escape') {
      this.closed.emit();
    } else if (event.altKey && event.key === 'ArrowLeft' && this.canBack()) {
      event.preventDefault();
      this.back.emit();
    } else if (event.altKey && event.key === 'ArrowRight' && this.canForward()) {
      event.preventDefault();
      this.forward.emit();
    }
  }
}
