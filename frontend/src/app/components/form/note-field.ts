import { Component, input, output } from '@angular/core';

import { AutoGrow } from './auto-grow';

/**
 * The field "Notiz (nur für dich)" of every entry form: what the game master keeps for himself about the entry.
 * It belongs to the world, so it is there in every session as well; players never see it.
 */
@Component({
  selector: 'app-note-field',
  imports: [AutoGrow],
  template: `
    <div class="field">
      <label [for]="inputId()">Notiz (nur für dich)</label>
      <span class="soft">Nur du siehst sie, auch in jeder Runde.</span>
      <textarea
        class="input"
        rows="3"
        [id]="inputId()"
        [appAutoGrow]="value()"
        [value]="value()"
        (input)="valueChange.emit($any($event.target).value)"
        (change)="commit.emit($any($event.target).value)"
      ></textarea>
    </div>
  `,
})
export class NoteField {
  readonly inputId = input.required<string>();
  readonly value = input('');
  /** Fired with every key, for forms that save with their button or by themselves. */
  readonly valueChange = output<string>();
  /** Fired when the field is left after a change, for forms that save right away. */
  readonly commit = output<string>();
}
