import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Trivia } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { EntryTextsEditor } from '../../shared/entry-texts-editor';
import { LinkPicker } from '../../shared/link-picker';
import { SymbolPicker } from '../../shared/symbol-picker';
import { tagColour } from '../../shared/tag-colour';
import { EntryEditor } from './entry-editor';

/** Edit one piece of knowledge and the entries it is attached to. */
@Component({
  selector: 'app-trivia-editor',
  imports: [FormsModule, EditorBar, LinkPicker, SymbolPicker, EntryTextsEditor],
  template: `
    <div class="stack">
      <div class="panel">
        <div class="field">
          <label for="trivia-name">Name</label>
          <input id="trivia-name" class="input input--title" [ngModel]="draft().name" (ngModelChange)="set('name', $event)" />
        </div>
        <div class="field">
          <span class="label">Symbol</span>
          <app-symbol-picker fallback="note" [value]="draft().symbol" (valueChange)="set('symbol', $event)" />
        </div>
        <div class="field">
          <label for="trivia-category">Kategorie <span class="dot" [style.--kind]="colour()"></span></label>
          <span class="soft">Im Glossar filterst du nach der Kategorie; jede hat ihre eigene Farbe.</span>
          <input
            id="trivia-category"
            class="input"
            list="trivia-categories"
            placeholder="Zum Beispiel Tier, Volk. „Gegenstand“ macht den Eintrag zu einem Gegenstand"
            [ngModel]="draft().category"
            (ngModelChange)="set('category', $event)"
          />
          <datalist id="trivia-categories">
            @for (category of categories(); track category) {
              <option [value]="category"></option>
            }
          </datalist>
        </div>
        <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove(entry().name)" />
      </div>

      <app-entry-texts-editor
        inputId="trivia-description"
        [description]="draft().description"
        [playerKnowledge]="draft().player_knowledge"
        [gmKnowledge]="draft().gm_knowledge"
        (descriptionChange)="set('description', $event)"
        (playerKnowledgeChange)="set('player_knowledge', $event)"
        (gmKnowledgeChange)="set('gm_knowledge', $event)"
      />

      <div class="panel">
        <h2 class="subtitle">Gehört zu</h2>
        <div class="field">
          <span class="label">Orte</span>
          <app-link-picker
            label="Orte"
            [creatable]="true"
            [options]="store.locationOptions()"
            [selected]="draft().locations"
            (selectedChange)="set('locations', $event)"
            (create)="createLinked('locations', 'locations', $event)"
            (look)="lookUp('locations', $event)"
          />
        </div>
        <div class="field">
          <span class="label">Figuren</span>
          <app-link-picker
            label="Figuren"
            [creatable]="true"
            [options]="store.npcOptions()"
            [selected]="draft().npcs"
            (selectedChange)="set('npcs', $event)"
            (create)="createLinked('npcs', 'world-npcs', $event)"
            (look)="lookUp('npcs', $event)"
          />
        </div>
        <div class="field">
          <span class="label">Quests</span>
          <app-link-picker
            label="Quests"
            [creatable]="true"
            [options]="store.questOptions()"
            [selected]="draft().quests"
            (selectedChange)="set('quests', $event)"
            (create)="createLinked('quests', 'quests', $event)"
            (look)="lookUp('quests', $event)"
          />
        </div>
        <div class="field">
          <span class="label">Ereignisse</span>
          <app-link-picker
            label="Ereignisse"
            [creatable]="true"
            [options]="store.eventOptions()"
            [selected]="draft().events"
            (selectedChange)="set('events', $event)"
            (create)="createLinked('events', 'events', $event)"
            (look)="lookUp('events', $event)"
          />
        </div>
      </div>
    </div>
  `,
})
export class TriviaEditor extends EntryEditor<Trivia> {
  protected readonly kind = 'trivia' as const;
  /** The colour the typed category has everywhere in the app. */
  protected readonly colour = computed(() => tagColour(this.draft().category));

  /** The categories already used in this world, offered while typing. */
  protected readonly categories = computed(() => [...new Set(this.store.trivia().map((t) => t.category).filter(Boolean))].sort());
}
