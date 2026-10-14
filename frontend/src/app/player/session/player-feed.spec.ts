import { describe, expect, it } from 'vitest';

import { Snapshot, feedOf } from './player-feed';

/** A snapshot where nothing happened yet, with the given changes. */
function snapshot(changes: Partial<Snapshot> = {}): Snapshot {
  return { quests: {}, glossary: {}, items: [], life: 80, notes: 0, secret: 0, chat: 0, bonus: 10, sparksUsed: 0, secondName: '', second: null, ...changes };
}

describe('feedOf', () => {
  it('says nothing without a snapshot before', () => {
    expect(feedOf(null, snapshot())).toEqual([]);
  });

  it('tells a player about new bonus points, always and as a reward', () => {
    const news = feedOf(snapshot({ bonus: 10 }), snapshot({ bonus: 25 }));
    expect(news).toHaveLength(1);
    expect(news[0]).toMatchObject({ text: 'Du hast 15 Bonuspunkte bekommen', always: true, tone: 'reward', target: 'character' });
  });

  it('tells a player when the inspiration points are full again', () => {
    const news = feedOf(snapshot({ sparksUsed: 2 }), snapshot({ sparksUsed: 0 }));
    expect(news.map((item) => item.text)).toEqual(['Deine Geistesblitzpunkte sind wieder voll']);
    expect(news[0].always).toBe(true);
  });

  it('tells a player about the second bar with its name', () => {
    const news = feedOf(snapshot({ secondName: 'Willen', second: 80 }), snapshot({ secondName: 'Willen', second: 70 }));
    expect(news.map((item) => item.text)).toEqual(['Willen: 80 → 70']);
  });

  it('says nothing about the new values when an old snapshot does not have them', () => {
    const old = snapshot();
    delete old.bonus;
    delete old.sparksUsed;
    delete old.second;
    expect(feedOf(old, snapshot({ bonus: 30, sparksUsed: 0, secondName: 'Willen', second: 50 }))).toEqual([]);
  });

  it('says nothing when spending inspiration or when the world has no second bar', () => {
    expect(feedOf(snapshot({ sparksUsed: 0 }), snapshot({ sparksUsed: 1 }))).toEqual([]);
    expect(feedOf(snapshot({ second: 80 }), snapshot({ second: 70 }))).toEqual([]);
  });
});
