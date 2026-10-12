import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { readError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { Scene } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { IdSelect } from '../../shared/id-select';
import { PillMultiSelect } from '../../shared/pill-multi-select';
import { WorldStore } from './world-store';

/** Edit one scene of a chapter. The scene folds open inside the chapter. */
@Component({
  selector: 'app-scene-editor',
  imports: [FormsModule, EditorBar, IdSelect, PillMultiSelect],
  templateUrl: './scene-editor.html',
})
export class SceneEditor {
  protected readonly store = inject(WorldStore);
  private readonly api = inject(ApiService);

  readonly scene = input.required<Scene>();
  readonly saved = output<Scene>();
  readonly deleted = output<number>();

  protected readonly draft = linkedSignal(() => structuredClone(this.scene()));
  protected readonly dirty = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(this.scene()));
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly locationName = computed(
    () => this.store.locationOptions().find((option) => option.id === this.scene().location)?.label ?? '',
  );

  /** Change one field of the draft. */
  protected set<K extends keyof Scene>(key: K, value: Scene[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  /** Change the list position; empty or negative input counts as 0. */
  protected setPosition(value: number | null): void {
    this.set('position', Math.max(0, Math.floor(value ?? 0)));
  }

  /** Send the draft to the server. */
  protected save(): void {
    this.busy.set(true);
    this.api.patch<Scene>(`scenes/${this.scene().id}/`, this.draft()).subscribe({
      next: (scene) => this.done(scene),
      error: (e: unknown) => this.finish(readError(e)),
    });
  }

  /** Delete the scene after the user confirmed. */
  protected remove(): void {
    if (!confirm(`Die Szene „${this.scene().name}“ wirklich löschen?`)) {
      return;
    }
    this.api.delete(`scenes/${this.scene().id}/`).subscribe({
      next: () => this.deleted.emit(this.scene().id),
      error: (e: unknown) => this.finish(readError(e)),
    });
  }

  private done(scene: Scene): void {
    this.finish('');
    this.saved.emit(scene);
  }

  private finish(error: string): void {
    this.busy.set(false);
    this.error.set(error);
  }
}
