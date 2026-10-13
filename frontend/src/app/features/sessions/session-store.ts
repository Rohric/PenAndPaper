import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';

import { readError } from '../../core/api-error';
import { EntryKind, PlayerCharacter } from '../../core/models';
import { ItemGift, Message, Note, Roll, Session, SessionEntry, SessionEntryKind } from '../../core/session-models';
import { CharacterService } from '../characters/character.service';
import { SessionService } from './session.service';

type Flag = 'done' | 'revealed' | 'pinned';
type PositionList = 'steps' | 'known';

/** How the kinds of world entries are called in a session. */
export const SESSION_KINDS: Partial<Record<EntryKind, SessionEntryKind>> = {
  scenes: 'scene',
  quests: 'quest',
  events: 'event',
  locations: 'location',
  npcs: 'npc',
  trivia: 'trivia',
};

/** Everything of the session the game master runs, reloaded every few seconds while it is open. */
@Injectable()
export class SessionStore {
  private readonly api = inject(SessionService);
  private readonly characterApi = inject(CharacterService);

  readonly session = signal<Session | null>(null);
  readonly entries = signal<SessionEntry[]>([]);
  /** The characters of the group with their whole sheet. */
  readonly characters = signal<PlayerCharacter[]>([]);
  readonly notes = signal<Note[]>([]);
  readonly rolls = signal<Roll[]>([]);
  readonly messages = signal<Message[]>([]);
  readonly error = signal('');

  private readonly states = computed(() => new Map(this.entries().map((entry) => [`${entry.kind}:${entry.entry_id}`, entry])));
  readonly pinned = computed(() => this.entries().filter((entry) => entry.pinned));

  /** Load the session and everything in it. */
  load(id: number): void {
    this.run(this.api.get(id), (session) => {
      this.session.set(session);
      this.refresh();
    });
  }

  /** Load again what changes while the group plays. */
  refresh(): void {
    const session = this.session();
    if (!session) {
      return;
    }
    const parts = {
      entries: this.api.entries(session.id),
      notes: this.api.notes(session.id),
      rolls: this.api.rolls(session.id),
      messages: this.api.messages(session.id),
      characters: this.characterApi.list<PlayerCharacter>('gm/player-characters'),
    };
    this.run(forkJoin(parts), (data) => this.fill(session, data));
  }

  /** What the session did with one entry of the world; nothing yet when it is undefined. */
  state(kind: SessionEntryKind, entryId: number): SessionEntry | undefined {
    return this.states().get(`${kind}:${entryId}`);
  }

  /** Switch one of the three marks of an entry: done, revealed for the players, pinned. */
  toggle(kind: SessionEntryKind, entryId: number, flag: Flag): void {
    this.setEntry(kind, entryId, { [flag]: !this.state(kind, entryId)?.[flag] } as Partial<SessionEntry>);
  }

  /** Check or uncheck one step of a quest, or one piece of knowledge the players know. */
  toggleIn(kind: SessionEntryKind, entryId: number, list: PositionList, position: number): void {
    const positions = this.state(kind, entryId)?.[list] ?? [];
    const next = positions.includes(position) ? positions.filter((p) => p !== position) : [...positions, position];
    this.setEntry(kind, entryId, { [list]: next } as Partial<SessionEntry>);
  }

  /** Change the session itself: its chapter, its characters, whether it is finished. */
  save(changes: Partial<Session>): void {
    this.run(this.api.update(this.id(), changes), (session) => {
      this.session.set(session);
      this.refresh();
    });
  }

  /** Close the chapter: every character gets its bonus points, the next chapter begins. */
  level(bonusPoints: Record<number, number>): void {
    this.run(this.api.level(this.id(), bonusPoints), (session) => {
      this.session.set(session);
      this.refresh();
    });
  }

  giveItem(item: ItemGift): void {
    this.run(this.api.giveItem(this.id(), item), () => this.refresh());
  }

  /** Set the life points of a character of the group. */
  setLife(characterId: number, lifePoints: number): void {
    const request = this.characterApi.update<PlayerCharacter>('gm/player-characters', characterId, { life_points: Math.max(0, lifePoints) });
    this.run(request, (saved) => this.characters.update((all) => all.map((old) => (old.id === saved.id ? saved : old))));
  }

  addNote(note: Partial<Note>): void {
    this.run(this.api.addNote(this.id(), note), () => this.refresh());
  }

  saveNote(noteId: number, changes: Partial<Note>): void {
    this.run(this.api.updateNote(noteId, changes), () => this.refresh());
  }

  removeNote(noteId: number): void {
    this.run(this.api.removeNote(noteId), () => this.refresh());
  }

  comment(noteId: number, text: string): void {
    this.run(this.api.addComment(noteId, text), () => this.refresh());
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

  /** Roll a check as game master. */
  roll(label: string, value: number): void {
    this.run(this.api.roll(this.id(), label, value), () => this.refresh());
  }

  private id(): number {
    return this.session()?.id ?? 0;
  }

  private setEntry(kind: SessionEntryKind, entryId: number, changes: Partial<SessionEntry>): void {
    this.run(this.api.setEntry(this.id(), kind, entryId, changes), (saved) =>
      this.entries.update((all) => [...all.filter((old) => old.id !== saved.id), saved]),
    );
  }

  private fill(
    session: Session,
    data: { entries: SessionEntry[]; notes: Note[]; rolls: Roll[]; messages: Message[]; characters: PlayerCharacter[] },
  ): void {
    this.entries.set(data.entries);
    this.notes.set(data.notes);
    this.rolls.set(data.rolls);
    this.messages.set(data.messages);
    this.characters.set(data.characters.filter((character) => session.characters.includes(character.id)));
    this.error.set('');
  }

  private run<T>(request: Observable<T>, then: (value: T) => void): void {
    request.subscribe({ next: then, error: (e: unknown) => this.error.set(readError(e)) });
  }
}
