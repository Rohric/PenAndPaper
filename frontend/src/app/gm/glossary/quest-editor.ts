import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QUEST_KINDS, Quest } from '../../core/models';
import { CategoryField } from '../../components/form/category-field';
import { DialogueListEditor } from '../../components/form/dialogue-list-editor';
import { ChapterField } from '../../components/form/chapter-field';
import { EditorBar } from '../../components/form/editor-bar';
import { EntryTextsEditor } from '../../components/form/entry-texts-editor';
import { LinkPicker } from '../../components/form/link-picker';
import { StringListEditor } from '../../components/form/string-list-editor';
import { SymbolPicker } from '../../components/form/symbol-picker';
import { EntryEditor } from './entry-editor';
import { EntryItems } from './entry-items';

/** Edit one quest with its checklist, its links to a giver, a place, a scene and NPCs, and its items. */
@Component({
  selector: 'app-quest-editor',
  imports: [FormsModule, CategoryField, ChapterField, EditorBar, LinkPicker, StringListEditor, SymbolPicker, DialogueListEditor, EntryTextsEditor, EntryItems],
  templateUrl: './quest-editor.html',
})
export class QuestEditor extends EntryEditor<Quest> {
  protected readonly kind = 'quests' as const;
  protected readonly kinds = QUEST_KINDS;
}
