import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Location } from '../../core/models';
import { CategoryField } from '../../components/form/category-field';
import { ChapterField } from '../../components/form/chapter-field';
import { EditorBar } from '../../components/form/editor-bar';
import { EntryTextsEditor } from '../../components/form/entry-texts-editor';
import { LinkPicker } from '../../components/form/link-picker';
import { SymbolPicker } from '../../components/form/symbol-picker';
import { EntryEditor } from './entry-editor';
import { EntryItems } from './entry-items';
import { LocationEvents } from './location-events';

/** Edit one location: its name, the place it lies in, what is known about it, the events that happen there and the items found there. */
@Component({
  selector: 'app-location-editor',
  imports: [FormsModule, CategoryField, ChapterField, EditorBar, LinkPicker, SymbolPicker, EntryTextsEditor, EntryItems, LocationEvents],
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
        <app-category-field inputId="location-category" kind="locations" [value]="draft().category" (valueChange)="set('category', $event)" />
        <app-chapter-field inputId="location-chapters" [selected]="draft().chapters" (selectedChange)="set('chapters', $event)" (look)="lookUp('chapters', $event)" />
        <app-editor-bar [dirty]="dirty()" [busy]="busy()" (save)="save()" (remove)="remove(entry().name)" />
      </div>

      <app-entry-texts-editor
        inputId="location-description"
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
      </div>

      <div class="panel">
        <h2 class="subtitle">Ereignisse</h2>
        <p class="soft">Was an diesem Ort passiert. Ein Ereignis hat einen Ort; was du hier hinzufügst, zieht hierher um. Das wird sofort gespeichert.</p>
        <app-location-events [placeId]="entry().id" />
      </div>

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
