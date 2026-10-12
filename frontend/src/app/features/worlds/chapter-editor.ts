import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { readError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { Chapter, Option, Scene } from '../../core/models';
import { EditorBar } from '../../shared/editor-bar';
import { PillMultiSelect } from '../../shared/pill-multi-select';
import { EntryEditor } from './entry-editor';
import { EntryLinks } from './entry-links';
import { SceneEditor } from './scene-editor';

/** Edit one chapter: its text, its quests and events, and the scenes that tell it. */
@Component({
  selector: 'app-chapter-editor',
  imports: [FormsModule, EditorBar, PillMultiSelect, EntryLinks, SceneEditor],
  templateUrl: './chapter-editor.html',
})
export class ChapterEditor extends EntryEditor<Chapter> {
  protected readonly kind = 'chapters' as const;
  private readonly api = inject(ApiService);

  protected readonly scenes = signal<Scene[]>([]);
  protected readonly newScene = signal('');
  private readonly chapterId = computed(() => this.entry().id);

  /** Places and NPCs of the chapter are collected from its scenes, never entered twice. */
  protected readonly places = computed<Option[]>(() => {
    const ids = new Set(this.scenes().map((scene) => scene.location));
    return this.store.locationOptions().filter((option) => ids.has(option.id));
  });
  protected readonly npcs = computed<Option[]>(() => {
    const ids = new Set(this.scenes().flatMap((scene) => scene.npcs));
    return this.store
      .npcs()
      .filter((link) => ids.has(link.npc))
      .map((link) => ({ id: link.id, label: link.name }));
  });

  constructor() {
    super();
    // Load the scenes whenever another chapter is opened.
    effect(() => {
      this.api.get<Scene[]>(`chapters/${this.chapterId()}/scenes/`).subscribe((scenes) => this.scenes.set(scenes));
    });
  }

  /** Change the chapter number; it starts at 1. */
  protected setChapterNumber(value: number | null): void {
    this.set('number', Math.max(1, Math.floor(value ?? 1)));
  }

  /** Create a scene from the typed name at the end of the list. */
  protected addScene(): void {
    const body = { name: this.newScene().trim(), position: this.scenes().length };
    this.api.post<Scene>(`chapters/${this.chapterId()}/scenes/`, body).subscribe({
      next: (scene) => this.sceneAdded(scene),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Put a saved scene back into the list, in list order. */
  protected onSceneSaved(saved: Scene): void {
    const scenes = this.scenes().map((scene) => (scene.id === saved.id ? saved : scene));
    this.scenes.set(scenes.sort((a, b) => a.position - b.position || a.id - b.id));
  }

  /** Drop a deleted scene from the list. */
  protected onSceneDeleted(id: number): void {
    this.scenes.update((scenes) => scenes.filter((scene) => scene.id !== id));
  }

  private sceneAdded(scene: Scene): void {
    this.scenes.update((scenes) => [...scenes, scene]);
    this.newScene.set('');
  }
}
