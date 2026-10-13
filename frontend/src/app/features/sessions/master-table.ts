import { Component, TemplateRef, computed, effect, inject, model, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EntryKind, EntryRef, Scene } from '../../core/models';
import { SessionEntryKind } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { Popup } from '../../shared/popup';
import { Portrait } from '../../shared/portrait';
import { KIND_LABELS, isItem, summaryOf, viewOf } from '../worlds/entry-views';
import { WorldStore } from '../worlds/world-store';
import { CharacterPanel, CharacterTile } from './character-tile';
import { CockpitTools, Tool } from './cockpit-tools';
import { SessionCard } from './session-card';
import { SESSION_KINDS, SessionStore } from './session-store';

/** The name of the group for what lies on the table without a group of its own. */
const NO_GROUP = '';
const MAX_FOUND = 30;
const MAX_GROUP_NAME = 60;
const DRAWER_KEY = 'pnp.master.drawer.';

/** The drawers under the table: one kind of entry each. */
type Drawer = 'scenes' | 'quests' | 'events' | 'npcs' | 'locations' | 'items' | 'trivia';

const DRAWERS: { id: Drawer; label: string }[] = [
  { id: 'scenes', label: 'Szenen' },
  { id: 'quests', label: 'Quests' },
  { id: 'events', label: 'Ereignisse' },
  { id: 'npcs', label: 'Figuren' },
  { id: 'locations', label: 'Orte' },
  { id: 'items', label: 'Gegenstände' },
  { id: 'trivia', label: 'Wissen' },
];

/** A group of the table with the entries in it. */
interface TableGroup {
  name: string;
  entries: { ref: EntryRef; kind: SessionEntryKind }[];
}

/** What a connected entry is called and says, for the head of "Dazu gehört". */
interface Head {
  kicker: string;
  name: string;
  text: string;
  readAloud: boolean;
}

/** The kind of a world entry for a kind of the session. */
const WORLD_KINDS: Record<SessionEntryKind, EntryKind> = {
  scene: 'scenes', quest: 'quests', event: 'events', location: 'locations', npc: 'npcs', trivia: 'trivia',
};

/**
 * The master mode, "the table": quick access to everything of the world, to look at and to use, never to edit.
 * It does not follow the scene of the story. A search over the world, "Dazu gehört" to click through the
 * connections of an entry, the groups of the game master's own table, one drawer for each kind of entry,
 * the notes of the session on the left and the characters of the group on the right.
 * Whatever is laid on the table and every note is stored with the session; nothing here changes the world.
 */
@Component({
  selector: 'app-master-table',
  imports: [FormsModule, Icon, Popup, Portrait, CharacterTile, SessionCard],
  templateUrl: './master-table.html',
  styleUrl: './master-table.scss',
})
export class MasterTable {
  protected readonly store = inject(SessionStore);
  private readonly world = inject(WorldStore);

  /** The entry whose connections are shown; the cockpit can set it, for example from a link to a scene. */
  readonly focus = model<EntryRef | null>(null);
  /** Asks the cockpit to open the sheet, the messages or the item form of a character. */
  readonly open = output<{ kind: CharacterPanel; characterId: number }>();
  /** Asks the cockpit to open a note of the session; null is a new one. */
  readonly note = output<number | null>();
  /** Asks the cockpit to show an entry to read, without editing. */
  readonly look = output<EntryRef>();
  /** Asks the cockpit to go to the place where the entry can be edited. */
  readonly jump = output<EntryRef>();

  protected readonly drawers = DRAWERS;
  protected readonly query = signal('');
  protected readonly target = signal(NO_GROUP);
  protected readonly draft = signal('');
  protected readonly drawer = signal<Drawer | null>('scenes');
  // The filters of the drawers and of the search.
  protected readonly onlyOpen = signal(true);
  protected readonly onlyShared = signal(false);
  protected readonly onlyPinned = signal(false);
  protected readonly onlyChapter = signal(true);
  /** The entries looked at one after the other, so there is a way back. */
  private readonly trail = signal<EntryRef[]>([]);
  protected readonly canGoBack = computed(() => this.trail().length > 0);
  /** Groups that were made but hold nothing yet; they are only kept until the page is left. */
  private readonly empty = signal<string[]>([]);
  /** The character whose popup is open, and the button it opens at. */
  protected readonly characterId = signal<number | null>(null);
  protected readonly characterAnchor = signal<HTMLElement | null>(null);

