import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** Edit a list of short texts: one line per entry, with add and remove. */
@Component({
  selector: 'app-string-list-editor',
  imports: [FormsModule],
  template: `
    @for (item of items(); track $index) {
      <div class="list-row">
        <input
          class="input"
          [attr.aria-label]="label() + ' ' + ($index + 1)"
          [placeholder]="placeholder()"
          [ngModel]="item"
          (ngModelChange)="change($index, $event)"
        />
        <button type="button" class="btn btn--small" [attr.aria-label]="label() + ' ' + ($index + 1) + ' entfernen'" (click)="remove($index)">
          Entfernen
        </button>
      </div>
    }
    <button type="button" class="btn btn--small add" (click)="add()">+ {{ label() }}</button>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .add {
      align-self: flex-start;
    }
  `,
})
export class StringListEditor {
  readonly items = input.required<string[]>();
  /** Name of one entry, used for the add button and for screen readers. */
  readonly label = input('Eintrag');
  readonly placeholder = input('');
  readonly itemsChange = output<string[]>();

  /** Replace the text of one entry. */
  protected change(index: number, value: string): void {
    this.itemsChange.emit(this.items().map((item, i) => (i === index ? value : item)));
  }

  /** Append an empty entry. */
  protected add(): void {
    this.itemsChange.emit([...this.items(), '']);
  }

  /** Remove one entry. */
  protected remove(index: number): void {
    this.itemsChange.emit(this.items().filter((_, i) => i !== index));
  }
}
