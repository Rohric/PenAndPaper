import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

import { readError } from './api-error';
import { Poller, ROUND_MS } from './poll';
import { sameJson } from './same';
import { EntryRef, PlayerCharacter } from './models';
import {
  ChatMessage, EntryChanges, GameMasterState, ItemGift, Message, Note, QuestLog, Roll, RollOrder, Session, SessionEntry, SessionEntryKind,
} from './session-models';
import { CharacterService } from './character.service';
import { SessionService } from './session.service';

type Flag = 'done' | 'started' | 'revealed' | 'pinned' | 'on_table';
type PositionList = 'steps' | 'known';

// The names of the kinds in a session live with the other rules of a round; many parts import them from here.
export { SESSION_KINDS } from './round';

/** Everything of the session the game master runs, asked for again every few seconds while it is open. */
@Injectable()
export class SessionStore {
  private readonly api = inject(SessionService);
  private readonly characterApi = inject(CharacterService);

  readonly session = signal<Session | null>(null);
  // What the state address fills only fires when its data really changed.
  readonly entries = signal<SessionEntry[]>([], { equal: sameJson });
  /** The characters of the group with their whole sheet. */
  readonly characters = signal<PlayerCharacter[]>([], { equal: sameJson });
  /** Every character of every player, for the game master to pick from. */
  readonly everyone = signal<PlayerCharacter[]>([]);
  readonly notes = signal<Note[]>([], { equal: sameJson });
  readonly rolls = signal<Roll[]>([], { equal: sameJson });
  /** The roll the game master made last. */
  readonly lastRoll = signal<Roll | null>(null);
  readonly messages = signal<Message[]>([], { equal: sameJson });
  readonly chat = signal<ChatMessage[]>([], { equal: sameJson });
  readonly error = signal('');
  /** The entry that shall go on the table with everything connected to it; the question for the group opens while it is set. */
  readonly tableWish = signal<EntryRef | null>(null);

  /** The tag of the last state; the server answers without content while it is still the same. */
  private tag: string | null = null;
  private readonly poller = new Poller(() => this.poll(), () => ROUND_MS);

  private readonly states = computed(() => new Map(this.entries().map((entry) => [`${entry.kind}:${entry.entry_id}`, entry])));
  readonly pinned = computed(() => this.entries().filter((entry) => entry.pinned));
  /** The notes of the round that are not lying on the table: they stand in the notes column and the notes view. */
  readonly keptNotes = computed(() => this.notes().filter((note) => !note.table_group));

  constructor() {
    this.poller.start(false);
  }

  /** Load the session and everything in it. */
  load(id: number): void {
    this.tag = null;
    this.run(this.api.get(id), (session) => {
      this.session.set(session);
      this.refresh();
    });
    this.loadEveryone();
  }

  /** Load the characters of all players again, to pick new members of the group from. */
  loadEveryone(): void {
    this.run(this.characterApi.list<PlayerCharacter>('gm/player-characters'), (all) => this.everyone.set(all));
  }

  /** Ask for the state at once, for example after an own action. */
  refresh(): void {
    this.poller.now();
  }

  /** What the session did with one entry of the world; nothing yet when it is undefined. */
  state(kind: SessionEntryKind, entryId: number): SessionEntry | undefined {
    return this.states().get(`${kind}:${entryId}`);
  }

  /** Switch one of the marks of an entry: done, started, revealed for the players, pinned, on the table. */
  toggle(kind: SessionEntryKind, entryId: number, flag: Flag): void {
    this.setEntry(kind, entryId, { [flag]: !this.state(kind, entryId)?.[flag] } as Partial<SessionEntry>);
  }

  /** Check or uncheck one step of a quest, or one piece of knowledge the players know. */
  toggleIn(kind: SessionEntryKind, entryId: number, list: PositionList, position: number): void {
    const positions = this.state(kind, entryId)?.[list] ?? [];
    const next = positions.includes(position) ? positions.filter((p) => p !== position) : [...positions, position];
    this.setEntry(kind, entryId, { [list]: next } as Partial<SessionEntry>);
  }

  /** Show a part of an entry to the players or hide it again, like "goal" or "step:2". */
  toggleShown(kind: SessionEntryKind, entryId: number, part: string): void {
    const shown = this.state(kind, entryId)?.shown ?? [];
    this.patch(kind, entryId, { shown: shown.includes(part) ? shown.filter((other) => other !== part) : [...shown, part] });
  }

  /** Save the note of the game master about an entry; only this session and the game master see it. */
  setNote(kind: SessionEntryKind, entryId: number, text: string): void {
    this.patch(kind, entryId, { gm_note: text });
  }

  /** Save what the group wrote about a quest. */
  setLog(kind: SessionEntryKind, entryId: number, log: QuestLog): void {
    this.patch(kind, entryId, { log });
  }

