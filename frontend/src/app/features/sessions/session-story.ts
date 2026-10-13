import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';

import { EntryTexts, Quest, Scene, questLabel } from '../../core/models';
import { SessionEntryKind } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { summaryOf } from '../worlds/entry-views';
import { SceneView } from '../worlds/scene-view';
import { WorldStore } from '../worlds/world-store';
import { SessionStore } from './session-store';

interface Named extends EntryTexts {
  id: number;
  name: string;
}

/** A quest or an event as a tile: its name, what kind it is and how it begins. */
interface Tile {
  id: number;
  name: string;
  kicker: string;
  text: string;
}

type Flag = 'done' | 'revealed' | 'pinned';

/**
 * The story part of a session: the opened scene to read aloud with the events that hang on it,
 * every main quest of the world in the order of its number, and the open side quests and events
 * of the chapter. Side quests and events that are done move to the archive.
 */
@Component({
  selector: 'app-session-story',
  imports: [NgTemplateOutlet, SceneView, Icon],
  templateUrl: './session-story.html',
})
export class SessionStory {
  protected readonly store = inject(SessionStore);
  private readonly world = inject(WorldStore);

  readonly scene = input<Scene | null>(null);
  readonly chapterId = input<number | null>(null);
  /** Asks to fight in the opened scene, with its characters. */
  readonly fight = output<Scene>();

  private readonly chapter = computed(() => this.world.chapters().find((chapter) => chapter.id === this.chapterId()) ?? null);
  /** Every main quest of the world in the order of its number, whether it is done or not. */
  protected readonly mainQuests = computed<Tile[]>(() => {
    const main = this.world.quests().filter((quest) => quest.kind === 'main');
    return main.sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || a.name.localeCompare(b.name)).map(questTile);
  });
  /** The open side quests of the chapter, together with those its scenes point to. */
  protected readonly sideQuests = computed<Tile[]>(() =>
    this.open('quest', this.linked('quests'), this.world.quests()).filter((quest) => quest.kind === 'side').map(questTile),
  );
  /** Whether events hang on the opened scene at all, and which of them are still open. */
  protected readonly hasSceneEvents = computed(() => !!this.scene()?.events.length);
  protected readonly sceneEvents = computed<Tile[]>(() => this.open('event', this.scene()?.events ?? [], this.world.events()).map(eventTile));
  /** The other open events of the chapter and its scenes. */
  protected readonly otherEvents = computed<Tile[]>(() => {
    const here = this.scene()?.events ?? [];
    const elsewhere = this.linked('events').filter((id) => !here.includes(id));
    return this.open('event', elsewhere, this.world.events()).map(eventTile);
  });

  /** Whether the session set one of the marks of an entry. */
  protected is(kind: SessionEntryKind, id: number, flag: Flag): boolean {
    return !!this.store.state(kind, id)?.[flag];
  }

  /** Look a quest or an event up in the window at the side. */
  protected lookUp(kind: 'quests' | 'events', id: number): void {
    this.world.peek.set({ kind, id });
  }

  /** The ids of the quests or events the chapter and its scenes point to. */
  private linked(list: 'quests' | 'events'): number[] {
    const chapter = this.chapter();
    const scenes = chapter ? this.world.scenesOf(chapter.id) : [];
    return [...(chapter?.[list] ?? []), ...scenes.flatMap((scene) => scene[list])];
  }

  /** The entries with the given ids that the session has not marked as done. */
  private open<T extends Named>(kind: SessionEntryKind, ids: number[], entries: T[]): T[] {
    return entries.filter((entry) => ids.includes(entry.id) && !this.is(kind, entry.id, 'done'));
  }
}

function questTile(quest: Quest): Tile {
  return { id: quest.id, name: quest.name, text: summaryOf(quest), kicker: questLabel(quest) };
}

function eventTile(event: Named): Tile {
  return { id: event.id, name: event.name, text: summaryOf(event), kicker: 'Ereignis' };
}
