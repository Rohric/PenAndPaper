import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Option } from '../../core/models';
import { WorldStore } from './world-store';

/** A labelled row of links to other entries of the world; it shows nothing when the list is empty. */
@Component({
  selector: 'app-entry-links',
  imports: [RouterLink],
  template: `
    @if (items().length) {
      <div class="field">
        <span class="label">{{ label() }}</span>
        <div class="row">
          @for (item of items(); track item.id) {
            <a class="chip chip--link" [routerLink]="['/gm/worlds', store.worldId(), section()]" [queryParams]="{ entry: item.id }">
              {{ item.label }}
            </a>
          }
        </div>
      </div>
    }
  `,
})
export class EntryLinks {
  protected readonly store = inject(WorldStore);

  readonly label = input.required<string>();
  /** Section of the world the links lead to, for example "quests". */
  readonly section = input.required<string>();
  readonly items = input.required<Option[]>();
}
