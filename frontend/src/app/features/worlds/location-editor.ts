import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Location, Option } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { IdSelect } from '../../shared/id-select';
import { EntryEditor } from './entry-editor';
import { EntryLinks } from './entry-links';

/** Edit one location and see what lies there. */
@Component({
  selector: 'app-location-editor',
  imports: [FormsModule, EditorBar, IdSelect, EntryLinks],
  template: `
    <div class="stack">
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
          <textarea id="location-lore" class="input" rows="8" [ngModel]="draft().lore" (ngModelChange)="set('lore', $event)"></textarea>
        </div>
        <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove(entry().name)" />
      </div>

      <div class="panel">
        <h2 class="subtitle">Was hier liegt</h2>
        <app-entry-links label="Orte darin" section="locations" [items]="children()" />
        <app-entry-links label="Figuren" section="npcs" [items]="npcs()" />
        <app-entry-links label="Quests" section="quests" [items]="quests()" />
        <app-entry-links label="Ereignisse" section="events" [items]="events()" />
        @if (isEmpty()) {
          <p class="soft">Noch nichts mit diesem Ort verknüpft.</p>
        }
      </div>
    </div>
  `,
})
export class LocationEditor extends EntryEditor<Location> {
  protected readonly kind = 'locations' as const;

  /** Every other place can be the parent. */
  protected readonly parents = computed(() => this.store.locationOptions().filter((o) => o.id !== this.entry().id));
  protected readonly children = computed(() => this.here(this.store.locations().filter((l) => l.parent === this.entry().id)));
  protected readonly npcs = computed(() => this.here(this.store.npcs().filter((n) => n.location === this.entry().id)));
  protected readonly quests = computed(() => this.here(this.store.quests().filter((q) => q.location === this.entry().id)));
  protected readonly events = computed(() => this.here(this.store.events().filter((e) => e.location === this.entry().id)));
  protected readonly isEmpty = computed(
    () => !this.children().length && !this.npcs().length && !this.quests().length && !this.events().length,
  );

  private here(entries: { id: number; name: string }[]): Option[] {
    return entries.map((entry) => ({ id: entry.id, label: entry.name }));
  }
}
