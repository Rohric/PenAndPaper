import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SpecialAbility } from '../../core/models';

/** Edit the special abilities of a character: a name, what it does, and when its roll is due. */
@Component({
  selector: 'app-special-ability-list-editor',
  imports: [FormsModule],
  template: `
    @for (ability of abilities(); track $index) {
      <div class="ability">
        <div class="list-row">
          <input
            class="input"
            placeholder="Name"
            [attr.aria-label]="'Name von Fähigkeit ' + ($index + 1)"
            [ngModel]="ability.name"
            (ngModelChange)="change($index, 'name', $event)"
          />
          <button type="button" class="btn btn--small" [attr.aria-label]="'Fähigkeit ' + ($index + 1) + ' entfernen'" (click)="remove($index)">
            Entfernen
          </button>
        </div>
        <input
          class="input"
          placeholder="Wurf-Bedingung, z. B. Probe auf Handeln"
          [attr.aria-label]="'Wurf-Bedingung von Fähigkeit ' + ($index + 1)"
          [ngModel]="ability.roll_condition"
          (ngModelChange)="change($index, 'roll_condition', $event)"
        />
        <textarea
          class="input"
          rows="2"
          placeholder="Was die Fähigkeit bewirkt"
          [attr.aria-label]="'Beschreibung von Fähigkeit ' + ($index + 1)"
          [ngModel]="ability.description"
          (ngModelChange)="change($index, 'description', $event)"
        ></textarea>
      </div>
    }
    <button type="button" class="btn btn--small add" (click)="add()">+ Besondere Fähigkeit</button>
  `,
  styleUrl: './special-ability-list-editor.scss',
})
export class SpecialAbilityListEditor {
  readonly abilities = input.required<SpecialAbility[]>();
  readonly abilitiesChange = output<SpecialAbility[]>();

  /** Replace one field of one ability. */
  protected change(index: number, key: keyof SpecialAbility, value: string): void {
    this.abilitiesChange.emit(this.abilities().map((ability, i) => (i === index ? { ...ability, [key]: value } : ability)));
  }

  /** Append an empty ability. */
  protected add(): void {
    this.abilitiesChange.emit([...this.abilities(), { name: '', description: '', roll_condition: '' }]);
  }

  /** Remove one ability. */
  protected remove(index: number): void {
    this.abilitiesChange.emit(this.abilities().filter((_, i) => i !== index));
  }
}
