import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Knowledge } from '../../core/models';

/** Edit a list of knowledge pieces: each one a text with an optional title. */
@Component({
  selector: 'app-knowledge-list-editor',
  imports: [FormsModule],
  template: `
    @for (piece of pieces(); track $index) {
      <div class="piece">
        <div class="list-row">
          <input
            class="input"
            placeholder="Titel (freiwillig)"
            [attr.aria-label]="'Titel von Stück ' + ($index + 1)"
            [ngModel]="piece.title"
            (ngModelChange)="change($index, 'title', $event)"
          />
          <button type="button" class="btn btn--small" [attr.aria-label]="'Stück ' + ($index + 1) + ' entfernen'" (click)="remove($index)">
            Entfernen
          </button>
        </div>
        <textarea
          class="input"
          rows="3"
          [attr.aria-label]="'Text von Stück ' + ($index + 1)"
          [ngModel]="piece.text"
          (ngModelChange)="change($index, 'text', $event)"
        ></textarea>
      </div>
    }
    <button type="button" class="btn btn--small add" (click)="add()">+ Stück Wissen</button>
  `,
  styleUrl: './knowledge-list-editor.scss',
})
export class KnowledgeListEditor {
  readonly pieces = input.required<Knowledge[]>();
  readonly piecesChange = output<Knowledge[]>();

  /** Replace title or text of one piece. */
  protected change(index: number, key: keyof Knowledge, value: string): void {
    this.piecesChange.emit(this.pieces().map((piece, i) => (i === index ? { ...piece, [key]: value } : piece)));
  }

  /** Append an empty piece. */
  protected add(): void {
    this.piecesChange.emit([...this.pieces(), { title: '', text: '' }]);
  }

  /** Remove one piece. */
  protected remove(index: number): void {
    this.piecesChange.emit(this.pieces().filter((_, i) => i !== index));
  }
}
