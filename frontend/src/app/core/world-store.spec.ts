import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiService } from './api.service';
import { WorldStore } from './world-store';

const WORLD = { id: 3, name: 'Pilzwahn', lore: '', second_bar_name: '', created_at: '' };

/** What the server answers for every list: one entry of the world and, with a round, one of the round. */
function answer(path: string): unknown {
  if (path === 'worlds/3/') {
    return WORLD;
  }
  const round = path.includes('?session=4');
  const quests = [{ id: 7, name: 'Der Schwarzmarkt', goal: 'Finde den Händler', giver: 2, session: null, chapters: [], description: '', gm_knowledge: [] }];
  const npcs = [{ id: 1, npc: 2, name: 'Sigrun', session: null, chapters: [] }];
  if (path.startsWith('worlds/3/quests/')) {
    return round ? [...quests, { id: 8, name: 'Die Schmuggler', goal: '', giver: null, session: 4, chapters: [], description: '', gm_knowledge: [] }] : quests;
  }
  if (path.startsWith('worlds/3/world-npcs/')) {
    return round ? [...npcs, { id: 5, npc: 6, name: 'Der Wirt', session: 4, chapters: [] }] : npcs;
  }
  return [];
}

describe('WorldStore', () => {
  let api: { get: Mock; post: Mock; patch: Mock; delete: Mock };
  let store: WorldStore;

  beforeEach(() => {
    api = {
      get: vi.fn((path: string) => of(answer(path))),
      post: vi.fn((_path: string, body: object) => of({ id: 9, session: 4, ...body })),
      patch: vi.fn((_path: string, body: object) => of({ id: 8, name: 'Die Schmuggler', session: 4, chapters: [], ...body })),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({ providers: [WorldStore, { provide: ApiService, useValue: api }] });
    store = TestBed.inject(WorldStore);
  });

  const asked = () => api.get.mock.calls.map(([path]) => path as string);

  it('loads only the world while the world is written, and writes into the world', () => {
    store.load(3);
    expect(asked()).toContain('worlds/3/quests/');
    expect(asked().some((path) => path.includes('?session='))).toBe(false);
    expect(store.quests().map((quest) => quest.name)).toEqual(['Der Schwarzmarkt']);
    store.add('quests', { name: 'Neu' }).subscribe();
    expect(api.post).toHaveBeenCalledWith('worlds/3/quests/', { name: 'Neu' });
    expect(store.inRound()).toBe(false);
    expect(store.mayWrite({ kind: 'quests', id: 7 })).toBe(true);
  });

  it('loads the world and what a round made up, but the chapters only of the world', () => {
    store.openRound(3, 4);
    expect(asked()).toContain('worlds/3/quests/?session=4');
    expect(asked()).toContain('worlds/3/scenes/?session=4');
    expect(asked()).toContain('worlds/3/chapters/');
    expect(store.quests().map((quest) => quest.name)).toEqual(['Der Schwarzmarkt', 'Die Schmuggler']);
  });

  it('knows which entries the round made up; only those may be written in the round', () => {
    store.openRound(3, 4);
    expect(store.ofRound({ kind: 'quests', id: 8 })).toBe(true);
    expect(store.ofRound({ kind: 'quests', id: 7 })).toBe(false);
    expect(store.ofRound({ kind: 'npcs', id: 6 })).toBe(true);
    expect(store.mayWrite({ kind: 'quests', id: 7 })).toBe(false);
    expect(store.mayWrite({ kind: 'npcs', id: 6 })).toBe(true);
  });

  it('creates, saves, deletes and adds scenes in the round', () => {
    store.openRound(3, 4);
    store.add('trivia', { name: 'Der Pilz' }).subscribe();
    store.addScene(11, { name: 'Im Keller' }).subscribe();
    store.save('quests', 8, { goal: 'Folge dem Boot' }).subscribe();
    store.remove('quests', 8).subscribe();
    expect(api.post).toHaveBeenCalledWith('worlds/3/trivia/?session=4', { name: 'Der Pilz' });
    expect(api.post).toHaveBeenCalledWith('chapters/11/scenes/?session=4', { name: 'Im Keller' });
    expect(api.patch).toHaveBeenCalledWith('quests/8/?session=4', { goal: 'Folge dem Boot' });
    expect(api.delete).toHaveBeenCalledWith('quests/8/?session=4');
  });

  it('shows every entry as the round changed it, while the written lists stay as the world has them', () => {
    store.openRound(3, 4);
    store.roundChanges.set((kind, id) => {
      if (kind === 'quest' && id === 7) {
        return { name: 'Die Spur im Hafen', giver: null };
      }
      return kind === 'npc' && id === 2 ? { name: 'Hauptfrau Sigrun' } : undefined;
    });
    expect(store.quests()[0]).toMatchObject({ name: 'Die Spur im Hafen', giver: null, goal: 'Finde den Händler' });
    expect(store.npcs()[0].name).toBe('Hauptfrau Sigrun');
    expect(store.written.quests()[0].name).toBe('Der Schwarzmarkt');
    expect(store.asWritten({ kind: 'npcs', id: 2 })).toMatchObject({ name: 'Sigrun' });
    expect(store.questOptions().map((option) => option.label)).toEqual(['Die Spur im Hafen', 'Die Schmuggler']);
  });

  it('keeps an entry without a change and the whole list the same, when the changes are asked again', () => {
    store.openRound(3, 4);
    const before = store.quests();
    store.roundChanges.set(() => undefined);
    expect(store.quests()).toBe(before);
  });

  it('keeps a changed entry and its list the same, while a poll brings the same changes in new objects', () => {
    store.openRound(3, 4);
    store.roundChanges.set((kind, id) => (kind === 'quest' && id === 7 ? { name: 'Die Spur im Regen' } : undefined));
    const before = store.quests();
    store.roundChanges.set((kind, id) => (kind === 'quest' && id === 7 ? { name: 'Die Spur im Regen' } : undefined));
    expect(store.quests()).toBe(before);
    store.roundChanges.set((kind, id) => (kind === 'quest' && id === 7 ? { name: 'Die Spur im Sturm' } : undefined));
    expect(store.quests()[0].name).toBe('Die Spur im Sturm');
  });
});
