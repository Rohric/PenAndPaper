import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Trivia } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { LinkPicker } from '../../shared/link-picker';
import { EntryEditor } from './entry-editor';

/** Edit one piece of knowledge and the entries it is attached to. */
@Component({
  selector: 'app-trivia-editor',
  imports: [FormsModule, EditorBar, LinkPicker],
  template: `
    <div class="stack">
      <div class="panel">
        <div class="field">
          <label for="trivia-name">Name</label>
          <input id="trivia-name" class="input input--title" [ngModel]="draft().name" (ngModelChange)="set('name', $event)" />
        </div>
        <div class="field">
          <label for="trivia-category">Kategorie</label>
          <input
            id="trivia-category"
            class="input"
            list="trivia-categories"
            placeholder="Zum Beispiel Tier, Gegenstand, Volk"
            [ngModel]="draft().category"
            (ngModelChange)="set('category', $event)"
          />
          <datalist id="trivia-categories">
            @for (category of categories(); track category) {
              <option [value]="category"></option>
            }
          </datalist>
        </div>
        <div class="field">
          <label for="trivia-text">Text</label>
          <textarea id="trivia-text" class="input" rows="12" [ngModel]="draft().text" (ngModelChange)="set('text', $event)"></textarea>
        </div>
        <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove(entry().name)" />
      </div>

      <div class="panel">
        <h2 class="subtitle">Gehört zu</h2>
        <div class="field">
          <span class="label">Orte</span>
          <app-link-picker label="Orte" [options]="store.locationOptions()" [selected]="draft().locations" (selectedChange)="set('locations', $event)" />
        </div>
        <div class="field">
          <span class="label">Figuren</span>
          <app-link-picker label="Figuren" [options]="store.npcOptions()" [selected]="draft().npcs" (selectedChange)="set('npcs', $event)" />
        </div>
        <div class="field">
          <span class="label">Quests</span>
          <app-link-picker label="Quests" [options]="store.questOptions()" [selected]="draft().quests" (selectedChange)="set('quests', $event)" />
        </div>
        <div class="field">
          <span class="label">Ereignisse</span>
          <app-link-picker label="Ereignisse" [options]="store.eventOptions()" [selected]="draft().events" (selectedChange)="set('events', $event)" />
        </div>
      </div>
    </div>
  `,
})
export class TriviaEditor extends EntryEditor<Trivia> {
  protected readonly kind = 'trivia' as const;

  /** The categories already used in this world, offered while typing. */
  protected readonly categories = computed(() => [...new Set(this.store.trivia().map((t) => t.category).filter(Boolean))].sort());
}
