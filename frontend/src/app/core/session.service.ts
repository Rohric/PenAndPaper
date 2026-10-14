import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import {
  Attack, Battle, ChatMessage, Combatant, ItemGift, Message, Note, NoteComment, PlayerBattle, PlayerView, QuestLog, Roll, RollOrder,
  Session, SessionEntry, SessionEntryKind,
} from './session-models';

/** Backend calls for sessions and for the battles fought in them. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(ApiService);

  /** The sessions the game master runs. */
  list(): Observable<Session[]> {
    return this.api.get<Session[]>('sessions/');
  }

  /** The sessions in which a character of the player plays. */
  mine(): Observable<Session[]> {
    return this.api.get<Session[]>('my-sessions/');
  }

  get(id: number): Observable<Session> {
    return this.api.get<Session>(`sessions/${id}/`);
  }

  create(session: Partial<Session>): Observable<Session> {
    return this.api.post<Session>('sessions/', session);
  }

  update(id: number, changes: Partial<Session>): Observable<Session> {
    return this.api.patch<Session>(`sessions/${id}/`, changes);
  }

  remove(id: number): Observable<void> {
    return this.api.delete(`sessions/${id}/`);
  }

  /** What the session did with the entries of its world. */
  entries(id: number): Observable<SessionEntry[]> {
    return this.api.get<SessionEntry[]>(`sessions/${id}/entries/`);
  }

  /** Set the state of one world entry in the session. */
  setEntry(id: number, kind: SessionEntryKind, entryId: number, changes: Partial<SessionEntry>): Observable<SessionEntry> {
    return this.api.patch<SessionEntry>(`sessions/${id}/entries/${kind}/${entryId}/`, changes);
  }

  /** Keep the log of a shared quest as one of the group: what was written, or which shown points are checked. */
  questLog(id: number, questId: number, changes: { log?: QuestLog; steps?: number[] }): Observable<unknown> {
    return this.api.patch(`sessions/${id}/quest-log/${questId}/`, changes);
  }

  /** LvUp: give characters bonus points, named by character id; the chapter stays as it is. */
  level(id: number, bonusPoints: Record<number, number>): Observable<Session> {
    return this.api.post<Session>(`sessions/${id}/level/`, { bonus_points: bonusPoints });
  }

  /** Put an item into the inventory of a character of the session. */
  giveItem(id: number, item: ItemGift): Observable<unknown> {
    return this.api.post(`sessions/${id}/items/`, item);
  }

  /** Everything the players of the session may see. */
  playerView(id: number): Observable<PlayerView> {
    return this.api.get<PlayerView>(`sessions/${id}/player-view/`);
  }

  notes(id: number): Observable<Note[]> {
    return this.api.get<Note[]>(`sessions/${id}/notes/`);
  }

  addNote(id: number, note: Partial<Note>): Observable<Note> {
    return this.api.post<Note>(`sessions/${id}/notes/`, note);
  }

  updateNote(noteId: number, changes: Partial<Note>): Observable<Note> {
    return this.api.patch<Note>(`notes/${noteId}/`, changes);
  }

  removeNote(noteId: number): Observable<void> {
    return this.api.delete(`notes/${noteId}/`);
  }

  addComment(noteId: number, text: string): Observable<NoteComment> {
    return this.api.post<NoteComment>(`notes/${noteId}/comments/`, { text });
  }

  /** The secret messages a user may read: all threads for the game master, the own ones for a player. */
  messages(id: number): Observable<Message[]> {
    return this.api.get<Message[]>(`sessions/${id}/messages/`);
  }

  sendMessage(id: number, character: number, text: string): Observable<Message> {
    return this.api.post<Message>(`sessions/${id}/messages/`, { character, text });
  }

  /** Mark the received messages of one thread as read. */
  markRead(id: number, character: number): Observable<unknown> {
    return this.api.post(`sessions/${id}/messages/read/`, { character });
  }

  /** The chat of the whole group, oldest message first. */
  chat(id: number): Observable<ChatMessage[]> {
    return this.api.get<ChatMessage[]>(`sessions/${id}/chat/`);
  }

  /** Write into the chat of the group. */
  sendChat(id: number, text: string): Observable<ChatMessage> {
    return this.api.post<ChatMessage>(`sessions/${id}/chat/`, { text });
  }

  /** Give characters of the session all their inspiration points back: the named ones, or the whole group. */
  refillInspiration(id: number, characters: number[] = []): Observable<unknown> {
    return this.api.post(`sessions/${id}/inspiration/`, { characters });
  }

  /** Everything a device shows during a session at once; null when nothing changed since the given tag. */
  state<T>(id: number, have: string | null): Observable<T | null> {
    return this.api.get<T | null>(`sessions/${id}/state/${have ? `?have=${have}` : ''}`);
  }

  rolls(id: number): Observable<Roll[]> {
    return this.api.get<Roll[]>(`sessions/${id}/rolls/`);
  }

  /** Roll a check against a value, or free dice without one. */
  roll(id: number, order: RollOrder): Observable<Roll> {
    return this.api.post<Roll>(`sessions/${id}/rolls/`, order);
  }

  /** The battles of a session, newest first. */
  battles(sessionId: number): Observable<Battle[]> {
    return this.api.get<Battle[]>(`battles/?session=${sessionId}`);
  }

  /** Start a battle in a session; a scene brings its NPCs along. */
  createBattle(name: string, session: number, scene: number | null): Observable<Battle> {
    return this.api.post<Battle>('battles/', { name, session, scene });
  }

  battle(id: number): Observable<Battle> {
    return this.api.get<Battle>(`battles/${id}/`);
  }

  addCombatant(battleId: number, combatant: Partial<Combatant>): Observable<Combatant> {
    return this.api.post<Combatant>(`battles/${battleId}/combatants/`, combatant);
  }

  updateCombatant(id: number, changes: Partial<Combatant>): Observable<Combatant> {
    return this.api.patch<Combatant>(`combatants/${id}/`, changes);
  }

  removeCombatant(id: number): Observable<void> {
    return this.api.delete(`combatants/${id}/`);
  }

  /**
   * Do one step of a fight as game master. "close" lets the open roll count and moves the turn on,
   * "discard" throws the open roll away.
   */
  step(battleId: number, step: 'start' | 'next' | 'close' | 'discard' | 'finish'): Observable<Battle> {
    return this.api.post<Battle>(`battles/${battleId}/${step}/`, {});
  }

  /** Roll an attack for any combatant; it stays open until the turn is closed. */
  attack(battleId: number, attack: Attack): Observable<Battle> {
    return this.api.post<Battle>(`battles/${battleId}/attack/`, attack);
  }

  /** Keep an action open that is no attack; with a value it is rolled against it. */
  action(battleId: number, action: { actor: number; label: string; value: number | null }): Observable<Battle> {
    return this.api.post<Battle>(`battles/${battleId}/action/`, action);
  }

  /** Decide the parry of the open hit: the target parries with a value, or takes the damage (null). */
  parry(battleId: number, parryValue: number | null): Observable<Battle> {
    return this.api.post<Battle>(`battles/${battleId}/parry/`, { parry_value: parryValue });
  }

  /** The running battle of a session as a player sees it; null when the session does not fight. */
  playerBattle(sessionId: number): Observable<PlayerBattle | null> {
    return this.api.get<PlayerBattle | null>(`sessions/${sessionId}/battle/`);
  }

  /** Roll the attack of the own character with a skill and a weapon from the own sheet. */
  playerAttack(sessionId: number, attack: { defender: number; skill: string; weapon: string }): Observable<PlayerBattle> {
    return this.api.post<PlayerBattle>(`sessions/${sessionId}/battle/attack/`, attack);
  }

  /** Do something else than an attack with the own character; with a roll it goes against a skill of the own sheet. */
  playerAction(sessionId: number, action: { label: string; rolls: boolean; skill: string }): Observable<PlayerBattle> {
    return this.api.post<PlayerBattle>(`sessions/${sessionId}/battle/action/`, action);
  }

  /** Decide whether the own character parries the hit that waits, and with which skill. */
  playerParry(sessionId: number, parry: { parry: boolean; skill: string }): Observable<PlayerBattle> {
    return this.api.post<PlayerBattle>(`sessions/${sessionId}/battle/parry/`, parry);
  }

  /** Close the turn of the own character: only now its open roll counts and the next one is on. */
  playerClose(sessionId: number): Observable<PlayerBattle> {
    return this.api.post<PlayerBattle>(`sessions/${sessionId}/battle/close/`, {});
  }
}
