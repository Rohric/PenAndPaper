import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { EntryLink } from '../../core/models';
import { EyeToggle } from './eye-toggle';
import { openEntry } from './entry-views';
import { WorldStore } from '../../core/world-store';

/** A labelled row of names that lead to other entries; it shows nothing when the list is empty. */
@Component({
  selector: 'app-link-row',
  imports: [EyeToggle],
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
            <button type="button" [class]="'chip chip--link kind--' + (item.tone ?? item.kind)" (click)="open(item)">
              {{ item.label }}
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class LinkRow {
  private readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  readonly label = input.required<string>();
  readonly items = input.required<EntryLink[]>();
  /** Whether the players see this row; null when there is no eye (writing the world). */
  readonly eye = input<boolean | null>(null);
  readonly faded = input(false);
  readonly eyeToggle = output<void>();

  /** Look the entry up, or go to it when it is a scene or a chapter. */
  protected open(item: EntryLink): void {
    openEntry(this.store, this.router, item);
  }
}
