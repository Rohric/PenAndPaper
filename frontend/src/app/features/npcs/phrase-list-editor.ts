import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Phrase } from '../../core/models';

/** Edit the example phrases of an NPC: what makes the NPC say it, and the phrase itself. */
@Component({
  selector: 'app-phrase-list-editor',
  imports: [FormsModule],
  template: `
    @for (phrase of phrases(); track $index) {
      <div class="phrase">
        <input
          class="input"
          placeholder="Auslöser, z. B. Spieler fragen nach dem Weg"
          [attr.aria-label]="'Auslöser von Satz ' + ($index + 1)"
          [ngModel]="phrase.trigger"
          (ngModelChange)="change($index, 'trigger', $event)"
        />
        <div class="list-row">
          <input
            class="input"
            placeholder="Was die Figur sagt"
            [attr.aria-label]="'Satz ' + ($index + 1)"
            [ngModel]="phrase.text"
            (ngModelChange)="change($index, 'text', $event)"
          />
          <button type="button" class="btn btn--small" [attr.aria-label]="'Satz ' + ($index + 1) + ' entfernen'" (click)="remove($index)">
            Entfernen
          </button>
        </div>
      </div>
    }
    <button type="button" class="btn btn--small add" (click)="add()">+ Satz</button>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .phrase {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .add {
      align-self: flex-start;
    }
  `,
})
export class PhraseListEditor {
  readonly phrases = input.required<Phrase[]>();
  readonly phrasesChange = output<Phrase[]>();

  /** Replace trigger or text of one phrase. */
  protected change(index: number, key: keyof Phrase, value: string): void {
    this.phrasesChange.emit(this.phrases().map((phrase, i) => (i === index ? { ...phrase, [key]: value } : phrase)));
  }

  /** Append an empty phrase. */
  protected add(): void {
    this.phrasesChange.emit([...this.phrases(), { trigger: '', text: '' }]);
  }

  /** Remove one phrase. */
  protected remove(index: number): void {
    this.phrasesChange.emit(this.phrases().filter((_, i) => i !== index));
  }
}
