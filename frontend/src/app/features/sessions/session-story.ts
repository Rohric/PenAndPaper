import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';

import { Quest, Scene, WorldEvent } from '../../core/models';
import { QUEST_STATUSES, SessionEntryKind, questStatus } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { EventTile } from '../worlds/event-tile';
import { QuestTile } from '../worlds/quest-tile';
import { SceneView } from '../worlds/scene-view';
import { WorldStore } from '../worlds/world-store';
import { SessionStore } from './session-store';

type Flag = 'done' | 'started' | 'revealed' | 'pinned';

/** Open events in two groups: what belongs to the chapter, and the rest of the world. */
interface Groups<T> {
  label: string;
  entries: T[];
}

/**
 * The story part of a session: the opened scene to read aloud with the events and quests that hang
 * on it, the main quests of the world as one line that is always there, and the open free events
 * as a part that folds. All quests with their status are on the quest board.
 */
@Component({
  selector: 'app-session-story',
  imports: [NgTemplateOutlet, Icon, SceneView, QuestTile, EventTile],
  templateUrl: './session-story.html',
})
export class SessionStory {
  protected readonly store = inject(SessionStore);
  private readonly world = inject(WorldStore);

  readonly scene = input<Scene | null>(null);
  readonly chapterId = input<number | null>(null);
  /** Asks to fight in the opened scene, with its characters. */
  readonly fight = output<Scene>();
  /** Asks to open the board with all quests. */
  readonly quests = output<void>();

  private readonly chapter = computed(() => this.world.chapters().find((chapter) => chapter.id === this.chapterId()) ?? null);
  private readonly scenes = computed(() => this.world.scenesOf(this.chapterId() ?? 0));
  /** Every main quest of the world in the order of its number, whether it is done or not. */
  protected readonly mainQuests = computed(() => {
    const main = this.world.quests().filter((quest) => quest.kind === 'main');
    return main.sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || a.name.localeCompare(b.name));
  });
  /** The quests of the opened scene that are not over: those it points to, and those that come up in it. */
  protected readonly sceneQuests = computed<Quest[]>(() => {
    const scene = this.scene();
    const here = (quest: Quest) => !!scene && (scene.quests.includes(quest.id) || this.world.questNow(quest).scene === scene.id);
    return this.world.quests().filter((quest) => here(quest) && !this.is('quest', quest.id, 'done'));
  });
  /** The open events that hang on the opened scene. */
  protected readonly sceneEvents = computed(() => this.openEvents().filter((event) => this.scene()?.events.includes(event.id)));
  protected readonly hasSceneEvents = computed(() => !!this.scene()?.events.length);
  /** The other open events: those of the chapter and its scenes, then all others. */
  protected readonly freeEvents = computed<Groups<WorldEvent>[]>(() => {
    const free = this.openEvents().filter((event) => !this.scene()?.events.includes(event.id));
    const ids = [...(this.chapter()?.events ?? []), ...this.scenes().flatMap((scene) => scene.events)];
    return [
      { label: 'In diesem Kapitel', entries: free.filter((event) => ids.includes(event.id)) },
      { label: 'Übrige Welt', entries: free.filter((event) => !ids.includes(event.id)) },
    ];
  });
  protected readonly freeCount = computed(() => this.freeEvents().reduce((sum, group) => sum + group.entries.length, 0));

  private readonly openEvents = computed(() => this.world.events().filter((event) => !this.is('event', event.id, 'done')));

  /** Whether the session set one of the marks of an entry. */
  protected is(kind: SessionEntryKind, id: number, flag: Flag): boolean {
    return !!this.store.state(kind, id)?.[flag];
  }

  /** The words behind the kind of a quest: its status and whether it is shared. */
  protected marks(id: number): string {
    return ` · ${this.statusOf(id)}` + (this.is('quest', id, 'revealed') ? ' · geteilt' : '');
  }

  /** The status of a quest in words: running, open or finished. */
  protected statusOf(id: number): string {
    const status = questStatus(this.store.state('quest', id));
    return QUEST_STATUSES.find((other) => other.id === status)?.label.toLowerCase() ?? '';
  }

  /** How many points of a quest the session has checked. */
  protected stepsDone(id: number): number {
    return this.store.state('quest', id)?.steps.length ?? 0;
  }

  /** Look a quest up in the window at the side. */
  protected lookUp(id: number): void {
    this.world.peek.set({ kind: 'quests', id });
  }
}
