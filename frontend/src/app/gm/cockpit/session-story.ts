import { Component, TemplateRef, computed, inject, input, linkedSignal, output, signal, viewChild } from '@angular/core';

import { readError } from '../../core/api-error';
import { EntryRef, Scene, WorldEvent } from '../../core/models';
import { questStatus } from '../../core/session-models';
import { SceneForm } from '../chapters/scene-form';
import { SceneView } from '../chapters/scene-view';
import { WorldStore } from '../../core/world-store';
import { Tools, Tool } from '../../global/tool-bar/tools.service';
import { EntryCard } from '../../components/entry/entry-card';
import { RoundChanges } from '../../components/entry/round-changes';
import { NameDialog } from '../../components/form/name-dialog';
import { SessionStore } from '../../core/session-store';

/** Open events in two groups: what belongs to the chapter, and the rest of the world. */
interface Groups<T> {
  label: string;
  entries: T[];
}

/**
 * The story part of a session: only the opened scene to read aloud. Everything around it is a symbol in the bar
 * at the bottom with a number: the place, the characters, quests, events, items and knowledge of the scene, where it
 * leads, the main quests and the free events. A click opens small cards above the symbol. Played, pin and
 * the fight in this scene switch at once. "Neu" makes up a scene of this round; "Bearbeiten" writes a scene of the
 * round in its form and changes a scene of the world for this round only.
 */
@Component({
  selector: 'app-session-story',
  imports: [SceneView, SceneForm, RoundChanges, NameDialog, EntryCard],
  templateUrl: './session-story.html',
})
export class SessionStory {
  protected readonly store = inject(SessionStore);
  private readonly world = inject(WorldStore);

  readonly scene = input<Scene | null>(null);
  readonly chapterId = input<number | null>(null);
  /** Asks to fight in the opened scene, with its characters. */
  readonly fight = output<Scene>();
  /** Asks to open a scene, like a new one; null closes the opened scene, after it was deleted. */
  readonly open = output<number | null>();

  /** Whether the dialog for a new scene is open, whether that scene is optional, and why creating it failed. */
  protected readonly creating = signal(false);
  protected readonly optional = signal(false);
  protected readonly error = signal('');
  /**
   * A scene made up just now opens to write; every other scene opens to read. Only another scene starts over: a
   * scene that changes while it is written (a text of the round was saved) stays in its form.
   */
  private createdId: number | null = null;
  private readonly sceneId = computed(() => this.scene()?.id ?? null);
  protected readonly editing = linkedSignal({
    source: this.sceneId,
    computation: (id) => id !== null && id === this.createdId,
  });
  /** The opened scene as it is written, for its form; only a scene of this round has one here. */
  protected readonly ownScene = computed(() => {
    const id = this.scene()?.id;
    return this.world.written.scenes().find((scene) => scene.id === id && !!scene.session) ?? null;
  });

