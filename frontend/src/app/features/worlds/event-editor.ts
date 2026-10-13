import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WorldEvent } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { EntryTextsEditor } from '../../shared/entry-texts-editor';
import { AutoGrow } from '../../shared/auto-grow';
import { DialogueListEditor } from '../../shared/dialogue-list-editor';
import { LinkPicker } from '../../shared/link-picker';
import { SymbolPicker } from '../../shared/symbol-picker';
import { EntryEditor } from './entry-editor';
import { EventScenes } from './event-scenes';

/** Edit one event: what sets it off, what happens, what is said, where it happens and the scenes it hangs on. */
@Component({
  selector: 'app-event-editor',
  imports: [FormsModule, EditorBar, LinkPicker, SymbolPicker, AutoGrow, DialogueListEditor, EventScenes, EntryTextsEditor],
  template: `
    <div class="stack">
      <div class="panel">
        <div class="field">
          <label for="event-name">Name</label>
          <input id="event-name" class="input input--title" [ngModel]="draft().name" (ngModelChange)="set('name', $event)" />
        </div>
        <div class="field">
          <span class="label">Symbol</span>
          <app-symbol-picker fallback="flag" [value]="draft().symbol" (valueChange)="set('symbol', $event)" />
        </div>
        <div class="field">
          <label for="event-trigger">Auslöser</label>
          <span class="soft">Wann das Ereignis eintritt, zum Beispiel „nachts auf dem Pass“.</span>
          <textarea
            id="event-trigger"
            class="input"
            rows="2"
            [appAutoGrow]="draft().trigger"
            [ngModel]="draft().trigger"
            (ngModelChange)="set('trigger', $event)"
          ></textarea>
        </div>
        <div class="field">
          <label for="event-happening">Was passiert</label>
          <textarea
            id="event-happening"
            class="input"
            rows="4"
            [appAutoGrow]="draft().happening"
            [ngModel]="draft().happening"
            (ngModelChange)="set('happening', $event)"
          ></textarea>
        </div>
        <div class="field">
          <label for="event-location">Ort</label>
          <app-link-picker
            single
            inputId="event-location"
            label="Ort des Ereignisses"
            emptyText="Wo passiert es?"
            [options]="store.locationOptions()"
            [value]="draft().location"
            [creatable]="true"
            (valueChange)="set('location', $event)"
            (create)="createLinked('location', 'locations', $event)"
            (look)="lookUp('locations', $event)"
          />
        </div>
        <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove(entry().name)" />
      </div>

      <app-entry-texts-editor
        inputId="event-description"
        [description]="draft().description"
        [playerKnowledge]="draft().player_knowledge"
        [gmKnowledge]="draft().gm_knowledge"
        (descriptionChange)="set('description', $event)"
        (playerKnowledgeChange)="set('player_knowledge', $event)"
        (gmKnowledgeChange)="set('gm_knowledge', $event)"
      />

      <div class="panel">
        <h2 class="subtitle">Dialoge</h2>
        <p class="soft">Was gesagt wird, wenn das Ereignis eintritt. Wer spricht, ist freiwillig.</p>
        <app-dialogue-list-editor
          [dialogues]="draft().dialogues"
          [speakers]="store.npcOptions()"
          [newSpeaker]="newSpeaker"
          (dialoguesChange)="set('dialogues', $event)"
          (look)="lookUp('npcs', $event)"
        />
      </div>

      <div class="panel">
        <h2 class="subtitle">Hängt an Szenen</h2>
        <p class="soft">Freiwillig: Ein Ereignis kann an Szenen hängen oder frei bleiben. Das wird sofort gespeichert.</p>
        <app-event-scenes [eventId]="entry().id" />
      </div>
    </div>
  `,
})
export class EventEditor extends EntryEditor<WorldEvent> {
  protected readonly kind = 'events' as const;
}
