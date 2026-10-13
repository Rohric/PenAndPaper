import { Component, input, output } from '@angular/core';

import { EntryLink } from '../../core/models';
import { EyeToggle } from './eye-toggle';
import { EntryCard } from './entry-card';

/** A labelled row of tags that lead to other entries; it shows nothing when the list is empty. */
@Component({
  selector: 'app-link-row',
  imports: [EyeToggle, EntryCard],
  template: `
    @if (items().length) {
      <div class="field">
        <span class="label">
          @if (eye() !== null) {
            <app-eye [shown]="eye() === true" [label]="label()" [faded]="faded()" (toggle)="eyeToggle.emit()" />
          }
          {{ label() }}
        </span>
        <div class="row">
          @for (item of items(); track item.kind + item.id) {
            <app-entry-card size="tag" [ref]="item" [label]="item.label" [tone]="item.tone ?? ''" />
          }
        </div>
      </div>
    }
  `,
})
export class LinkRow {
  readonly label = input.required<string>();
  readonly items = input.required<EntryLink[]>();
  /** Whether the players see this row; null when there is no eye (writing the world). */
  readonly eye = input<boolean | null>(null);
  readonly faded = input(false);
  readonly eyeToggle = output<void>();
}