  private readonly addList = viewChild<TemplateRef<unknown>>('addList');
  private readonly newGroup = viewChild<TemplateRef<unknown>>('newGroup');

  protected readonly characters = computed(() => this.store.characters());
  protected readonly openCharacter = computed(() => this.characters().find((character) => character.id === this.characterId()) ?? null);
  protected readonly chapterId = computed(() => this.store.session()?.chapter ?? this.world.chapters()[0]?.id ?? null);

  protected readonly head = computed<Head | null>(() => {
    const focus = this.focus();
    return focus ? this.headOf(focus) : null;
  });
  /** The connections of the focused entry in groups, each a list of entries to click on. */
  protected readonly connections = computed(() => {
    const focus = this.focus();
    return focus ? this.connectionsOf(focus).filter((group) => group.refs.length) : [];
  });
  /** What the search finds, with the filters applied; empty while nothing is typed. */
  protected readonly found = computed<EntryRef[]>(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return [];
    }
    const refs = DRAWERS.flatMap((drawer) => this.refsOf(drawer.id));
    return refs.filter((ref) => (this.headOf(ref)?.name ?? '').toLowerCase().includes(query)).slice(0, MAX_FOUND);
  });
  /** The entries of the open drawer, with the filters applied. */
  protected readonly shelf = computed<EntryRef[]>(() => {
    const drawer = this.drawer();
    return drawer ? this.refsOf(drawer) : [];
  });
  protected readonly counts = computed(() => Object.fromEntries(DRAWERS.map((drawer) => [drawer.id, this.refsOf(drawer.id).length])));

  /** The groups of the table, in the order of their names; what has no group comes first. */
  protected readonly groups = computed<TableGroup[]>(() => {
    const onTable = this.store.entries().filter((entry) => entry.on_table);
    return this.groupNames()
      .map((name) => ({
        name,
        entries: onTable
          .filter((entry) => entry.table_group === name)
          .map((entry) => ({ ref: { kind: WORLD_KINDS[entry.kind], id: entry.entry_id }, kind: entry.kind })),
      }))
      .filter((group) => group.entries.length || this.empty().includes(group.name));
  });
  protected readonly groupNames = computed(() => {
    const names = new Set<string>([NO_GROUP, ...this.empty(), ...this.store.entries().filter((entry) => entry.on_table).map((entry) => entry.table_group)]);
    return [...names].sort((a, b) => Number(!!a) - Number(!!b) || a.localeCompare(b));
  });
  /** Notes of the session, and the entries that carry a note of the game master. */
  protected readonly notes = computed(() => this.store.notes());
  protected readonly noted = computed(() =>
    this.store.entries().filter((entry) => entry.gm_note.trim()).map((entry) => ({
      ref: { kind: WORLD_KINDS[entry.kind], id: entry.entry_id } as EntryRef,
      name: this.headOf({ kind: WORLD_KINDS[entry.kind], id: entry.entry_id })?.name ?? 'Eintrag',
      text: entry.gm_note,
    })),
  );
  /** Entries of the world whose name contains the typed text, for the popup "Auf den Tisch". */
  protected readonly results = computed(() => {
    const query = this.draftQuery().trim().toLowerCase();
    if (!query) {
      return [];
    }
    const all = DRAWERS.flatMap((drawer) => this.allRefs(drawer.id));
    return all
      .map((ref) => ({ ref, head: this.headOf(ref) }))
      .filter((found) => found.head && found.head.name.toLowerCase().includes(query))
      .slice(0, 12);
  });
  protected readonly draftQuery = signal('');
  /** The kind picked in the popup "Auf den Tisch" to choose from a list instead of searching. */
  protected readonly pickedKind = signal<Drawer | ''>('');
  protected readonly choices = computed(() => {
    const kind = this.pickedKind();
    return kind ? this.allRefs(kind).map((ref) => ({ ref, head: this.headOf(ref) })).filter((choice) => choice.head) : [];
  });

  protected readonly tools = computed<Tool[]>(() => [
    { id: 'table-add', word: 'Auf Tisch', title: 'Auf den Tisch legen', icon: 'plus', popup: this.addList(), popupTitle: 'Auf den Tisch legen' },
    { id: 'table-group', word: 'Gruppe neu', title: 'Neue Gruppe anlegen', icon: 'flag', popup: this.newGroup(), popupTitle: 'Neue Gruppe' },
    { id: 'table-open', word: 'Offen', title: 'Erledigtes ausblenden', icon: 'check', pressed: this.onlyOpen(), click: () => this.onlyOpen.set(!this.onlyOpen()) },
    { id: 'table-shared', word: 'Geteilt', title: 'Nur für Spieler sichtbare', icon: 'eye', pressed: this.onlyShared(), click: () => this.onlyShared.set(!this.onlyShared()) },
    { id: 'table-pinned', word: 'Angepinnt', title: 'Nur angepinnte', icon: 'pin', pressed: this.onlyPinned(), click: () => this.onlyPinned.set(!this.onlyPinned()) },
    { id: 'table-chapter', word: 'Kapitel', title: 'Nur dieses Kapitel', icon: 'book', pressed: this.onlyChapter(), click: () => this.onlyChapter.set(!this.onlyChapter()) },
  ]);

  constructor() {
    inject(CockpitTools).provide('view', this.tools);
    // The open drawer is remembered for each session.
    effect(() => {
      const id = this.store.session()?.id;
      if (id !== undefined) {
        this.drawer.set(this.savedDrawer(id));
      }
    });
  }

  /** The name of a group as it is shown. */
  protected label(name: string): string {
    return name || 'Ohne Gruppe';
  }

  /** Open a drawer, or close it when it is the open one. */
  protected toggleDrawer(drawer: Drawer): void {
    const next = this.drawer() === drawer ? null : drawer;
    this.drawer.set(next);
    const id = this.store.session()?.id;
    if (id !== undefined) {
      this.save(id, next);
    }
  }

  /** Click on a card: its connections come into view. */
  protected pick(ref: EntryRef): void {
    const now = this.focus();
    if (now && (now.kind !== ref.kind || now.id !== ref.id)) {
      this.trail.update((trail) => [...trail, now]);
    }
    this.focus.set(ref);
  }

  /** Go back to the entry looked at before. */
  protected back(): void {
    const before = this.trail().at(-1);
    if (before) {
      this.trail.update((trail) => trail.slice(0, -1));
      this.focus.set(before);
    }
  }

  /** Stop looking at the connections of an entry. */
  protected clearFocus(): void {
    this.trail.set([]);
    this.focus.set(null);
  }

  /** Lay an entry of the world on the table, in a group. */
  protected lay(ref: EntryRef, group: string): void {
    const kind = SESSION_KINDS[ref.kind];
    if (kind) {
      this.store.patch(kind, ref.id, { on_table: true, table_group: group });
    }
  }

  /** A card asked for the table: lay it into the chosen group, or take it off when it lies there. */
  protected toggleTable(ref: EntryRef): void {
    const kind = SESSION_KINDS[ref.kind];
    if (!kind) {
      return;
    }
    if (this.store.state(kind, ref.id)?.on_table) {
      this.take({ kind, ref });
    } else {
      this.lay(ref, this.target());
    }
  }

  /** Lay the focused entry and everything connected to it on the table, in a group named like the entry. */
  protected layAll(): void {
    const focus = this.focus();
    if (!focus) {
      return;
    }
    const name = (this.head()?.name ?? 'Gruppe').slice(0, MAX_GROUP_NAME);
    const refs = [focus, ...this.connections().flatMap((group) => group.refs)];
    refs.forEach((ref) => this.lay(ref, name));
  }

  /** Put an entry of the table into another group. */
  protected move(item: { kind: SessionEntryKind; ref: EntryRef }, group: string): void {
    this.store.patch(item.kind, item.ref.id, { table_group: group });
  }

  /** Take an entry off the table. */
  protected take(item: { kind: SessionEntryKind; ref: EntryRef }): void {
    this.store.patch(item.kind, item.ref.id, { on_table: false, table_group: NO_GROUP });
  }

  /** Make a group by its name and aim the next entry at it. */
  protected createGroup(): void {
    const name = this.draft().trim().slice(0, MAX_GROUP_NAME);
    if (name) {
      this.empty.update((names) => (names.includes(name) ? names : [...names, name]));
      this.target.set(name);
      this.draft.set('');
    }
  }

  /** Open the popup of a character at its round button, or close it again. */
  protected toggleCharacter(id: number, event: MouseEvent): void {
    this.characterAnchor.set(event.currentTarget as HTMLElement);
    this.characterId.set(this.characterId() === id ? null : id);
  }

  /** The share of the life points a character has left, for the thin bar under its button. */
  protected life(id: number): number {
    const character = this.characters().find((other) => other.id === id);
    return character?.max_life_points ? Math.min(100, Math.max(0, (character.life_points / character.max_life_points) * 100)) : 0;
  }

  /** Every entry of a drawer, without any filter. */
  private allRefs(drawer: Drawer): EntryRef[] {
    const world = this.world;
    switch (drawer) {
      case 'scenes':
        return this.orderedScenes().map((scene): EntryRef => ({ kind: 'scenes', id: scene.id }));
      case 'quests':
        return world.quests().map((quest): EntryRef => ({ kind: 'quests', id: quest.id }));
      case 'events':
        return world.events().map((event): EntryRef => ({ kind: 'events', id: event.id }));
      case 'npcs':
        return world.npcs().map((link): EntryRef => ({ kind: 'npcs', id: link.npc }));
      case 'locations':
        return world.locations().map((place): EntryRef => ({ kind: 'locations', id: place.id }));
      case 'items':
        return world.trivia().filter(isItem).map((entry): EntryRef => ({ kind: 'trivia', id: entry.id }));
      default:
        return world.trivia().filter((entry) => !isItem(entry)).map((entry): EntryRef => ({ kind: 'trivia', id: entry.id }));
    }
  }

  /** The entries of a drawer that pass the filters. */
  private refsOf(drawer: Drawer): EntryRef[] {
    return this.allRefs(drawer).filter((ref) => this.passes(ref));
  }

  /** Whether an entry passes the four filters. */
  private passes(ref: EntryRef): boolean {
    const kind = SESSION_KINDS[ref.kind];
    const state = kind ? this.store.state(kind, ref.id) : undefined;
    const tracked = ['scenes', 'quests', 'events'].includes(ref.kind);
    const opened = !this.onlyOpen() || !tracked || !state?.done;
    const shared = !this.onlyShared() || ref.kind === 'scenes' || !!state?.revealed;
    const pinned = !this.onlyPinned() || !!state?.pinned;
    return opened && shared && pinned && (!this.onlyChapter() || this.inChapter(ref));
  }

  /** Whether an entry belongs to the chapter of the session; kinds without a chapter always do. */
  private inChapter(ref: EntryRef): boolean {
    const chapter = this.world.chapters().find((other) => other.id === this.chapterId());
    if (!chapter || !['scenes', 'quests', 'events'].includes(ref.kind)) {
      return true;
    }
    const scenes = this.world.scenesOf(chapter.id);
    if (ref.kind === 'scenes') {
      return scenes.some((scene) => scene.id === ref.id);
    }
    const list = ref.kind === 'quests' ? chapter.quests : chapter.events;
    const ofScene = (scene: Scene) => (ref.kind === 'quests' ? scene.quests : scene.events).includes(ref.id);
    return list.includes(ref.id) || scenes.some(ofScene);
  }

  /** The scenes of the world in the order of their chapters and threads. */
  private orderedScenes(): Scene[] {
    const number = (scene: Scene) => this.world.chapters().find((chapter) => chapter.id === scene.chapter)?.number ?? 0;
    return [...this.world.scenes()].sort((a, b) => number(a) - number(b) || a.position - b.position);
  }

  /** Name, kind and a short text of an entry. */
  private headOf(ref: EntryRef): Head | null {
    const world = this.world;
    const kicker = KIND_LABELS[ref.kind] ?? '';
    switch (ref.kind) {
      case 'scenes': {
        const scene = world.scenes().find((other) => other.id === ref.id);
        return scene ? { kicker, name: scene.name, text: scene.to_read || scene.description, readAloud: !!scene.to_read } : null;
      }
      case 'npcs': {
        const link = world.npcs().find((other) => other.npc === ref.id);
        return link ? { kicker, name: link.name, text: link.profession, readAloud: false } : null;
      }
      default: {
        const lists = { locations: world.locations(), quests: world.quests(), events: world.events(), trivia: world.trivia() };
        const entry = (lists[ref.kind as keyof typeof lists] ?? []).find((other) => other.id === ref.id);
        return entry ? { kicker, name: entry.name, text: summaryOf(entry), readAloud: false } : null;
      }
    }
  }

  /** The connections of an entry, labelled; scenes are built here, everything else comes from the reading view. */
  private connectionsOf(ref: EntryRef): { label: string; refs: EntryRef[] }[] {
    if (ref.kind === 'scenes') {
      return this.sceneConnections(ref.id);
    }
    return (viewOf(this.world, ref, null)?.links ?? []).map((group) => ({
      label: group.label,
      refs: group.items.filter((item) => item.kind !== 'chapters').map((item): EntryRef => ({ kind: item.kind, id: item.id })),
    }));
  }

  private sceneConnections(id: number): { label: string; refs: EntryRef[] }[] {
    const scene = this.world.scenes().find((other) => other.id === id);
    if (!scene) {
      return [];
    }
    const of = (kind: EntryKind, ids: number[]): EntryRef[] => ids.map((entry) => ({ kind, id: entry }));
    const trivia = this.world.trivia().filter((entry) => scene.trivia.includes(entry.id));
    const quests = this.world.quests().filter((quest) => scene.quests.includes(quest.id) || this.world.questNow(quest).scene === scene.id);
    return [
      { label: 'Ort', refs: of('locations', scene.location ? [scene.location] : []) },
      { label: 'Figuren', refs: of('npcs', scene.npcs) },
      { label: 'Quests', refs: of('quests', quests.map((quest) => quest.id)) },
      { label: 'Ereignisse', refs: of('events', scene.events) },
      { label: 'Gegenstände', refs: of('trivia', trivia.filter(isItem).map((entry) => entry.id)) },
      { label: 'Wissen', refs: of('trivia', trivia.filter((entry) => !isItem(entry)).map((entry) => entry.id)) },
      { label: 'Führt zu', refs: of('scenes', scene.leads_to) },
    ];
  }

  private savedDrawer(sessionId: number): Drawer | null {
    try {
      const saved = localStorage.getItem(DRAWER_KEY + sessionId);
      if (saved === 'none') {
        return null;
      }
      return DRAWERS.some((drawer) => drawer.id === saved) ? (saved as Drawer) : 'scenes';
    } catch {
      return 'scenes';
    }
  }

  private save(sessionId: number, drawer: Drawer | null): void {
    try {
      localStorage.setItem(DRAWER_KEY + sessionId, drawer ?? 'none');
    } catch {
      // The drawer is only a convenience; without storage it simply starts with the scenes next time.
    }
  }
}
