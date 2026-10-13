import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Location } from '../../core/models';
import { ChapterField } from '../../components/form/chapter-field';
import { EditorBar } from '../../components/form/editor-bar';
import { EntryTextsEditor } from '../../components/form/entry-texts-editor';
import { LinkPicker } from '../../components/form/link-picker';
import { SymbolPicker } from '../../components/form/symbol-picker';
import { EntryEditor } from './entry-editor';
import { EntryItems } from './entry-items';

/** Edit one location: its name, the place it lies in, what is known about it and the items found there. */
@Component({
  selector: 'app-location-editor',
  imports: [FormsModule, ChapterField, EditorBar, LinkPicker, SymbolPicker, EntryTextsEditor, EntryItems],
  template: `
    <div class="stack">
      <div class="panel">
        <div class="field">
          <label for="location-name">Name</label>
          <input id="location-name" class="input input--title" [ngModel]="draft().name" (ngModelChange)="set('name', $event)" />
        </div>
        <div class="field">
          <span class="label">Symbol</span>
          <app-symbol-picker fallback="pin" [value]="draft().symbol" (valueChange)="set('symbol', $event)" />
        </div>
        <div class="field">
          <label for="location-parent">Liegt in</label>
          <app-link-picker
            single
            inputId="location-parent"
            label="Ort, in dem dieser liegt"
            emptyText="In keinem anderen Ort"
            [options]="parents()"
            [value]="draft().parent"
            [creatable]="true"
            (valueChange)="set('parent', $event)"
            (create)="createLinked('parent', 'locations', $event)"
            (look)="lookUp('locations', $event)"
          />
        </div>
        <app-chapter-field inputId="location-chapters" [selected]="draft().chapters" (selectedChange)="set('chapters', $event)" />
        <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove(entry().name)" />
      </div>

      <app-entry-texts-editor
        inputId="location-description"
        [description]="draft().description"
        [visibleFromStart]="!!draft().visible_from_start"
        [playerKnowledge]="draft().player_knowledge"
        [gmKnowledge]="draft().gm_knowledge"
        (descriptionChange)="set('description', $event)"
        (visibleFromStartChange)="set('visible_from_start', $event)"
        (playerKnowledgeChange)="set('player_knowledge', $event)"
        (gmKnowledgeChange)="set('gm_knowledge', $event)"
      />

      <div class="panel">
        <h2 class="subtitle">Gegenstände</h2>
        <p class="soft">Was hier zu finden ist. Das wird sofort gespeichert.</p>
        <app-entry-items kind="locations" [entryId]="entry().id" />
      </div>
    </div>
  `,
})
export class LocationEditor extends EntryEditor<Location> {
  protected readonly kind = 'locations' as const;

  /** Every other place can be the parent. */
  protected readonly parents = computed(() => this.store.locationOptions().filter((o) => o.id !== this.entry().id));
}
