import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WorldEvent } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { IdSelect } from '../../shared/id-select';
import { EntryEditor } from './entry-editor';
import { EventScenes } from './event-scenes';

/** Edit one event, the place where it happens and, if wanted, the scenes it hangs on. */
@Component({
  selector: 'app-event-editor',
  imports: [FormsModule, EditorBar, IdSelect, EventScenes],
  template: `
    <div class="stack">
      <div class="panel">
        <div class="field">
          <label for="event-name">Name</label>
          <input id="event-name" class="input input--title" [ngModel]="draft().name" (ngModelChange)="set('name', $event)" />
        </div>
        <div class="field">
          <label for="event-text">Was passiert</label>
          <textarea id="event-text" class="input" rows="8" [ngModel]="draft().text" (ngModelChange)="set('text', $event)"></textarea>
        </div>
        <div class="field">
          <label for="event-location">Ort</label>
          <app-id-select
            inputId="event-location"
            emptyLabel="Kein Ort"
            [options]="store.locationOptions()"
            [value]="draft().location"
            (valueChange)="set('location', $event)"
          />
        </div>
        <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove(entry().name)" />
      </div>

      <div class="panel">
        <h2 class="subtitle">Hängt an Szenen</h2>
        <p class="soft">Freiwillig: Ein Ereignis kann an Szenen hängen oder frei bleiben. Das wird sofort gespeichert.</p>
        <app-event-scenes [eventId]="entry().id" />
      </div>
    </div>
  `,
})
export class EventEditor extends EntryEditor<WorldEvent> {
  protected readonly kind = 'events' as const;
}
