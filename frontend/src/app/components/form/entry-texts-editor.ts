import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Knowledge } from '../../core/models';
import { KnowledgeListEditor } from './knowledge-list-editor';

/**
 * Edit what an entry says, split by who may read it:
 * the description and the knowledge for players, and the knowledge only the game master has.
 */
@Component({
  selector: 'app-entry-texts-editor',
  imports: [FormsModule, KnowledgeListEditor],
  template: `
    <div class="panel">
      <div class="field">
        <label class="check">
          <input type="checkbox" [checked]="visibleFromStart()" (change)="visibleFromStartChange.emit($any($event.target).checked)" />
          Von Anfang an für Spieler sichtbar
        </label>
        <span class="soft">Gilt für neue Runden. In einer laufenden Runde schaltest du das Auge.</span>
      </div>
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
  `,
  styleUrl: './entry-texts-editor.scss',
})
export class EntryTextsEditor {
  /** Id of the description field, unique on the page. */
  readonly inputId = input('entry-description');
  readonly description = input.required<string>();
  /** Whether a new session shows the entry to its players right away. */
  readonly visibleFromStart = input(false);
  readonly visibleFromStartChange = output<boolean>();
  readonly playerKnowledge = input.required<Knowledge[]>();
  readonly gmKnowledge = input.required<Knowledge[]>();
  readonly descriptionChange = output<string>();
  readonly playerKnowledgeChange = output<Knowledge[]>();
  readonly gmKnowledgeChange = output<Knowledge[]>();
}
