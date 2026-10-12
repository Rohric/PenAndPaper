import { Injectable, WritableSignal, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';

import { readError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { Chapter, Location, Option, Quest, TimelineEntry, World, WorldEvent, WorldNpc } from '../../core/models';

/** The lists inside a world, named like their part of the API address. */
export type Kind = 'locations' | 'world-npcs' | 'quests' | 'events' | 'timeline' | 'chapters';

interface Entry {
  id: number;
}

type Sorter = (a: never, b: never) => number;

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/** Order of each list, matching the order the backend uses. */
const SORTERS: Record<Kind, Sorter> = {
  locations: byName as Sorter,
  'world-npcs': byName as Sorter,
  quests: byName as Sorter,
  events: byName as Sorter,
  timeline: ((a: TimelineEntry, b: TimelineEntry) => a.day - b.day || a.id - b.id) as Sorter,
  chapters: ((a: Chapter, b: Chapter) => a.number - b.number) as Sorter,
};

/** Everything of the opened world, loaded once and kept in sync while the user edits. */
@Injectable()
export class WorldStore {
  private readonly api = inject(ApiService);

  readonly world = signal<World | null>(null);
  readonly locations = signal<Location[]>([]);
  readonly npcs = signal<WorldNpc[]>([]);
  readonly quests = signal<Quest[]>([]);
  readonly events = signal<WorldEvent[]>([]);
  readonly timeline = signal<TimelineEntry[]>([]);
  readonly chapters = signal<Chapter[]>([]);
  readonly error = signal('');

  readonly locationOptions = computed<Option[]>(() => this.locations().map((l) => ({ id: l.id, label: l.name })));
  /** Characters by their own id, because quests and scenes point to the character. */
  readonly npcOptions = computed<Option[]>(() => this.npcs().map((n) => ({ id: n.npc, label: n.name })));
  readonly questOptions = computed<Option[]>(() => this.quests().map((q) => ({ id: q.id, label: q.name })));
  readonly eventOptions = computed<Option[]>(() => this.events().map((e) => ({ id: e.id, label: e.name })));

  private readonly lists: Record<Kind, WritableSignal<Entry[]>> = {
    locations: this.locations,
    'world-npcs': this.npcs,
    quests: this.quests,
    events: this.events,
    timeline: this.timeline,
    chapters: this.chapters,
  };

  /** Load the world and all of its lists. */
  load(worldId: number): void {
    const list = <T>(kind: Kind) => this.api.get<T[]>(`worlds/${worldId}/${kind}/`);
    forkJoin({
      world: this.api.get<World>(`worlds/${worldId}/`),
      locations: list<Location>('locations'),
      npcs: list<WorldNpc>('world-npcs'),
      quests: list<Quest>('quests'),
      events: list<WorldEvent>('events'),
      timeline: list<TimelineEntry>('timeline'),
      chapters: list<Chapter>('chapters'),
    }).subscribe({ next: (data) => this.fill(data), error: (e: unknown) => this.error.set(readError(e)) });
  }

  /** Create an entry in one of the lists. */
  add<T extends Entry>(kind: Kind, body: unknown): Observable<T> {
    return this.api
      .post<T>(`worlds/${this.worldId()}/${kind}/`, body)
      .pipe(tap((entry) => this.put(kind, [...this.lists[kind](), entry])));
  }

  /** Save changes of one entry. */
  save<T extends Entry>(kind: Kind, id: number, changes: unknown): Observable<T> {
    return this.api
      .patch<T>(`${kind}/${id}/`, changes)
      .pipe(tap((entry) => this.put(kind, this.lists[kind]().map((old) => (old.id === id ? entry : old)))));
  }

  /** Delete one entry, then reload, because other entries may have pointed to it. */
  remove(kind: Kind, id: number): Observable<void> {
    return this.api.delete(`${kind}/${id}/`).pipe(tap(() => this.load(this.worldId())));
  }

  /** Change an entry only locally, after another endpoint already saved it. */
  patchLocal(kind: Kind, id: number, changes: object): void {
    this.put(kind, this.lists[kind]().map((old) => (old.id === id ? { ...old, ...changes } : old)));
  }

  /** Save name or lore of the world itself. */
  saveWorld(changes: Partial<World>): Observable<World> {
    return this.api.patch<World>(`worlds/${this.worldId()}/`, changes).pipe(tap((world) => this.world.set(world)));
  }

  /** Delete the whole world. */
  removeWorld(): Observable<void> {
    return this.api.delete(`worlds/${this.worldId()}/`);
  }

  /** Id of the loaded world; the lists can only be used after load(). */
  worldId(): number {
    return this.world()?.id ?? 0;
  }

  private put(kind: Kind, entries: Entry[]): void {
    this.lists[kind].set([...entries].sort(SORTERS[kind] as (a: Entry, b: Entry) => number));
  }

  private fill(data: {
    world: World;
    locations: Location[];
    npcs: WorldNpc[];
    quests: Quest[];
    events: WorldEvent[];
    timeline: TimelineEntry[];
    chapters: Chapter[];
  }): void {
    this.world.set(data.world);
    this.locations.set(data.locations);
    this.npcs.set(data.npcs);
    this.quests.set(data.quests);
    this.events.set(data.events);
    this.timeline.set(data.timeline);
    this.chapters.set(data.chapters);
    this.error.set('');
  }
}
