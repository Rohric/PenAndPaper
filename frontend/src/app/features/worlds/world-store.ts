import { Injectable, WritableSignal, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';

import { readError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import {
  Chapter, EntryRef, EntryTexts, Location, Option, Quest, Scene, Trivia, World, WorldEvent, WorldNpc, questLabel,
} from '../../core/models';

/** The lists inside a world, named like their part of the API address. */
export type Kind = 'locations' | 'world-npcs' | 'quests' | 'events' | 'trivia' | 'chapters' | 'scenes';

interface Entry {
  id: number;
}

interface WorldData {
  world: World;
  locations: Location[];
  npcs: WorldNpc[];
  quests: Quest[];
  events: WorldEvent[];
  trivia: Trivia[];
  chapters: Chapter[];
  scenes: Scene[];
}

type Sorter = (a: never, b: never) => number;

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
const HINT_LENGTH = 90;

/** The beginning of what is written about an entry, as context in a list to choose from. */
function excerpt(entry: EntryTexts): string {
  const text = (entry.description || entry.gm_knowledge[0]?.text || '').replace(/\s+/g, ' ').trim();
  return text.length > HINT_LENGTH ? `${text.slice(0, HINT_LENGTH)} …` : text;
}

/** Order of each list, matching the order the backend uses. */
const SORTERS: Record<Kind, Sorter> = {
  locations: byName as Sorter,
  'world-npcs': byName as Sorter,
  quests: byName as Sorter,
  events: byName as Sorter,
  trivia: byName as Sorter,
  chapters: ((a: Chapter, b: Chapter) => a.number - b.number) as Sorter,
  scenes: ((a: Scene, b: Scene) => a.position - b.position || a.id - b.id) as Sorter,
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
  readonly trivia = signal<Trivia[]>([]);
  readonly chapters = signal<Chapter[]>([]);
  /** The scenes of all chapters, so every entry can show where it appears. */
  readonly scenes = signal<Scene[]>([]);
  readonly error = signal('');
  /** The entry that is looked up in the side panel, without leaving the page. */
  readonly peek = signal<EntryRef | null>(null);
  /** Set by a session: how a scene is opened there, instead of going to its chapter page. */
  openScene: ((sceneId: number) => void) | null = null;

  readonly locationOptions = computed<Option[]>(() =>
    this.locations().map((l) => ({ id: l.id, label: l.name, hint: this.parentHint(l) || excerpt(l) })),
  );
  /** Characters by their own id, because quests and scenes point to the character. */
  readonly npcOptions = computed<Option[]>(() => this.npcs().map((n) => ({ id: n.npc, label: n.name, hint: n.profession })));
  readonly questOptions = computed<Option[]>(() =>
    this.quests().map((q) => ({ id: q.id, label: q.name, hint: [questLabel(q), excerpt(q)].filter(Boolean).join(' · ') })),
  );
  readonly eventOptions = computed<Option[]>(() => this.events().map((e) => ({ id: e.id, label: e.name, hint: excerpt(e) })));
  readonly triviaOptions = computed<Option[]>(() =>
    this.trivia().map((t) => ({ id: t.id, label: t.name, hint: [t.category, excerpt(t)].filter(Boolean).join(' · ') })),
  );

  private readonly lists: Record<Kind, WritableSignal<Entry[]>> = {
    locations: this.locations,
    'world-npcs': this.npcs,
    quests: this.quests,
    events: this.events,
    trivia: this.trivia,
    chapters: this.chapters,
    scenes: this.scenes,
  };

  /** Load the world and all of its lists. */
  load(worldId: number): void {
    const list = <T>(kind: string) => this.api.get<T[]>(`worlds/${worldId}/${kind}/`);
    forkJoin({
      world: this.api.get<World>(`worlds/${worldId}/`),
      locations: list<Location>('locations'),
      npcs: list<WorldNpc>('world-npcs'),
      quests: list<Quest>('quests'),
      events: list<WorldEvent>('events'),
      trivia: list<Trivia>('trivia'),
      chapters: list<Chapter>('chapters'),
      scenes: list<Scene>('scenes'),
    }).subscribe({ next: (data) => this.fill(data), error: (e: unknown) => this.error.set(readError(e)) });
  }

  /** Create an entry in one of the lists of the world. */
  add<T extends Entry>(kind: Exclude<Kind, 'scenes'>, body: unknown): Observable<T> {
    return this.created(kind, this.api.post<T>(`worlds/${this.worldId()}/${kind}/`, body));
  }

  /** Create a scene; scenes are created inside their chapter. */
  addScene(chapterId: number, body: Partial<Scene>): Observable<Scene> {
    return this.created('scenes', this.api.post<Scene>(`chapters/${chapterId}/scenes/`, body));
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

  /** The scenes of one chapter in their order. */
  scenesOf(chapterId: number): Scene[] {
    return this.scenes().filter((scene) => scene.chapter === chapterId);
  }

  private parentHint(location: Location): string {
    const parent = this.locations().find((other) => other.id === location.parent);
    return parent ? `in ${parent.name}` : '';
  }

  private created<T extends Entry>(kind: Kind, request: Observable<T>): Observable<T> {
    return request.pipe(tap((entry) => this.put(kind, [...this.lists[kind](), entry])));
  }

  private put(kind: Kind, entries: Entry[]): void {
    this.lists[kind].set([...entries].sort(SORTERS[kind] as (a: Entry, b: Entry) => number));
  }

  private fill(data: WorldData): void {
    this.world.set(data.world);
    this.locations.set(data.locations);
    this.npcs.set(data.npcs);
    this.quests.set(data.quests);
    this.events.set(data.events);
    this.trivia.set(data.trivia);
    this.chapters.set(data.chapters);
    this.put('scenes', data.scenes);
    this.error.set('');
  }
}
