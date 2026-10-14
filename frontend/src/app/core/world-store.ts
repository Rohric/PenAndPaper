import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';

import { readError } from './api-error';
import { ApiService } from './api.service';
import { withChanges } from './round';
import { sameItems } from './same';
import { EntryChanges, SessionEntryKind } from './session-models';
import { categoriesOf } from './wall';
import {
  Chapter, EntryRef, EntryTexts, Location, Option, Peek, Quest, Scene, Trivia, World, WorldEvent, WorldNpc, isItem, questLabel,
} from './models';

/** The lists inside a world, named like their part of the API address. */
export type Kind = 'locations' | 'world-npcs' | 'quests' | 'events' | 'trivia' | 'chapters' | 'scenes';

/** What a round has different about one entry of the world; nothing while the world is written. */
export type ChangesOf = (kind: SessionEntryKind, id: number) => EntryChanges | undefined;

/** One entry of any list, as it is written. */
export type WrittenEntry = Location | WorldNpc | Quest | WorldEvent | Trivia | Chapter | Scene;

interface Entry {
  id: number;
  /** Every list of the world has it; a body sent to create one may leave it out. */
  category?: string;
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
/** The lists of a chapter that tag entries with it. */
type TagList = 'locations' | 'npcs' | 'quests' | 'events' | 'trivia';

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
const HINT_LENGTH = 90;
const NO_CHANGES: ChangesOf = () => undefined;
/** Whether an entry was made up in a round; an entry of the world has no round. */
const madeUp = (entry: { session?: number | null }) => !!entry.session;

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

/**
 * Everything of the opened world, loaded once and kept in sync while the user edits. The cockpit of a round opens
 * it with that round: then it also holds what the round made up, shows every entry with the texts the round changed,
 * and everything it writes belongs to that round. The pages that write the world never name a round.
 */
@Injectable()
export class WorldStore {
  private readonly api = inject(ApiService);

  /** The lists as the server sends them: the world and, in a round, what the round made up. */
  private readonly loaded = {
    locations: signal<Location[]>([]),
    npcs: signal<WorldNpc[]>([]),
    quests: signal<Quest[]>([]),
    events: signal<WorldEvent[]>([]),
    trivia: signal<Trivia[]>([]),
    chapters: signal<Chapter[]>([]),
    scenes: signal<Scene[]>([]),
  };
  /** The round whose own entries are loaded beside the world; null while the world is written. */
  private readonly roundId = signal<number | null>(null);
  /** Set by a round: what it has different about an entry of the world. While the world is written, nothing. */
  readonly roundChanges = signal<ChangesOf>(NO_CHANGES);
  /** Every entry as the round changed it last, with its changes as text, so the same changes give the same object. */
  private readonly changedOnce = new WeakMap<object, { key: string; entry: object }>();

  readonly world = signal<World | null>(null);
  // Every list as it counts right now: in a round with what the round changed. The forms edit "written".
  readonly locations = this.played(this.loaded.locations, 'location');
  readonly npcs = this.played(this.loaded.npcs, 'npc', (link) => link.npc);
  readonly quests = this.played(this.loaded.quests, 'quest');
  readonly events = this.played(this.loaded.events, 'event');
  readonly trivia = this.played(this.loaded.trivia, 'trivia');
  readonly chapters = this.loaded.chapters.asReadonly();
  /** The scenes of all chapters, so every entry can show where it appears. */
  readonly scenes = this.played(this.loaded.scenes, 'scene');
  /** The lists as they are written, without what a round changed. */
  readonly written = {
    locations: this.loaded.locations.asReadonly(),
    npcs: this.loaded.npcs.asReadonly(),
    quests: this.loaded.quests.asReadonly(),
    events: this.loaded.events.asReadonly(),
    trivia: this.loaded.trivia.asReadonly(),
    chapters: this.loaded.chapters.asReadonly(),
    scenes: this.loaded.scenes.asReadonly(),
  };
  /** Whether a round is open: then everything new is made up in it, and the world is never written. */
  readonly inRound = computed(() => this.roundId() !== null);

  readonly error = signal('');
  /** The entry in the popup: the short look that every click on a tile or a link opens first. */
  readonly popup = signal<EntryRef | null>(null);
  /** The entry in the window at the side, to read and edit without leaving the page. */
  readonly peek = signal<Peek | null>(null);
  /** Set by a session: the scene that is open, so cards can add entries to it. */
  readonly activeScene = signal<number | null>(null);
  /** Set by a session: how a scene is opened there, instead of going to its chapter page. */
  openScene: ((sceneId: number) => void) | null = null;