  private readonly chapter = computed(() => this.world.chapters().find((chapter) => chapter.id === this.chapterId()) ?? null);
  private readonly scenes = computed(() => this.world.scenesOf(this.chapterId() ?? 0));
  /** Every main quest of the world in the order of its number, whether it is done or not. */
  protected readonly mainQuests = computed<EntryRef[]>(() => {
    const main = this.world.quests().filter((quest) => quest.kind === 'main');
    main.sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || a.name.localeCompare(b.name));
    return main.map((quest) => ({ kind: 'quests', id: quest.id }));
  });
  /** The quests of the opened scene that are not over: those it points to, and those that come up in it. */
  protected readonly sceneQuests = computed<EntryRef[]>(() => {
    const scene = this.scene();
    const here = (id: number, comesUp: number | null) => !!scene && (scene.quests.includes(id) || comesUp === scene.id);
    return this.world
      .quests()
      .filter((quest) => here(quest.id, quest.scene) && !this.store.state('quest', quest.id)?.done)
      .map((quest) => ({ kind: 'quests', id: quest.id }));
  });
  /** The open events that hang on the opened scene. */
  protected readonly sceneEvents = computed<EntryRef[]>(() =>
    this.openEvents().filter((event) => this.scene()?.events.includes(event.id)).map((event) => ({ kind: 'events', id: event.id })),
  );
  /** The other open events: those of the chapter and its scenes, then all others. */
  protected readonly freeEvents = computed<Groups<EntryRef>[]>(() => {
    const free = this.openEvents().filter((event) => !this.scene()?.events.includes(event.id));
    const ids = [...(this.chapter()?.events ?? []), ...this.scenes().flatMap((scene) => scene.events)];
    const refs = (events: WorldEvent[]): EntryRef[] => events.map((event) => ({ kind: 'events', id: event.id }));
    const own = free.filter((event) => !!event.session);
    const world = free.filter((event) => !event.session);
    return [
      { label: 'Nur diese Runde', entries: refs(own) },
      { label: 'In diesem Kapitel', entries: refs(world.filter((event) => ids.includes(event.id))) },
      { label: 'Übrige Welt', entries: refs(world.filter((event) => !ids.includes(event.id))) },
    ];
  });
  protected readonly freeCount = computed(() => this.freeEvents().reduce((sum, group) => sum + group.entries.length, 0));
  private readonly openEvents = computed(() => this.world.events().filter((event) => !this.store.state('event', event.id)?.done));

  // What the scene is linked with.
  protected readonly place = computed<EntryRef[]>(() => {
    const location = this.scene()?.location;
    return location ? [{ kind: 'locations', id: location }] : [];
  });
  protected readonly people = computed<EntryRef[]>(() => (this.scene()?.npcs ?? []).map((id) => ({ kind: 'npcs', id })));
  protected readonly knowledge = computed<EntryRef[]>(() => (this.scene()?.trivia ?? []).map((id) => ({ kind: 'trivia', id })));
  protected readonly leads = computed<EntryRef[]>(() => (this.scene()?.leads_to ?? []).map((id) => ({ kind: 'scenes', id })));

  // The popups behind the symbols.
  private readonly placeList = viewChild<TemplateRef<unknown>>('placeList');
  private readonly peopleList = viewChild<TemplateRef<unknown>>('peopleList');
  private readonly questList = viewChild<TemplateRef<unknown>>('questList');
  private readonly eventList = viewChild<TemplateRef<unknown>>('eventList');
  private readonly knowledgeList = viewChild<TemplateRef<unknown>>('knowledgeList');
  private readonly leadsList = viewChild<TemplateRef<unknown>>('leadsList');
  private readonly mainList = viewChild<TemplateRef<unknown>>('mainList');
  private readonly freeList = viewChild<TemplateRef<unknown>>('freeList');

  protected readonly tools = computed<Tool[]>(() => {
    const scene = this.scene();
    const here: Tool[] = scene
      ? [
          { id: 'story-place', word: 'Ort', icon: 'pin', tone: 'kind--locations', count: this.place().length, popup: this.placeList(), popupTitle: 'Ort der Szene' },
          { id: 'story-people', word: 'Figuren', icon: 'sheet', tone: 'kind--npcs', count: this.people().length, popup: this.peopleList(), popupTitle: 'Figuren der Szene' },
          { id: 'story-quests', word: 'Quests', icon: 'quest', tone: 'kind--quests', count: this.sceneQuests().length, popup: this.questList(), popupTitle: 'Quests dieser Szene', wide: true },
          { id: 'story-events', word: 'Ereignisse', icon: 'flag', tone: 'kind--events', count: this.sceneEvents().length, popup: this.eventList(), popupTitle: 'Ereignisse dieser Szene', wide: true },
          { id: 'story-knowledge', word: 'Wissen', icon: 'gift', tone: 'kind--trivia', count: this.knowledge().length, popup: this.knowledgeList(), popupTitle: 'Gegenstände und Wissen der Szene' },
          { id: 'story-leads', word: 'Weiter', title: 'Führt zu', icon: 'right', tone: 'kind--scenes', count: this.leads().length, popup: this.leadsList(), popupTitle: 'Führt zu' },
        ]
      : [];
    const world: Tool[] = [
      { id: 'story-main', word: 'Haupt', title: 'Hauptquests', icon: 'quest', tone: 'kind--quests', count: this.runningMain(), popup: this.mainList(), popupTitle: 'Hauptquests', wide: true },
      { id: 'story-free', word: 'Freie', title: 'Freie Ereignisse', icon: 'flag', tone: 'kind--events', count: this.freeCount(), popup: this.freeList(), popupTitle: 'Freie Ereignisse', wide: true },
    ];
    const writing = this.editing();
    const making: Tool[] = [
      { id: 'story-new', word: 'Neu', title: 'Neue Szene in dieser Runde', icon: 'plus', tone: 'kind--scenes', disabled: !this.chapterId(), click: () => this.creating.set(true) },
      {
        id: 'story-edit', word: writing ? 'Lesen' : 'Bearbeiten', title: writing ? 'Zurück zum Lesen' : scene?.session ? 'Szene bearbeiten' : 'Szene für diese Runde ändern',
        icon: writing ? 'eye' : 'edit', pressed: writing, disabled: !scene, click: () => this.editing.set(!writing),
      },
    ];
    const switches: Tool[] = scene
      ? [
          { id: 'story-played', word: 'Gespielt', icon: 'check', pressed: !!this.store.state('scene', scene.id)?.done, click: () => this.toggleHere('done') },
          { id: 'story-pin', word: 'Nadel', title: 'Stecknadel', icon: 'pin', pressed: !!this.store.state('scene', scene.id)?.pinned, click: () => this.toggleHere('pinned') },
          { id: 'story-fight', word: 'Kampf hier', icon: 'sword', click: () => this.fightHere() },
        ]
      : [];
    return [...making, ...here, ...world, ...switches];
  });

  constructor() {
    inject(Tools).provide('view', this.tools);
  }

  /** Make up a scene of this round in the chapter of the round, at the end of its thread or among the optional scenes. */
  protected addScene(name: string): void {
    const chapterId = this.chapterId();
    if (chapterId === null) {
      return;
    }
    const position = Math.max(-1, ...this.world.scenesOf(chapterId).map((scene) => scene.position)) + 1;
    this.world.addScene(chapterId, { name, optional: this.optional(), position }).subscribe({
      next: (scene) => this.created(scene.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Close the dialog and open the new scene to write. */
  private created(id: number): void {
    this.creating.set(false);
    this.optional.set(false);
    this.error.set('');
    this.createdId = id;
    this.open.emit(id);
  }

  /**
   * Switch a mark of the opened scene. The scene is read when the symbol is clicked, not when the bar was drawn:
   * the bar can lag behind the scene for a moment, and a click must never act on the scene before.
   */
  private toggleHere(flag: 'done' | 'pinned'): void {
    const scene = this.scene();
    if (scene) {
      this.store.toggle('scene', scene.id, flag);
    }
  }

  /** Ask to fight in the opened scene, read at the moment of the click for the same reason. */
  private fightHere(): void {
    const scene = this.scene();
    if (scene) {
      this.fight.emit(scene);
    }
  }

  /** How many main quests the group is working on. */
  private runningMain(): number {
    return this.mainQuests().filter((ref) => questStatus(this.store.state('quest', ref.id)) === 'running').length;
  }
}
