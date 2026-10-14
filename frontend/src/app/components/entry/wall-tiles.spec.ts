import { describe, expect, it } from 'vitest';

import { Chapter, Location, Quest } from '../../core/models';
import { WorldStore } from '../../core/world-store';
import { placeFacet, placeTiles, questTiles } from './wall-tiles';

const place = (id: number, name: string, parent: number | null, category = ''): Location =>
  ({ id, name, parent, category, note: '', description: '', player_knowledge: [], gm_knowledge: [], chapters: [] }) as unknown as Location;

const quest = (id: number, name: string, kind: 'main' | 'side', number: number | null, category = ''): Quest =>
  ({ id, name, kind, number, category, note: '', goal: '', description: '', checklist: [], player_knowledge: [], gm_knowledge: [] }) as unknown as Quest;

/** Just enough of the store for the builders of the walls. */
function storeWith(locations: Location[], quests: Quest[] = [], chapters: Chapter[] = []): WorldStore {
  return { locations: () => locations, quests: () => quests, chapters: () => chapters, scenes: () => [] } as unknown as WorldStore;
}

describe('placeTiles', () => {
  const store = storeWith([
    place(1, 'Hafenstadt', null),
    place(2, 'Turm', null),
    place(3, 'Taverne', 1),
    place(4, 'Keller', 3),
    place(5, 'Markt', 1),
  ]);

  it('walks the tree and groups every place with places inside under it', () => {
    const tiles = placeTiles(store);
    expect(tiles.map((tile) => [tile.name, tile.group.label])).toEqual([
      ['Hafenstadt', 'Hafenstadt'],
      ['Taverne', 'Hafenstadt'],
      ['Keller', 'Hafenstadt'],
      ['Markt', 'Hafenstadt'],
      ['Turm', 'Einzelne Orte'],
    ]);
  });

  it('finds a place by every place around it', () => {
    const keller = placeTiles(store).find((tile) => tile.name === 'Keller');
    expect(keller?.values['in']).toEqual(['1', '3']);
    expect(placeFacet(store).options.map((option) => option.label)).toEqual(['in Hafenstadt', 'in Taverne']);
  });
});

describe('questTiles', () => {
  it('puts main quests first by number, side quests by name, all in groups by category', () => {
    const store = storeWith([], [
      quest(1, 'Zwerge', 'side', null),
      quest(2, 'Zweite', 'main', 2),
      quest(3, 'Anfang', 'side', null, 'Stadt'),
      quest(4, 'Erste', 'main', 1),
    ]);
    const tiles = questTiles(store);
    expect(tiles.map((tile) => [tile.name, tile.group.label])).toEqual([
      ['Anfang', 'Stadt'],
      ['Erste', 'Ohne Kategorie'],
      ['Zweite', 'Ohne Kategorie'],
      ['Zwerge', 'Ohne Kategorie'],
    ]);
    expect(tiles[1].values['kind']).toEqual(['main']);
  });
});