  readonly locationOptions = computed<Option[]>(() =>
    this.locations().map((l) => ({ id: l.id, label: l.name, hint: this.parentHint(l) || excerpt(l), tone: 'locations' })),
  );
  /** Characters by their own id, because quests and scenes point to the character. */
  readonly npcOptions = computed<Option[]>(() =>
    this.npcs().map((n) => ({ id: n.npc, label: n.name, hint: n.profession, tone: 'npcs' })),
  );
  readonly questOptions = computed<Option[]>(() =>
    this.quests().map((q) => ({ id: q.id, label: q.name, hint: [questLabel(q), excerpt(q)].filter(Boolean).join(' · '), tone: 'quests' })),
  );
  readonly eventOptions = computed<Option[]>(() =>
    this.events().map((e) => ({ id: e.id, label: e.name, hint: e.trigger || e.happening || excerpt(e), tone: 'events' })),
  );
  readonly triviaOptions = computed<Option[]>(() =>
    this.trivia().map((t) => ({
      id: t.id, label: t.name, hint: [t.category, excerpt(t)].filter(Boolean).join(' · '), tone: isItem(t) ? 'items' : 'trivia',
    })),
  );
  /** The chapters as tags to choose from. */
  readonly chapterOptions = computed<Option[]>(() =>
    this.chapters().map((chapter) => ({ id: chapter.id, label: `Kapitel ${chapter.number}`, hint: chapter.name, tone: 'chapters' })),
  );
  /** Every scene of the world, with its chapter as a hint. */
  readonly sceneOptions = computed<Option[]>(() =>
    this.scenes().map((scene) => ({ id: scene.id, label: scene.name, hint: this.chapterHint(scene), tone: 'scenes' })),
  );

  /** The entries the open round made up, as "kind:id"; characters by their own id. */
  private readonly ownIds = computed(() => {
    const ids = (kind: string, entries: { id: number; session: number | null }[], id = (entry: { id: number }) => entry.id) =>
      entries.filter(madeUp).map((entry) => `${kind}:${id(entry)}`);
    return new Set([
      ...ids('locations', this.loaded.locations()),
      ...ids('npcs', this.loaded.npcs(), (entry) => (entry as WorldNpc).npc),
      ...ids('quests', this.loaded.quests()),
      ...ids('events', this.loaded.events()),
      ...ids('trivia', this.loaded.trivia()),
      ...ids('scenes', this.loaded.scenes()),
    ]);
  });

  private readonly lists: Record<Kind, WritableSignal<Entry[]>> = {
    locations: this.loaded.locations,
    'world-npcs': this.loaded.npcs,
    quests: this.loaded.quests,
    events: this.loaded.events,
    trivia: this.loaded.trivia,
    chapters: this.loaded.chapters,
    scenes: this.loaded.scenes,
  };

