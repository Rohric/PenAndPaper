import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QUEST_KINDS, Quest } from '../../core/models';
import { DialogueListEditor } from '../../shared/dialogue-list-editor';
import { EditorBar } from '../../shared/editor-bar';
import { EntryTextsEditor } from '../../shared/entry-texts-editor';
import { LinkPicker } from '../../shared/link-picker';
import { StringListEditor } from '../../shared/string-list-editor';
import { SymbolPicker } from '../../shared/symbol-picker';
import { EntryEditor } from './entry-editor';
import { EntryItems } from './entry-items';

/** Edit one quest with its checklist, its links to a giver, a place, a scene and NPCs, and its items. */
@Component({
  selector: 'app-quest-editor',
  imports: [FormsModule, EditorBar, LinkPicker, StringListEditor, SymbolPicker, DialogueListEditor, EntryTextsEditor, EntryItems],
  templateUrl: './quest-editor.html',
})
export class QuestEditor extends EntryEditor<Quest> {
  protected readonly kind = 'quests' as const;
  protected readonly kinds = QUEST_KINDS;
}
