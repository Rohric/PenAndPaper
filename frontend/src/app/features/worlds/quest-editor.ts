import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QUEST_KINDS, Quest } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { IdSelect } from '../../shared/id-select';
import { LinkPicker } from '../../shared/link-picker';
import { StringListEditor } from '../../shared/string-list-editor';
import { EntryEditor } from './entry-editor';

/** Edit one quest with its checklist and its links to a place and to NPCs. */
@Component({
  selector: 'app-quest-editor',
  imports: [FormsModule, EditorBar, IdSelect, LinkPicker, StringListEditor],
  templateUrl: './quest-editor.html',
})
export class QuestEditor extends EntryEditor<Quest> {
  protected readonly kind = 'quests' as const;
  protected readonly kinds = QUEST_KINDS;
}
