import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Knowledge } from '../../core/models';
import { KnowledgeListEditor } from './knowledge-list-editor';
import { NoteField } from './note-field';

/**
 * Edit what an entry says, split by who may read it, in the order every form shares: whether players see it from
 * the start, the description, the own texts of the kind (put inside this element), the knowledge for players, the
 * knowledge only the game master has and, when the form passes one, his note.
 */
@Component({
  selector: 'app-entry-texts-editor',
  imports: [FormsModule, KnowledgeListEditor, NoteField],
  template: `
    <div class="panel">
      @if (startChoice()) {
        <div class="field">
          <label class="check">
            <input type="checkbox" [checked]="visibleFromStart()" (change)="visibleFromStartChange.emit($any($event.target).checked)" />
            Von Anfang an für Spieler sichtbar
          </label>
          <span class="soft">Gilt für neue Runden. In einer laufenden Runde schaltest du das Auge.</span>
        </div>
      }
      <div class="field">
        <label [for]="inputId()">Beschreibung</label>
        <span class="soft">Sehen die Spieler, sobald du den Eintrag in einer Runde freigibst.</span>
        <textarea
          class="input"
          rows="6"
          [id]="inputId()"
          [ngModel]="description()"
          (ngModelChange)="descriptionChange.emit($event)"
        ></textarea>
      </div>
    </div>

    <ng-content />

    <div class="panel">
      <h2 class="subtitle">Wissen für Spieler</h2>
      <p class="soft">Was die Spieler herausfinden können. In der Runde gibst du es Stück für Stück frei.</p>
      <app-knowledge-list-editor [pieces]="playerKnowledge()" (piecesChange)="playerKnowledgeChange.emit($event)" />
    </div>

    <div class="panel">
      <h2 class="subtitle">Wissen nur für dich</h2>
      <p class="soft">Geheimnisse, Hintergründe, wie du es spielst. Das sehen die Spieler nie.</p>
      <app-knowledge-list-editor [pieces]="gmKnowledge()" (piecesChange)="gmKnowledgeChange.emit($event)" />
    </div>

    @if (note() !== null) {
      <div class="panel">
        <app-note-field [inputId]="inputId() + '-note'" [value]="note() ?? ''" (valueChange)="noteChange.emit($event)" />
      </div>
    }
  `,
  styleUrl: './entry-texts-editor.scss',
})
export class EntryTextsEditor {
  /** Id of the description field, unique on the page; the note field adds "-note". */
  readonly inputId = input('entry-description');
  readonly description = input.required<string>();
  /** Whether a new session shows the entry to its players right away. */
  readonly visibleFromStart = input(false);
  /** Whether the choice is offered at all; an entry a round made up has no new sessions, it plays in its own. */
  readonly startChoice = input(true);
  readonly visibleFromStartChange = output<boolean>();
  readonly playerKnowledge = input.required<Knowledge[]>();
  readonly gmKnowledge = input.required<Knowledge[]>();
  /** The note of the game master; null leaves the field out, for forms that keep it elsewhere. */
  readonly note = input<string | null>(null);
  readonly descriptionChange = output<string>();
  readonly playerKnowledgeChange = output<Knowledge[]>();
  readonly gmKnowledgeChange = output<Knowledge[]>();
  readonly noteChange = output<string>();
}