  /** Load the world and all of its lists; an open round adds what it made up. */
  load(worldId: number): void {
    const list = <T>(kind: Kind) => this.api.get<T[]>(this.listUrl(kind, worldId));
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

  /**
   * Load the world together with what one round made up. Only the cockpit of a round does this; from now on
   * everything this store creates, saves and deletes belongs to that round, and the world stays as it is.
   */
  openRound(worldId: number, sessionId: number): void {
    this.roundId.set(sessionId);
    this.load(worldId);
  }

  /** Whether an entry was made up in the open round ("Nur diese Runde"); an entry of the world never was. */
  ofRound(ref: EntryRef): boolean {
    return this.ownIds().has(`${ref.kind}:${ref.id}`);
  }

  /** Whether an entry may be written here: every entry while the world is written, only its own ones in a round. */
  mayWrite(ref: EntryRef): boolean {
    return !this.inRound() || this.ofRound(ref);
  }

  /** One entry as it is written, without what the round changed; null when there is no such entry. */
  asWritten(ref: EntryRef): WrittenEntry | null {
    if (ref.kind === 'npcs') {
      return this.loaded.npcs().find((link) => link.npc === ref.id) ?? null;
    }
    const list = this.loaded[ref.kind]() as { id: number }[];
    return (list.find((entry) => entry.id === ref.id) as WrittenEntry | undefined) ?? null;
  }

  /**
   * Follow a click on a tile or a link by the rule of the windows: it opens the popup first. While the window
   * at the side is open, the click changes what that window shows.
   */
  look(ref: EntryRef): void {
    const target = { kind: ref.kind, id: ref.id };
    if (this.peek()) {
      this.peek.set(target);
    } else {
      this.popup.set(target);
    }
  }

  /** Go on into the window at the side to read the entry, or to edit it; the popup closes. */
  read(ref: EntryRef, edit = false): void {
    this.popup.set(null);
    this.peek.set({ kind: ref.kind, id: ref.id, edit });
  }

  /** Close both windows of the entries, when the page moves on. */
  closeWindows(): void {
    this.popup.set(null);
    this.peek.set(null);
  }

  /** Create an entry in one of the lists of the world, or of the open round. */
  add<T extends Entry>(kind: Exclude<Kind, 'scenes'>, body: unknown): Observable<T> {
    return this.created(kind, this.api.post<T>(this.listUrl(kind, this.worldId()), body));
  }

  /** Create a scene; scenes are created inside their chapter, in a round as a scene of that round. */
  addScene(chapterId: number, body: Partial<Scene>): Observable<Scene> {
    return this.created('scenes', this.api.post<Scene>(this.scoped(`chapters/${chapterId}/scenes/`, 'scenes'), body));
  }

  /** The categories the entries of one list already have, to offer them while typing a new one. */
  categoriesOf(kind: Kind): string[] {
    return categoriesOf(this.lists[kind]().map((entry) => ({ category: entry.category ?? '' })));
  }

  /** Save changes of one entry. */
  save<T extends Entry>(kind: Kind, id: number, changes: unknown): Observable<T> {
    return this.api
      .patch<T>(this.scoped(`${kind}/${id}/`, kind), changes)
      .pipe(
        tap((entry) => this.put(kind, this.lists[kind]().map((old) => (old.id === id ? entry : old)))),
        tap(() => this.followTags(kind, changes)),
      );
  }

  /** Delete one entry, then reload, because other entries may have pointed to it. */
  remove(kind: Kind, id: number): Observable<void> {
    return this.api.delete(this.scoped(`${kind}/${id}/`, kind)).pipe(tap(() => this.load(this.worldId())));
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

  /**
   * A list as the round has it. An entry keeps its object as long as neither it nor its changes are new, and then
   * the list stays the same as well: a poll that changes another mark of the round redraws nothing here.
   */
  private played<T extends { id: number }>(list: Signal<T[]>, kind: SessionEntryKind, idOf: (entry: T) => number = (entry) => entry.id): Signal<T[]> {
    return computed(
      () => {
        const changes = this.roundChanges();
        return list().map((entry) => this.withChangesOnce(kind, entry, changes(kind, idOf(entry))));
      },
      { equal: sameItems },
    );
  }

  /** An entry with the changes of the round, made once for the same entry and the same changes. */
  private withChangesOnce<T extends object>(kind: SessionEntryKind, entry: T, changes: EntryChanges | undefined): T {
    const key = JSON.stringify(changes ?? {});
    const made = this.changedOnce.get(entry);
    if (made?.key === key) {
      return made.entry as T;
    }
    const changed = withChanges(kind, entry, changes);
    this.changedOnce.set(entry, { key, entry: changed });
    return changed;
  }

  /**
   * Keep the chapter tags in step after a save. A scene tags what hangs on it by itself and an entry names its
   * chapters, so the chapters are loaded again; a chapter that was saved is the truth already.
   */
  private followTags(kind: Kind, changes: unknown): void {
    if (kind === 'chapters') {
      this.syncTags();
    } else if (kind === 'scenes' || 'chapters' in (changes as object)) {
      this.api.get<Chapter[]>(`worlds/${this.worldId()}/chapters/`).subscribe((chapters) => {
        this.loaded.chapters.set(chapters);
        this.syncTags();
      });
    }
  }

  /** Write the tags of every entry anew from the lists of the chapters; an entry whose tags stay keeps its object. */
  private syncTags(): void {
    const chapters = this.loaded.chapters();
    const tagged = <T extends { chapters: number[] }>(entry: T, list: TagList, id: number): T => {
      const tags = chapters.filter((chapter) => chapter[list].includes(id)).map((chapter) => chapter.id);
      return tags.join() === entry.chapters.join() ? entry : { ...entry, chapters: tags };
    };
    const lists = this.loaded;
    lists.locations.update((all) => all.map((entry) => tagged(entry, 'locations', entry.id)));
    lists.npcs.update((all) => all.map((entry) => tagged(entry, 'npcs', entry.npc)));
    lists.quests.update((all) => all.map((entry) => tagged(entry, 'quests', entry.id)));
    lists.events.update((all) => all.map((entry) => tagged(entry, 'events', entry.id)));
    lists.trivia.update((all) => all.map((entry) => tagged(entry, 'trivia', entry.id)));
  }

  /** The one place that names the address of a list of the world; reading and creating both use it. */
  private listUrl(kind: Kind, worldId: number): string {
    return this.scoped(`worlds/${worldId}/${kind}/`, kind);
  }

  /** An address with the open round, so what it made up is found and what is new is made up in it. Chapters belong to the world. */
  private scoped(path: string, kind: Kind): string {
    const round = this.roundId();
    return round !== null && kind !== 'chapters' ? `${path}?session=${round}` : path;
  }

  private chapterHint(scene: Scene): string {
    const chapter = this.chapters().find((other) => other.id === scene.chapter);
    return chapter ? `Kapitel ${chapter.number} · ${chapter.name}` : '';
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
    const lists = this.loaded;
    this.world.set(data.world);
    lists.locations.set(data.locations);
    lists.npcs.set(data.npcs);
    lists.quests.set(data.quests);
    lists.events.set(data.events);
    lists.trivia.set(data.trivia);
    lists.chapters.set(data.chapters);
    this.put('scenes', data.scenes);
    this.error.set('');
  }
}
