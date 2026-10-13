import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { EntryLink } from '../../core/models';
import { Icon, IconName } from '../../shared/icon';
import { MasterDetail } from '../../shared/master-detail';
import { TutorialButton } from '../../shared/tutorial-button';
import { ChapterEditor } from './chapter-editor';
import { ChapterLinks } from './chapter-links';
import { npcLinks } from './entry-views';
import { LinkRow } from './link-row';
import { SceneForm } from './scene-form';
import { SceneThread } from './scene-thread';
import { SceneView } from './scene-view';
import { WorldStore } from './world-store';

type Tab = 'scenes' | 'quests' | 'events' | 'overview';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'scenes', label: 'Szenen', icon: 'note' },
  { id: 'quests', label: 'Quests', icon: 'quest' },
  { id: 'events', label: 'Ereignisse', icon: 'flag' },
  { id: 'overview', label: 'Überblick', icon: 'eye' },
];

/**
 * One chapter: the thread of its scenes with the opened scene beside it,
 * its quests and events, and an overview of the chapter itself.
 */
@Component({
  selector: 'app-chapter-page',
  imports: [RouterLink, Icon, MasterDetail, TutorialButton, ChapterEditor, ChapterLinks, LinkRow, SceneForm, SceneThread, SceneView],
  templateUrl: './chapter-page.html',
})
export class ChapterPage {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  /** All three come from the URL: .../chapters/:chapterId?tab=scenes&scene=id */
  readonly chapterId = input.required<string>();
  readonly tab = input<string>();
  readonly scene = input<string>();

  protected readonly tabs = TABS;
  protected readonly currentTab = computed<Tab>(() => TABS.find((tab) => tab.id === this.tab())?.id ?? 'scenes');
  protected readonly chapter = computed(() => this.store.chapters().find((c) => c.id === Number(this.chapterId())) ?? null);
  protected readonly scenes = computed(() => this.store.scenesOf(Number(this.chapterId())));
  protected readonly sceneId = computed(() => Number(this.scene()) || null);
  protected readonly openScene = computed(() => this.scenes().find((scene) => scene.id === this.sceneId()) ?? null);
  protected readonly topic = computed(() => (this.currentTab() === 'scenes' ? 'scenes' : 'chapters'));
  protected readonly error = signal('');
  protected readonly editingOverview = signal(false);

  /** A fresh scene opens to write, every other scene opens to read. */
  private createdId: number | null = null;
  protected readonly editing = linkedSignal({
    source: this.sceneId,
    computation: (id) => id !== null && id === this.createdId,
  });

  /** Places and NPCs of the chapter are collected from its scenes, never entered twice. */
  protected readonly places = computed<EntryLink[]>(() => {
    const ids = new Set(this.scenes().map((scene) => scene.location));
    const places = this.store.locations().filter((place) => ids.has(place.id));
    return places.map((place) => ({ kind: 'locations', id: place.id, label: place.name }));
  });
  protected readonly npcs = computed(() => npcLinks(this.store, this.scenes().flatMap((scene) => scene.npcs)));

  /** Address of the list of all chapters. */
  protected chaptersLink(): unknown[] {
    return ['/gm/worlds', this.store.worldId(), 'chapters'];
  }

  /** Open a scene beside the thread. */
  protected select(id: number): void {
    void this.router.navigate([], { queryParams: { scene: id }, queryParamsHandling: 'merge' });
  }

  /** Close the opened scene; on mobile this shows the thread again. */
  protected closeScene(): void {
    void this.router.navigate([], { queryParams: { scene: null }, queryParamsHandling: 'merge' });
  }

  /** Go back from the scene form to the reading view. */
  protected stopEditing(): void {
    this.createdId = null;
    this.editing.set(false);
  }

  /** Create a scene at the end of the thread or among the optional scenes, and open its form. */
  protected addScene(wish: { name: string; optional: boolean }): void {
    const position = Math.max(-1, ...this.scenes().map((scene) => scene.position)) + 1;
    this.store.addScene(Number(this.chapterId()), { ...wish, position }).subscribe({
      next: (scene) => this.sceneCreated(scene.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Move a scene on the thread and save the new numbers of all scenes that changed their place. */
  protected moveScene(change: { id: number; by: number }): void {
    const thread = this.scenes().filter((scene) => !scene.optional);
    const from = thread.findIndex((scene) => scene.id === change.id);
    const to = from + change.by;
    if (from < 0 || to < 0 || to >= thread.length) {
      return;
    }
    thread.splice(to, 0, ...thread.splice(from, 1));
    thread.forEach((scene, position) => this.savePosition(scene.id, scene.position, position));
  }

  /** The chapter is gone; go back to the list of chapters. */
  protected leave(): void {
    void this.router.navigate(this.chaptersLink());
  }

  private sceneCreated(id: number): void {
    this.error.set('');
    this.createdId = id;
    this.select(id);
  }

  private savePosition(id: number, old: number, position: number): void {
    if (old !== position) {
      this.store.save('scenes', id, { position }).subscribe({ error: (e: unknown) => this.error.set(readError(e)) });
    }
  }
}