  /** Change several things a session knows about an entry at once. */
  patch(kind: SessionEntryKind, entryId: number, changes: Partial<SessionEntry>): void {
    this.setEntry(kind, entryId, changes);
  }

  /** Change the session itself: its chapter, its characters, whether it is finished. */
  save(changes: Partial<Session>): void {
    this.run(this.api.update(this.id(), changes), (session) => {
      this.session.set(session);
      this.refresh();
      if ('characters' in changes) {
        this.loadEveryone();
      }
    });
  }

  /** LvUp: give characters bonus points, named by character id; then tell the caller. */
  level(bonusPoints: Record<number, number>, done: () => void): void {
    this.run(this.api.level(this.id(), bonusPoints), () => {
      this.refresh();
      done();
    });
  }

  giveItem(item: ItemGift): void {
    this.run(this.api.giveItem(this.id(), item), () => this.refresh());
  }

  /** Set the points of a bar of a character of the group: life, or the second bar of the world. */
  setPoints(characterId: number, changes: Partial<Pick<PlayerCharacter, 'life_points' | 'second_bar_points'>>): void {
    const request = this.characterApi.update<PlayerCharacter>('gm/player-characters', characterId, changes);
    this.run(request, (saved) => this.characters.update((all) => all.map((old) => (old.id === saved.id ? saved : old))));
  }

  /** Write a new note; the caller can go on with the note as it was saved. */
  addNote(note: Partial<Note>, then: (saved: Note) => void = () => undefined): void {
    this.run(this.api.addNote(this.id(), note), (saved) => {
      this.notes.update((all) => [saved, ...all]);
      this.refresh();
      then(saved);
    });
  }

  saveNote(noteId: number, changes: Partial<Note>): void {
    this.run(this.api.updateNote(noteId, changes), (saved) => {
      this.notes.update((all) => all.map((note) => (note.id === saved.id ? saved : note)));
      this.refresh();
    });
  }

  removeNote(noteId: number): void {
    this.run(this.api.removeNote(noteId), () => {
      this.notes.update((all) => all.filter((note) => note.id !== noteId));
      this.refresh();
    });
  }

  comment(noteId: number, text: string): void {
    this.run(this.api.addComment(noteId, text), () => this.refresh());
  }

  /** Write into the chat of the whole group. */
  sendChat(text: string): void {
    this.run(this.api.sendChat(this.id(), text), () => this.refresh());
  }

  /** Give characters all their inspiration points back: the named ones, or the whole group; then tell the caller. */
  refillInspiration(characterIds: number[], done: () => void): void {
    this.run(this.api.refillInspiration(this.id(), characterIds), () => {
      this.refresh();
      done();
    });
  }

  send(characterId: number, text: string): void {
    this.run(this.api.sendMessage(this.id(), characterId, text), () => this.refresh());
  }

  /** Mark the answers of a character as read. */
  markRead(characterId: number): void {
    this.run(this.api.markRead(this.id(), characterId), () => this.refresh());
  }

  /** How many answers of a character the game master has not read yet. */
  unread(characterId: number): number {
    return this.messages().filter((m) => m.character === characterId && !m.from_gm && !m.read).length;
  }

  /** Roll as game master: a check for somebody, or free dice. */
  roll(order: RollOrder): void {
    this.run(this.api.roll(this.id(), order), (roll) => {
      this.lastRoll.set(roll);
      this.refresh();
    });
  }

  /** Set what this session has different about an entry than the world; an empty object takes it all back. */
  setChanges(kind: SessionEntryKind, entryId: number, changes: EntryChanges): void {
    this.setEntry(kind, entryId, { changes });
  }

  private id(): number {
    return this.session()?.id ?? 0;
  }

  private setEntry(kind: SessionEntryKind, entryId: number, changes: Partial<SessionEntry>): void {
    this.run(this.api.setEntry(this.id(), kind, entryId, changes), (saved) =>
      this.entries.update((all) => [...all.filter((old) => old.id !== saved.id), saved]),
    );
  }

  /** Ask the state address; it answers without content while nothing has changed. */
  private poll(): Observable<unknown> {
    const session = this.session();
    if (!session) {
      return of(null);
    }
    return this.api.state<GameMasterState>(session.id, this.tag).pipe(
      tap({ next: (state) => state && this.fill(state), error: (e: unknown) => this.error.set(readError(e)) }),
    );
  }

  private fill(state: GameMasterState): void {
    this.tag = state.tag;
    this.entries.set(state.entries);
    this.notes.set(state.notes);
    this.rolls.set(state.rolls);
    this.messages.set(state.messages);
    this.chat.set(state.chat);
    this.characters.set(state.characters);
    this.error.set('');
  }

  private run<T>(request: Observable<T>, then: (value: T) => void): void {
    request.subscribe({ next: then, error: (e: unknown) => this.error.set(readError(e)) });
  }
}
