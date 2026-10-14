import { Component, TemplateRef, computed, effect, inject, model, output, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { readError } from '../../core/api-error';
import { CharacterService } from '../../core/character.service';
import { EntryRef, Scene } from '../../core/models';
import { ENTRY_KINDS, NOTE_TARGETS, NoteTarget, TableGroup, deleteQuestion, noteEntry, tableGroups } from '../../core/round';
import { Note, SessionEntryKind } from '../../core/session-models';
import { Icon } from '../../components/basic/icon';
import { Popup } from '../../components/window/popup';
import { Portrait } from '../../components/basic/portrait';
import { KIND_LABELS, isItem, roundKicker, summaryOf } from '../../components/entry/entry-views';
import { WorldStore } from '../../core/world-store';
import { CharacterPanel, CharacterTile } from '../../components/character/character-tile';
import { barPercent } from '../../components/character/point-bar';
import { Tools, Tool } from '../../global/tool-bar/tools.service';
import { ToastService } from '../../global/toast/toast.service';
import { EntryCard } from '../../components/entry/entry-card';
import { SESSION_KINDS, SessionStore } from '../../core/session-store';
import { TableNote } from './table-note';

/** The name of the group for what lies on the table without a group of its own. */
const NO_GROUP = '';
const MAX_FOUND = 30;
const MAX_GROUP_NAME = 60;
const DRAWER_KEY = 'pnp.master.drawer.';
const FOLDED_KEY = 'pnp.master.folded.';
/** The name a note on the table has until the game master types another. */
const NEW_NOTE = 'Neue Notiz';

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

/** What a connected entry is called and says, for the head of "Dazu gehört". */
interface Head {
  kicker: string;
  name: string;
  text: string;
  readAloud: boolean;
}

/** An entry that was just made from a note: a scene or another entry, or a character by the id of the character. */
interface Made {
  id: number;
  npc?: number;
}

/**
 * The master mode, "the table": quick access to everything of the world, to look at and to use; entries of the world
 * are never edited here. It does not follow the scene of the story. A search over the world, the groups of the game
 * master's own table with entries and notes, one drawer for each kind of entry, the notes of the session on the left
 * and the characters of the group on the right. A note on the table is kept, turned into an entry of the round or
 * deleted. Whatever is laid on the table and every note is stored with the session; nothing here changes the world.
 */
@Component({
  selector: 'app-master-table',
  imports: [FormsModule, Icon, Popup, Portrait, CharacterTile, EntryCard, TableNote],
  templateUrl: './master-table.html',
  styleUrl: './master-table.scss',
})
export class MasterTable {
  protected readonly store = inject(SessionStore);
  private readonly world = inject(WorldStore);
  private readonly characterApi = inject(CharacterService);
  private readonly toast = inject(ToastService);
  /** The name of the second bar of the world; empty when it has none. */
  protected readonly secondBar = computed(() => this.world.world()?.second_bar_name ?? '');

  /** A scene the cockpit asks the master mode to show, for example from a link; it opens in the popup of the scene. */
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
  /** The groups of the table that are folded shut; the device remembers them for each session. */
  private readonly folded = signal<string[]>([]);
  /** Groups that were made but hold nothing yet; they are only kept until the page is left. */
  private readonly empty = signal<string[]>([]);
  /** The character whose popup is open, and the button it opens at. */
  protected readonly characterId = signal<number | null>(null);
  /** The group the question "Gruppe löschen?" is about; null while nobody asks. */
  protected readonly deleting = signal<TableGroup | null>(null);
  /** The note the question "In was umwandeln?" is about; null while nobody asks. */
  protected readonly converting = signal<Note | null>(null);
  protected readonly targets = NOTE_TARGETS;
  /** The note that was just laid on the table; its name gets the cursor. */
  protected readonly freshNote = signal<number | null>(null);

  private readonly addList = viewChild<TemplateRef<unknown>>('addList');
  private readonly newGroup = viewChild<TemplateRef<unknown>>('newGroup');

  /** The scene whose quick view is open, and the symbol it opens at. */
  protected readonly sceneId = signal<number | null>(null);
  protected readonly openScene = computed(() => this.world.scenes().find((scene) => scene.id === this.sceneId()) ?? null);
  /** The scenes of the chapter on the thread of the story, in their order. */
  protected readonly thread = computed(() => this.world.scenesOf(this.chapterId() ?? 0).filter((scene) => !scene.optional));
  /** The scenes of the chapter that belong to no place on the thread; the game master sets them in where they fit. */
  protected readonly loose = computed(() => this.world.scenesOf(this.chapterId() ?? 0).filter((scene) => scene.optional));
  protected readonly characters = computed(() => this.store.characters());
  protected readonly openCharacter = computed(() => this.characters().find((character) => character.id === this.characterId()) ?? null);
  protected readonly chapterId = computed(() => this.store.session()?.chapter ?? this.world.chapters()[0]?.id ?? null);

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

  /** The groups of the table with their entries and notes, in the order of their names; what has no group comes first. */
  protected readonly groups = computed<TableGroup[]>(() => tableGroups(this.store.entries(), this.store.notes(), this.empty()));
  /** Every group an entry can be laid into: "Ohne Gruppe" and the groups of the table. */
  protected readonly groupNames = computed(() => [NO_GROUP, ...this.groups().map((group) => group.name).filter(Boolean)]);
  /** The groups a note can lie in; a note without a group is an ordinary note. */
  protected readonly noteGroups = computed(() => this.groupNames().filter(Boolean));
  /** The notes of the session that do not lie on the table, and the entries that carry a note of the game master. */
  protected readonly notes = computed(() => this.store.keptNotes());
  protected readonly noted = computed(() =>
    this.store.entries().filter((entry) => entry.gm_note.trim()).map((entry) => {
      const ref: EntryRef = { kind: ENTRY_KINDS[entry.kind], id: entry.entry_id };
      return { ref, name: this.headOf(ref)?.name ?? 'Eintrag', text: entry.gm_note };
    }),
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
    { id: 'table-group', word: 'Gruppe neu', title: 'Neue Gruppe anlegen', icon: 'folder', popup: this.newGroup(), popupTitle: 'Neue Gruppe' },
    { id: 'table-open', word: 'Offen', title: 'Erledigtes ausblenden', icon: 'check', pressed: this.onlyOpen(), click: () => this.onlyOpen.set(!this.onlyOpen()) },
    { id: 'table-shared', word: 'Geteilt', title: 'Nur für Spieler sichtbare', icon: 'eye', pressed: this.onlyShared(), click: () => this.onlyShared.set(!this.onlyShared()) },
    { id: 'table-pinned', word: 'Angepinnt', title: 'Nur angepinnte', icon: 'pin', pressed: this.onlyPinned(), click: () => this.onlyPinned.set(!this.onlyPinned()) },
    { id: 'table-chapter', word: 'Kapitel', title: 'Nur dieses Kapitel', icon: 'book', pressed: this.onlyChapter(), click: () => this.onlyChapter.set(!this.onlyChapter()) },
  ]);

  constructor() {
    inject(Tools).provide('view', this.tools);
    // The open drawer is remembered for each session.
    effect(() => {
      const id = this.store.session()?.id;
      if (id !== undefined) {
        this.drawer.set(this.savedDrawer(id));
        this.folded.set(this.savedFolds(id));
      }
    });
    // The cockpit asks for a scene: show it in its popup and take the wish off again.
    effect(() => {
      const wish = this.focus();
      if (wish) {
        untracked(() => this.pick(wish));
        this.focus.set(null);
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

  /** Click on a card: a scene opens in its own popup, everything else in the popup of the entry. */
  protected pick(ref: EntryRef): void {
    if (ref.kind === 'scenes') {
      this.sceneId.set(ref.id);
    } else {
      this.world.look(ref);
    }
  }

  /** Whether a group of the table is folded shut. */
  protected isFolded(group: string): boolean {
    return this.folded().includes(group);
  }

  /** Fold a group of the table shut or open, and remember it on this device. */
  protected toggleFold(group: string): void {
    this.folded.update((names) => (names.includes(group) ? names.filter((name) => name !== group) : [...names, group]));
    this.freshNote.set(null);
    this.saveFolds();
  }

  /** The kind of a scene in the head of its popup; a scene of the round says so. */
  protected sceneKicker(scene: Scene): string {
    return roundKicker(KIND_LABELS.scenes, !!scene.session);
  }

  /** The question before a group of the table is deleted. */
  protected question(group: TableGroup): string {
    return deleteQuestion(group, this.label(group.name));
  }

  /**
   * Delete a group of the table: every entry in it goes off the table, its notes are deleted, and the group is gone
   * with its fold state. The entries stay in the world and in the session; only their place on the table falls away.
   * A note that was not kept or turned into an entry is lost with its group.
   */
  protected deleteGroup(name: string): void {
    const group = this.groups().find((other) => other.name === name);
    group?.entries.forEach((item) => this.take(item));
    group?.notes.forEach((note) => this.store.removeNote(note.id));
    this.empty.update((names) => names.filter((other) => other !== name));
    this.folded.update((names) => names.filter((other) => other !== name));
    this.saveFolds();
    if (this.target() === name) {
      this.target.set(NO_GROUP);
    }
    this.deleting.set(null);
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

  /** Ask into which group an entry and everything connected to it shall be laid; the popup of the scene closes. */
  protected layAll(ref: EntryRef): void {
    this.sceneId.set(null);
    this.store.tableWish.set(ref);
  }

  /** Put an entry of the table into another group. */
  protected move(item: { kind: SessionEntryKind; ref: EntryRef }, group: string): void {
    this.store.patch(item.kind, item.ref.id, { table_group: group });
  }

  /** Take an entry off the table. */
  protected take(item: { kind: SessionEntryKind; ref: EntryRef }): void {
    this.store.patch(item.kind, item.ref.id, { on_table: false, table_group: NO_GROUP });
  }

  /** Lay a new, empty note into a group of the table; its name gets the cursor. */
  protected newNote(group: string): void {
    this.store.addNote({ title: NEW_NOTE, text: '', table_group: group }, (note) => this.freshNote.set(note.id));
  }

  /** Save what was written into a note on the table. */
  protected writeNote(note: Note, changes: Pick<Note, 'title' | 'text'>): void {
    this.store.saveNote(note.id, changes);
  }

  /** Put a note on the table into another group. */
  protected moveNote(note: Note, group: string): void {
    this.store.saveNote(note.id, { table_group: group });
  }

  /** Keep a note: it leaves the table and stays as an ordinary note of the round, in the notes on the left. */
  protected keepNote(note: Note): void {
    this.store.saveNote(note.id, { table_group: NO_GROUP });
  }

  /** Delete a note on the table after the game master confirmed. */
  protected dropNote(note: Note): void {
    if (confirm(`Die Notiz „${note.title}“ wirklich löschen?`)) {
      this.store.removeNote(note.id);
    }
  }

  /**
   * Turn a note into an entry of the round: its name and description go into the new entry, which lies in the same
   * group of the table afterwards; the note is deleted. A scene goes to the end of the thread of the round's chapter.
   */
  protected convert(note: Note, target: NoteTarget): void {
    const made = noteEntry(target, note);
    const chapterId = this.chapterId();
    const request: Observable<Made> | null =
      made.list === 'scenes'
        ? chapterId === null ? null : this.world.addScene(chapterId, { ...made.body, position: this.nextPosition(chapterId) })
        : this.world.add<Made>(made.list, made.body);
    request?.subscribe({
      next: (entry) => this.converted(note, made.kind, entry.npc ?? entry.id),
      error: (e: unknown) => this.toast.show(readError(e), 'danger'),
    });
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

  /** Open the quick view of a scene at its symbol, or close it again. */
  protected toggleScene(id: number, event: MouseEvent): void {
    this.sceneId.set(this.sceneId() === id ? null : id);
  }

  /** Whether a scene was played in this session. */
  protected played(id: number): boolean {
    return !!this.store.state('scene', id)?.done;
  }

  /** Open the popup of a character at its round button, or close it again. */
  protected toggleCharacter(id: number, event: MouseEvent): void {
    this.characterId.set(this.characterId() === id ? null : id);
  }

  /** The share of the life points a character has left, for the thin bar under its button. */
  protected life(id: number): number {
    const character = this.characters().find((other) => other.id === id);
    return character ? barPercent(character.life_points, character.max_life_points) : 0;
  }

  /** The share of the second bar a character has left, for the second thin bar. */
  protected second(id: number): number {
    const character = this.characters().find((other) => other.id === id);
    return character ? barPercent(character.second_bar_points, character.max_second_bar_points) : 0;
  }

  /**
   * Lay the entry made from a note into the note's group and delete the note. A character gets the description of
   * the note at the character itself.
   */
  private converted(note: Note, kind: EntryRef['kind'], id: number): void {
    const sessionKind = SESSION_KINDS[kind];
    if (sessionKind) {
      this.store.patch(sessionKind, id, { on_table: true, table_group: note.table_group });
    }
    if (kind === 'npcs' && note.text.trim()) {
      this.characterApi.update('npcs', id, { description: note.text }).subscribe({ error: (e: unknown) => this.toast.show(readError(e), 'danger') });
    }
    this.store.removeNote(note.id);
    this.converting.set(null);
  }

  /** The place after the last scene of a chapter, where a new scene of the thread goes. */
  private nextPosition(chapterId: number): number {
    return Math.max(-1, ...this.world.scenesOf(chapterId).map((scene) => scene.position)) + 1;
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
    // What the round made up carries no chapter; it belongs to what is played now.
    if (!chapter || !['scenes', 'quests', 'events'].includes(ref.kind) || this.world.ofRound(ref)) {
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
    this.remember(DRAWER_KEY + sessionId, drawer ?? 'none');
  }

  private saveFolds(): void {
    const id = this.store.session()?.id;
    if (id !== undefined) {
      this.remember(FOLDED_KEY + id, JSON.stringify(this.folded()));
    }
  }

  private savedFolds(sessionId: number): string[] {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(FOLDED_KEY + sessionId) ?? '[]');
      return Array.isArray(saved) ? saved.filter((name): name is string => typeof name === 'string') : [];
    } catch {
      return [];
    }
  }

  private remember(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // What is open and folded is only a convenience; without storage it simply starts fresh next time.
    }
  }
}
