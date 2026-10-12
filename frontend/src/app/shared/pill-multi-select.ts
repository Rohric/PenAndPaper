import { Component, input, output } from '@angular/core';

import { Option } from '../core/models';

/** Pick any number of entries from a list by switching pills on and off. */
@Component({
  selector: 'app-pill-multi-select',
  template: `
    <div class="row" role="group" [attr.aria-label]="label()">
      @for (option of options(); track option.id) {
        <button type="button" class="pill" [attr.aria-pressed]="selected().includes(option.id)" (click)="toggle(option.id)">
          {{ option.label }}
        </button>
      } @empty {
        <span class="soft">{{ emptyText() }}</span>
      }
    </div>
  `,
})
export class PillMultiSelect {
  readonly options = input.required<Option[]>();
  readonly selected = input.required<number[]>();
  readonly label = input('');
  /** Shown when there is nothing to choose from yet. */
  readonly emptyText = input('Noch nichts zur Auswahl.');
  readonly selectedChange = output<number[]>();

  /** Add the entry to the selection or take it out. */
  protected toggle(id: number): void {
    const selected = this.selected();
    this.selectedChange.emit(selected.includes(id) ? selected.filter((other) => other !== id) : [...selected, id]);
  }
}
