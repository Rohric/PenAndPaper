import { Component, input, output } from '@angular/core';

import { Icon } from '../basic/icon';

/**
 * A small eye in front of a part of an entry: open in the accent colour when the players see it,
 * struck through and dim when they do not. It is faded when the whole entry is still hidden.
 */
@Component({
  selector: 'app-eye',
  imports: [Icon],
  template: `
    <button
      type="button"
      class="eye"
      [class.eye--on]="shown()"
      [class.eye--faded]="faded()"
      [attr.aria-pressed]="shown()"
      [attr.aria-label]="label() + (shown() ? ': Spieler sehen es, tippen zum Verbergen' : ': verborgen, tippen zum Zeigen')"
      (click)="$event.stopPropagation(); toggle.emit()"
    >
      <app-icon [name]="shown() ? 'eye' : 'eye-off'" [size]="size()" />
    </button>
  `,
  styleUrl: './eye-toggle.scss',
})
export class EyeToggle {
  /** Whether the players see this part. */
  readonly shown = input.required<boolean>();
  /** What the eye is for, for screen readers. */
  readonly label = input.required<string>();
  /** Dimmed because the entry itself is hidden, so the eye has no effect yet. */
  readonly faded = input(false);
  readonly size = input(16);
  readonly toggle = output<void>();
}
