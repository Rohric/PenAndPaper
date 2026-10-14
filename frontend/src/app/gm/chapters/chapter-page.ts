import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { Folds } from '../../core/folds';
import { EntryRef } from '../../core/models';
import { foldScope, foldTools } from '../../components/basic/fold';
import { IconName } from '../../components/basic/icon';
import { MasterDetail } from '../../components/basic/master-detail';
import { EntryView } from '../../components/entry/entry-view';
import { NameDialog } from '../../components/form/name-dialog';
import { Crumb, NavItem, NavService } from '../../global/frame/nav.service';
import { Tool, Tools } from '../../global/tool-bar/tools.service';
import { ChapterEditor } from './chapter-editor';
import { ChapterLinks } from './chapter-links';
import { SceneForm } from './scene-form';
import { SceneThread } from './scene-thread';
import { SceneView } from './scene-view';
import { WorldStore } from '../../core/world-store';

type Tab = 'scenes' | 'quests' | 'events' | 'overview';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'scenes', label: 'Szenen', icon: 'note' },
  { id: 'quests', label: 'Quests', icon: 'quest' },
  { id: 'events', label: 'Ereignisse', icon: 'flag' },
  { id: 'overview', label: 'Überblick', icon: 'eye' },
];

/**
 * One chapter: the thread of its scenes with the opened scene beside it, its quests and events, and an overview
 * of the chapter itself, read like every entry. Its parts are links in the bar on top; creating, editing, moving and
 * folding are tools at the bottom.
 */
@Component({
  selector: 'app-chapter-page',
  imports: [RouterLink, MasterDetail, NameDialog, ChapterEditor, ChapterLinks, EntryView, SceneForm, SceneThread, SceneView],
  templateUrl: './chapter-page.html',
})
export class ChapterPage {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);
  private readonly folds = inject(Folds);

  /** All three come from the URL: .../chapters/:chapterId?tab=scenes&scene=id */
  readonly chapterId = input.required<string>();
  readonly tab = input<string>();
  readonly scene = input<string>();

  protected readonly currentTab = computed<Tab>(() => TABS.find((tab) => tab.id === this.tab())?.id ?? 'scenes');
  protected readonly chapter = computed(() => this.store.chapters().find((c) => c.id === Number(this.chapterId())) ?? null);
  /** The chapter as an entry, for its reading view in the overview. */
  protected readonly chapterRef = computed<EntryRef>(() => ({ kind: 'chapters', id: Number(this.chapterId()) }));
  protected readonly scenes = computed(() => this.store.scenesOf(Number(this.chapterId())));
  protected readonly sceneId = computed(() => Number(this.scene()) || null);
  protected readonly openScene = computed(() => this.scenes().find((scene) => scene.id === this.sceneId()) ?? null);
  /** The parts of the chapter as the links in the bar on top. */
  private readonly links = computed<NavItem[]>(() =>
    TABS.map((tab) => ({ ...tab, tone: `kind--${tab.id}`, active: tab.id === this.currentTab(), click: () => this.show(tab.id) })),
  );
  private readonly crumbs = computed<Crumb[]>(() => {
    const chapter = this.chapter();
    const here: Crumb[] = [{ label: 'Kapitel', path: this.chaptersLink() }, { label: chapter ? `${chapter.number} · ${chapter.name}` : 'unbekannt' }];
    const scene = this.currentTab() === 'scenes' ? this.openScene() : null;
    return scene ? [...here, { label: scene.name }] : here;
  });
  /** Whether the dialog for a new scene is open, and whether the new scene is optional. */
  protected readonly creating = signal(false);
  protected readonly optional = signal(false);
  /** The place of the opened scene on the thread; -1 for an optional scene or none. */
  private readonly place = computed(() => this.scenes().filter((scene) => !scene.optional).findIndex((scene) => scene.id === this.sceneId()));
  private readonly threadLength = computed(() => this.scenes().filter((scene) => !scene.optional).length);
  /** The tools of the open part of the chapter, for the bar at the bottom; quests and events report their own. */
  private readonly pageTools = computed<Tool[]>(() => {
    switch (this.currentTab()) {
      case 'scenes':
        return [...this.sceneTools(), ...foldTools(this.folds, foldScope(this.store))];
      case 'overview':
        return [this.overviewTool(), ...foldTools(this.folds, foldScope(this.store))];
      default:
        return [];
    }
  });
  protected readonly error = signal('');
  protected readonly editingOverview = signal(false);

  /** A fresh scene opens to write, every other scene opens to read. */
  private createdId: number | null = null;
  protected readonly editing = linkedSignal({
    source: this.sceneId,
    computation: (id) => id !== null && id === this.createdId,
  });

  constructor() {
    const nav = inject(NavService);
    nav.crumbs.provide(this.crumbs);
    nav.links.provide(this.links);
    nav.topic.provide(computed(() => [this.currentTab() === 'scenes' ? 'scenes' : 'chapters']));
    inject(Tools).provide('view', this.pageTools);
  }

  /** Address of the list of all chapters. */
  protected chaptersLink(): unknown[] {
    return ['/gm/worlds', this.store.worldId(), 'chapters'];
  }

  /** Show a part of the chapter. */
  protected show(tab: Tab): void {
    void this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  /** Open a scene beside the thread. */
  protected select(id: number): void {
    void this.router.navigate([], { queryParams: { scene: id }, queryParamsHandling: 'merge' });
  }

  /** Close the opened scene. */
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

  /** The tools of the scenes: a new scene, editing the opened one, and moving it on the thread. */
  private sceneTools(): Tool[] {
    const open = !!this.openScene();
    const place = this.place();
    const writing = this.editing();
    return [
      { id: 'scene-new', word: 'Neu', title: 'Neue Szene', icon: 'plus', click: () => this.creating.set(true) },
      { id: 'scene-edit', word: writing ? 'Lesen' : 'Bearbeiten', title: writing ? 'Zurück zum Lesen' : 'Szene bearbeiten', icon: writing ? 'eye' : 'edit', pressed: writing, disabled: !open, click: () => (writing ? this.stopEditing() : this.editing.set(true)) },
      { id: 'scene-up', word: 'Hoch', title: 'Szene im Faden nach oben schieben', icon: 'up', disabled: place <= 0, click: () => this.moveOpen(-1) },
      { id: 'scene-down', word: 'Runter', title: 'Szene im Faden nach unten schieben', icon: 'down', disabled: place < 0 || place >= this.threadLength() - 1, click: () => this.moveOpen(1) },
    ];
  }

  private overviewTool(): Tool {
    const editing = this.editingOverview();
    return { id: 'chapter-edit', word: editing ? 'Lesen' : 'Bearbeiten', title: editing ? 'Zurück zum Lesen' : 'Kapitel bearbeiten', icon: editing ? 'eye' : 'edit', pressed: editing, click: () => this.editingOverview.set(!editing) };
  }

  private moveOpen(by: number): void {
    const id = this.sceneId();
    if (id !== null) {
      this.moveScene({ id, by });
    }
  }

  private sceneCreated(id: number): void {
    this.creating.set(false);
    this.optional.set(false);
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
