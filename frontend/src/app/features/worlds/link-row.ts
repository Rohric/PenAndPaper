import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { EntryLink } from '../../core/models';
import { openEntry } from './entry-views';
import { WorldStore } from './world-store';

/** A labelled row of names that lead to other entries; it shows nothing when the list is empty. */
@Component({
  selector: 'app-link-row',
  template: `
    @if (items().length) {
      <div class="field">
        <span class="label">{{ label() }}</span>
        <div class="row">
          @for (item of items(); track item.kind + item.id) {
            <button type="button" class="chip chip--link" (click)="open(item)">{{ item.label }}</button>
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

  /** Look the entry up, or go to it when it is a scene or a chapter. */
  protected open(item: EntryLink): void {
    openEntry(this.store, this.router, item);
  }
}
