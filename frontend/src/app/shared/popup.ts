import { Component, ElementRef, afterNextRender, inject, input, output, signal } from '@angular/core';

import { Icon } from './icon';

const MARGIN = 8;
const GAP = 10;

/**
 * A surface that opens above the symbol that was clicked, without leaving the page. It closes with Escape,
 * with a click beside it or with a second click on the symbol. The page decides which one is open.
 */
@Component({
  selector: 'app-popup',
  imports: [Icon],
  template: `
    <div class="popup" role="dialog" [attr.aria-label]="title()" [style.left.px]="left()" [style.bottom.px]="bottom()" [style.width.px]="width()">
      <header class="popup__head">
        <strong>{{ title() }}</strong>
        <button type="button" class="btn btn--small" aria-label="Schließen" (click)="closed.emit()"><app-icon name="close" [size]="14" /></button>
      </header>
      <div class="popup__body"><ng-content /></div>
    </div>
  `,
  styles: `
    .popup {
      position: fixed;
      z-index: 45;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: min(70vh, 620px);
      padding: 12px 14px;
      border: 1px solid var(--line-2);
      border-radius: var(--radius);
      background: var(--bg);
      box-shadow: 0 10px 34px rgb(0 0 0 / 0.35);
    }

    .popup__head {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }

    .popup__body {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
    }
  `,
  host: {
    '(document:keydown.escape)': 'closed.emit()',
    '(document:mousedown)': 'outside($event)',
    '(window:resize)': 'place()',
  },
})
export class Popup {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly title = input.required<string>();
  /** The symbol the popup belongs to; it opens above it, and a click on it is not a click beside the popup. */
  readonly anchor = input<HTMLElement | null>(null);
  /** The width in pixels the popup tries to have. */
  readonly size = input(560);
  readonly closed = output<void>();

  protected readonly left = signal(MARGIN);
  protected readonly bottom = signal(80);
  protected readonly width = signal(560);

  constructor() {
    afterNextRender(() => this.place());
  }

  /** Put the popup over its symbol, kept inside the window. */
  protected place(): void {
    const width = Math.min(this.size(), window.innerWidth - 2 * MARGIN);
    const box = this.anchor()?.getBoundingClientRect();
    const middle = box ? box.left + box.width / 2 : window.innerWidth / 2;
    this.width.set(width);
    this.left.set(Math.max(MARGIN, Math.min(middle - width / 2, window.innerWidth - width - MARGIN)));
    this.bottom.set(box ? window.innerHeight - box.top + GAP : 80);
  }

  protected outside(event: MouseEvent): void {
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target) && !this.anchor()?.contains(target)) {
      this.closed.emit();
    }
  }
}
