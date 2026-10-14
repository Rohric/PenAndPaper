import { afterEach, describe, expect, it, vi } from 'vitest';

import { Folds, rememberFolds, savedFolds } from './folds';

describe('savedFolds and rememberFolds', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('remember the folded parts of a scope', () => {
    rememberFolds('world:1', ['wall:npcs:cat:', 'read:Beschreibung']);
    expect(savedFolds('world:1')).toEqual(['wall:npcs:cat:', 'read:Beschreibung']);
    expect(savedFolds('world:2')).toEqual([]);
  });

  it('read broken or strange data as nothing folded', () => {
    localStorage.setItem('pnp.folds.world:1', '{not json');
    expect(savedFolds('world:1')).toEqual([]);
    localStorage.setItem('pnp.folds.world:1', JSON.stringify(['a', 3, null, 'b']));
    expect(savedFolds('world:1')).toEqual(['a', 'b']);
    localStorage.setItem('pnp.folds.world:1', JSON.stringify({ a: 1 }));
    expect(savedFolds('world:1')).toEqual([]);
  });

  it('go on without storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(savedFolds('world:1')).toEqual([]);
    expect(() => rememberFolds('world:1', ['a'])).not.toThrow();
  });
});

describe('Folds', () => {
  afterEach(() => localStorage.clear());

  it('folds parts shut and open, per scope, and remembers it', () => {
    const folds = new Folds();
    folds.toggle('world:1', 'a');
    expect(folds.isShut('world:1', 'a')).toBe(true);
    expect(folds.isShut('world:2', 'a')).toBe(false);
    expect(new Folds().isShut('world:1', 'a')).toBe(true);
    folds.toggle('world:1', 'a');
    expect(folds.isShut('world:1', 'a')).toBe(false);
    expect(savedFolds('world:1')).toEqual([]);
  });

  it('folds many parts at once', () => {
    const folds = new Folds();
    folds.set('world:1', ['a', 'b'], true);
    expect(savedFolds('world:1')).toEqual(['a', 'b']);
    folds.set('world:1', ['a'], false);
    expect(folds.isShut('world:1', 'a')).toBe(false);
    expect(folds.isShut('world:1', 'b')).toBe(true);
  });

  it('knows the parts on the screen until they leave', () => {
    const folds = new Folds();
    const leaveA = folds.show('world:1', 'a');
    const leaveB = folds.show('world:1', 'b');
    folds.show('world:1', 'b');
    folds.show('world:2', 'c');
    expect(folds.shown('world:1')).toEqual(['a', 'b']);
    leaveA();
    leaveB();
    expect(folds.shown('world:1')).toEqual(['b']);
    expect(folds.shown('world:2')).toEqual(['c']);
  });
});
