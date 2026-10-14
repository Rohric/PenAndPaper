import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Trivia } from '../../core/models';
import { CategoryField } from '../../components/form/category-field';
import { ChapterField } from '../../components/form/chapter-field';
import { EditorBar } from '../../components/form/editor-bar';
import { EntryTextsEditor } from '../../components/form/entry-texts-editor';
import { LinkPicker } from '../../components/form/link-picker';
import { SymbolPicker } from '../../components/form/symbol-picker';
import { EntryEditor } from './entry-editor';

/** Edit one piece of knowledge or one item and the entries it is attached to. */
@Component({
  selector: 'app-trivia-editor',
  imports: [FormsModule, CategoryField, ChapterField, EditorBar, LinkPicker, SymbolPicker, EntryTextsEditor],
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
        <app-category-field
          inputId="trivia-category"
          kind="trivia"
          hint="„Gegenstand“ macht den Eintrag zu einem Gegenstand."
          placeholder="Zum Beispiel Tier, Volk, Gegenstand"
          [value]="draft().category"
          (valueChange)="set('category', $event)"
        />
        <app-chapter-field inputId="trivia-chapters" [selected]="draft().chapters" (selectedChange)="set('chapters', $event)" (look)="lookUp('chapters', $event)" />
        <app-editor-bar [dirty]="dirty()" [busy]="busy()" (save)="save()" (remove)="remove(entry().name)" />
      </div>

      <app-entry-texts-editor
        inputId="trivia-description"
        [description]="draft().description"
        [visibleFromStart]="!!draft().visible_from_start"
        [playerKnowledge]="draft().player_knowledge"
        [gmKnowledge]="draft().gm_knowledge"
        [note]="draft().note"
        (descriptionChange)="set('description', $event)"
        (visibleFromStartChange)="set('visible_from_start', $event)"
        (playerKnowledgeChange)="set('player_knowledge', $event)"
        (gmKnowledgeChange)="set('gm_knowledge', $event)"
        (noteChange)="set('note', $event)"
      />

      <div class="panel">
        <h2 class="subtitle">Verknüpfungen</h2>
        <p class="soft">Woran der Eintrag hängt. Tippen sucht, Enter verknüpft.</p>
        <div class="field">
          <label for="trivia-locations">Orte</label>
          <app-link-picker
            inputId="trivia-locations"
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
          <label for="trivia-npcs">Figuren</label>
          <app-link-picker
            inputId="trivia-npcs"
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
          <label for="trivia-quests">Quests</label>
          <app-link-picker
            inputId="trivia-quests"
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
          <label for="trivia-events">Ereignisse</label>
          <app-link-picker
            inputId="trivia-events"
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
}
