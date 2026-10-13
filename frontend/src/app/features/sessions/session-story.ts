import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map, switchMap } from 'rxjs';

import { readError } from '../../core/api-error';
import { Quest, Scene, WorldEvent } from '../../core/models';
import { SessionEntryKind } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { EventTile } from '../worlds/event-tile';
import { QuestTile } from '../worlds/quest-tile';
import { SceneView } from '../worlds/scene-view';
import { WorldStore } from '../worlds/world-store';
import { SessionStore } from './session-store';

type Flag = 'done' | 'revealed' | 'pinned';

/** Open quests or events in two groups: what belongs to the chapter, and the rest of the world. */
interface Groups<T> {
  label: string;
  entries: T[];
}

/**
 * The story part of a session: the opened scene to read aloud with the events that hang on it,
 * every main quest of the world in the order of its number, and two parts that fold: the open side
 * quests and the open free events, first those of the chapter, then the rest of the world.
 * Side quests and events that are done move to the archive.
 */
@Component({
  selector: 'app-session-story',
  imports: [NgTemplateOutlet, FormsModule, Icon, SceneView, QuestTile, EventTile],
  templateUrl: './session-story.html',
})
export class SessionStory {
  protected readonly store = inject(SessionStore);
  private readonly world = inject(WorldStore);

  readonly scene = input<Scene | null>(null);
  readonly chapterId = input<number | null>(null);
  /** Asks to fight in the opened scene, with its characters. */
  readonly fight = output<Scene>();

  /** The title of a quest that is created while playing. */
  protected readonly newQuest = signal('');
  protected readonly chapter = computed(() => this.world.chapters().find((chapter) => chapter.id === this.chapterId()) ?? null);
  private readonly scenes = computed(() => this.world.scenesOf(this.chapterId() ?? 0));
  /** Every main quest of the world in the order of its number, whether it is done or not. */
  protected readonly mainQuests = computed(() => {
    const main = this.world.quests().filter((quest) => quest.kind === 'main');
    return main.sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || a.name.localeCompare(b.name));
  });
  /** The open side quests: those the chapter, its scenes or their origin point to, then all others. */
  protected readonly sideQuests = computed<Groups<Quest>[]>(() => {
    const open = this.world.quests().filter((quest) => quest.kind === 'side' && !this.is('quest', quest.id, 'done'));
    const here = (quest: Quest) => this.questIds().includes(quest.id) || this.scenes().some((scene) => scene.id === this.world.questNow(quest).scene);
    return grouped(open, here);
  });
  /** The open events that hang on the opened scene. */
  protected readonly sceneEvents = computed(() => this.openEvents().filter((event) => this.scene()?.events.includes(event.id)));
  protected readonly hasSceneEvents = computed(() => !!this.scene()?.events.length);
  /** The other open events: those of the chapter and its scenes, then all others. */
  protected readonly freeEvents = computed<Groups<WorldEvent>[]>(() => {
    const free = this.openEvents().filter((event) => !this.scene()?.events.includes(event.id));
    const ids = [...(this.chapter()?.events ?? []), ...this.scenes().flatMap((scene) => scene.events)];
    return grouped(free, (event) => ids.includes(event.id));
  });
  protected readonly sideCount = computed(() => count(this.sideQuests()));
  protected readonly freeCount = computed(() => count(this.freeEvents()));

  private readonly openEvents = computed(() => this.world.events().filter((event) => !this.is('event', event.id, 'done')));
  private readonly questIds = computed(() => [...(this.chapter()?.quests ?? []), ...this.scenes().flatMap((scene) => scene.quests)]);

  /** Whether the session set one of the marks of an entry. */
  protected is(kind: SessionEntryKind, id: number, flag: Flag): boolean {
    return !!this.store.state(kind, id)?.[flag];
  }

  /** The words behind the kind of a quest: whether it is shared and whether it is done. */
  protected marks(id: number): string {
    return (this.is('quest', id, 'revealed') ? ' · geteilt' : '') + (this.is('quest', id, 'done') ? ' · erledigt' : '');
  }

  /** How many steps of a quest the session has checked. */
  protected stepsDone(id: number): number {
    return this.store.state('quest', id)?.steps.length ?? 0;
  }

  /**
   * Create a quest from its title alone while playing. It becomes a side quest of the world,
   * hangs on the chapter the group is in, and is shared with the players right away.
   */
  protected addQuest(): void {
    const chapter = this.chapter();
    const name = this.newQuest().trim();
    if (!chapter || !name) {
      return;
    }
    this.newQuest.set('');
    const created = this.world.add<Quest>('quests', { name });
    const linked = created.pipe(switchMap((quest) => this.world.save('chapters', chapter.id, { quests: [...chapter.quests, quest.id] }).pipe(map(() => quest))));
    linked.subscribe({
      next: (quest) => this.store.toggle('quest', quest.id, 'revealed'),
      error: (e: unknown) => this.store.error.set(readError(e)),
    });
  }
}

/** Split entries into those that belong to the chapter and the rest of the world. */
function grouped<T>(entries: T[], here: (entry: T) => boolean): Groups<T>[] {
  return [
    { label: 'In diesem Kapitel', entries: entries.filter(here) },
    { label: 'Übrige Welt', entries: entries.filter((entry) => !here(entry)) },
  ];
}

function count<T>(groups: Groups<T>[]): number {
  return groups.reduce((sum, group) => sum + group.entries.length, 0);
}
