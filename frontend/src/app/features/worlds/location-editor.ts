import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Location } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { IdSelect } from '../../shared/id-select';
import { EntryEditor } from './entry-editor';

/** Edit one location: its name, the place it lies in and its description. */
@Component({
  selector: 'app-location-editor',
  imports: [FormsModule, EditorBar, IdSelect],
  template: `
    <div class="panel">
      <div class="field">
        <label for="location-name">Name</label>
        <input id="location-name" class="input input--title" [ngModel]="draft().name" (ngModelChange)="set('name', $event)" />
      </div>
      <div class="field">
        <label for="location-parent">Liegt in</label>
        <app-id-select
          inputId="location-parent"
          emptyLabel="In keinem anderen Ort"
          [options]="parents()"
          [value]="draft().parent"
          (valueChange)="set('parent', $event)"
        />
      </div>
      <div class="field">
        <label for="location-lore">Beschreibung</label>
        <textarea id="location-lore" class="input" rows="12" [ngModel]="draft().lore" (ngModelChange)="set('lore', $event)"></textarea>
      </div>
      <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove(entry().name)" />
    </div>
  `,
})
export class LocationEditor extends EntryEditor<Location> {
  protected readonly kind = 'locations' as const;

  /** Every other place can be the parent. */
  protected readonly parents = computed(() => this.store.locationOptions().filter((o) => o.id !== this.entry().id));
}
