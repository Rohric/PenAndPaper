import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Chapter } from '../../core/models';
import { CategoryField } from '../../components/form/category-field';
import { EditorBar } from '../../components/form/editor-bar';
import { NoteField } from '../../components/form/note-field';
import { EntryEditor } from '../glossary/entry-editor';

/** Edit what a chapter says about itself: name, number, category, the text of its thread, what is read aloud and the note. */
@Component({
  selector: 'app-chapter-editor',
  imports: [FormsModule, CategoryField, EditorBar, NoteField],
  template: `
    <div class="stack">
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
        <app-category-field inputId="chapter-category" kind="chapters" placeholder="Zum Beispiel Erster Akt" [value]="draft().category" (valueChange)="set('category', $event)" />
        <app-editor-bar [dirty]="dirty()" [busy]="busy()" (save)="save()" (remove)="remove(entry().name)" />
      </div>

      <div class="panel">
        <div class="field">
          <label for="chapter-text">Worum es in diesem Kapitel geht</label>
          <textarea id="chapter-text" class="input" rows="14" [ngModel]="draft().description" (ngModelChange)="set('description', $event)"></textarea>
        </div>
        <div class="field">
          <label for="chapter-read">Zum Vorlesen</label>
          <textarea id="chapter-read" class="input" rows="5" [ngModel]="draft().to_read" (ngModelChange)="set('to_read', $event)"></textarea>
        </div>
      </div>

      <div class="panel">
        <app-note-field inputId="chapter-note" [value]="draft().note" (valueChange)="set('note', $event)" />
      </div>
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
