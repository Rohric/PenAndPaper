import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Option } from '../../core/models';

/** Pick one entry from a list, or none. */
@Component({
  selector: 'app-id-select',
  imports: [FormsModule],
  template: `
    <select class="input" [id]="inputId()" [ngModel]="value()" (ngModelChange)="valueChange.emit($event)">
      <option [ngValue]="null">{{ emptyLabel() }}</option>
      @for (option of options(); track option.id) {
        <option [ngValue]="option.id">{{ option.label }}</option>
      }
    </select>
  `,
})
export class IdSelect {
  readonly options = input.required<Option[]>();
  readonly value = input<number | null>(null);
  /** Id of the select, so a label can point to it. */
  readonly inputId = input.required<string>();
  readonly emptyLabel = input('Keine Auswahl');
  readonly valueChange = output<number | null>();
}
