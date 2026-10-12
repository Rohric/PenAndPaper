import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TimelineEntry } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { EntryEditor } from './entry-editor';

/** Edit one day of the timeline. */
@Component({
  selector: 'app-timeline-editor',
  imports: [FormsModule, EditorBar],
  template: `
    <div class="panel">
      <div class="field">
        <label for="timeline-title">Titel</label>
        <input id="timeline-title" class="input input--title" [ngModel]="draft().title" (ngModelChange)="set('title', $event)" />
      </div>
      <div class="field">
        <label for="timeline-day">Tag</label>
        <input
          id="timeline-day"
          class="input input--number"
          type="number"
          min="0"
          [ngModel]="draft().day"
          (ngModelChange)="setNumber('day', $event)"
        />
      </div>
      <div class="field">
        <label for="timeline-text">Was an diesem Tag passiert</label>
        <textarea id="timeline-text" class="input" rows="8" [ngModel]="draft().text" (ngModelChange)="set('text', $event)"></textarea>
      </div>
      <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove(entry().title)" />
    </div>
  `,
})
export class TimelineEditor extends EntryEditor<TimelineEntry> {
  protected readonly kind = 'timeline' as const;
}
