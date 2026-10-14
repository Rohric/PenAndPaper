import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CharacterService } from './character.service';
import { GameMasterState, Session } from './session-models';
import { SessionService } from './session.service';
import { SessionStore } from './session-store';

const SESSION = { id: 4, name: 'Runde', characters: [1] } as unknown as Session;

/** A state as the server sends it, with fresh objects every time. */
function state(tag: string, text = 'Hallo'): GameMasterState {
  return {
    tag,
    entries: [{ id: 1, kind: 'quest', entry_id: 7, revealed: true }],
    notes: [],
    messages: [],
    chat: [{ id: 1, text }],
    rolls: [],
    characters: [],
  } as unknown as GameMasterState;
}

describe('SessionStore', () => {
  let answers: (GameMasterState | null)[];
  let api: { get: Mock; state: Mock };
  let store: SessionStore;

  beforeEach(() => {
    vi.useFakeTimers();
    answers = [];
    api = {
      get: vi.fn(() => of(SESSION)),
      state: vi.fn((): Observable<GameMasterState | null> => of(answers.shift() ?? null)),
    };
    TestBed.configureTestingModule({
      providers: [
        SessionStore,
        { provide: SessionService, useValue: api },
        { provide: CharacterService, useValue: { list: () => of([]) } },
      ],
    });
    store = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fills itself from the state and sends the tag along the next time', () => {
    answers.push(state('a'));
    store.load(SESSION.id);
    expect(store.chat()).toEqual([{ id: 1, text: 'Hallo' }]);
    store.refresh();
    expect(api.state).toHaveBeenLastCalledWith(SESSION.id, 'a');
  });

  it('changes nothing when the server answers without content', () => {
    answers.push(state('a'));
    store.load(SESSION.id);
    const chat = store.chat();
    store.refresh();
    expect(store.chat()).toBe(chat);
  });

  it('keeps its data when a new state brings the same data again, and takes new data', () => {
    answers.push(state('a'), state('b'), state('c', 'Neu'));
    store.load(SESSION.id);
    const entries = store.entries();
    const chat = store.chat();
    store.refresh();
    expect(store.entries()).toBe(entries);
    expect(store.chat()).toBe(chat);
    store.refresh();
    expect(store.entries()).toBe(entries);
    expect(store.chat()).toEqual([{ id: 1, text: 'Neu' }]);
  });
});
