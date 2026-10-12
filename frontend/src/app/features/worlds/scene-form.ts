import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { readError } from '../../core/api-error';
import { Option, Scene } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { IdSelect } from '../../shared/id-select';
import { LinkPicker } from '../../shared/link-picker';
import { EntryEditor } from './entry-editor';

type LinkField = 'npcs' | 'quests' | 'events' | 'trivia';

/** Edit one scene: its texts, whether it hangs on the thread, and everything it points to. */
@Component({
  selector: 'app-scene-form',
  imports: [FormsModule, EditorBar, IdSelect, LinkPicker],
  templateUrl: './scene-form.html',
})
export class SceneForm extends EntryEditor<Scene> {
  protected readonly kind = 'scenes' as const;

  /** A scene can lead to every other scene of its chapter. */
  protected readonly otherScenes = computed<Option[]>(() =>
    this.store
      .scenesOf(this.entry().chapter)
      .filter((scene) => scene.id !== this.entry().id)
      .map((scene) => ({ id: scene.id, label: scene.name })),
  );

  /** Create a new entry in the glossary from the typed name and link it to the scene. */
  protected addNew(field: LinkField, name: string): void {
    const kind = field === 'npcs' ? 'world-npcs' : field;
    this.store.add<{ id: number; npc?: number }>(kind, { name }).subscribe({
      next: (created) => this.set(field, [...this.draft()[field], created.npc ?? created.id]),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }
}
