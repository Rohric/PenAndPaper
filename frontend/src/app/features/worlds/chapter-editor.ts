import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Chapter } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { EntryEditor } from './entry-editor';

/** Edit what a chapter says about itself: name, number, the text of its thread and what is read aloud. */
@Component({
  selector: 'app-chapter-editor',
  imports: [FormsModule, EditorBar],
  template: `
    <div class="panel">
      <div class="grid-fields">
        <div class="field">
          <label for="chapter-name">Name</label>
          <input id="chapter-name" class="input input--title" [ngModel]="draft().name" (ngModelChange)="set('name', $event)" />
        </div>
        <div class="field">
          <label for="chapter-number">Kapitel-Nummer</label>
          <input
            id="chapter-number"
            class="input input--number"
            type="number"
            min="1"
            [ngModel]="draft().number"
            (ngModelChange)="setChapterNumber($event)"
          />
        </div>
      </div>
      <div class="field">
        <label for="chapter-text">Worum es in diesem Kapitel geht</label>
        <textarea id="chapter-text" class="input" rows="14" [ngModel]="draft().text" (ngModelChange)="set('text', $event)"></textarea>
      </div>
      <div class="field">
        <label for="chapter-read">Zum Vorlesen</label>
        <textarea id="chapter-read" class="input" rows="5" [ngModel]="draft().to_read" (ngModelChange)="set('to_read', $event)"></textarea>
      </div>
      <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove(entry().name)" />
    </div>
  `,
})
export class ChapterEditor extends EntryEditor<Chapter> {
  protected readonly kind = 'chapters' as const;

  /** Change the chapter number; it starts at 1. */
  protected setChapterNumber(value: number | null): void {
    this.set('number', Math.max(1, Math.floor(value ?? 1)));
  }
}
