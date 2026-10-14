import { describe, expect, it } from 'vitest';

import {
  Facet, WallItem, byCategory, categoriesOf, categoryGroup, chosenCount, filterWall, groupWall, namedExactly, searchText, usefulFacets,
} from './wall';

const item = (key: string, name: string, text: string, values: Record<string, string[]>, group = 'a'): WallItem => ({
  key, name, text, values, group: { key: group, label: group.toUpperCase() },
});

const ITEMS = [
  item('1', 'Hafen', 'Schiffe und Schmuggler', { chapter: ['1'], category: ['stadt'] }, 'a'),
  item('2', 'Taverne', 'Der Wirt lügt', { chapter: ['1', '2'], category: [''] }, 'b'),
  item('3', 'Pilzwald', 'Sporen überall', { chapter: [], category: ['wildnis'] }, 'a'),
];

describe('filterWall', () => {
  it('finds every typed word in name or text, whatever the case', () => {
    expect(filterWall(ITEMS, 'schmuggler HAFEN', {}).map((one) => one.key)).toEqual(['1']);
    expect(filterWall(ITEMS, '  ', {}).length).toBe(3);
    expect(filterWall(ITEMS, 'wirt sporen', {})).toEqual([]);
  });

  it('keeps what fits the chosen value of every row', () => {
    expect(filterWall(ITEMS, '', { chapter: '1' }).map((one) => one.key)).toEqual(['1', '2']);
    expect(filterWall(ITEMS, '', { chapter: '1', category: '' }).map((one) => one.key)).toEqual(['2']);
    expect(filterWall(ITEMS, '', { chapter: null, category: 'wildnis' }).map((one) => one.key)).toEqual(['3']);
  });
});

describe('groupWall', () => {
  it('keeps the groups in the order they first appear', () => {
    const groups = groupWall(ITEMS);
    expect(groups.map((group) => [group.label, group.items.map((one) => one.key)])).toEqual([
      ['A', ['1', '3']],
      ['B', ['2']],
    ]);
  });
});

describe('usefulFacets', () => {
  const facet = (id: string, values: string[]): Facet => ({ id, label: id, all: 'Alle', options: values.map((value) => ({ value, label: value })) });

  it('leaves out values no tile has', () => {
    const [chapters] = usefulFacets([facet('chapter', ['1', '2', '3'])], ITEMS);
    expect(chapters.options.map((option) => option.value)).toEqual(['1', '2']);
  });

  it('leaves out a row that would change nothing', () => {
    const everyone = [item('1', 'A', '', { kind: ['main'] }), item('2', 'B', '', { kind: ['main'] })];
    expect(usefulFacets([facet('kind', ['main', 'side'])], everyone)).toEqual([]);
    expect(usefulFacets([facet('kind', [])], everyone)).toEqual([]);
  });

  it('keeps a single value when some tiles lack it', () => {
    expect(usefulFacets([facet('chapter', ['2'])], ITEMS).length).toBe(1);
  });
});

describe('categories', () => {
  it('lists every category once, whatever its case, in the order of the alphabet', () => {
    expect(categoriesOf([{ category: 'Volk' }, { category: ' tier' }, { category: '' }, { category: 'volk' }, { category: 'Äther' }])).toEqual([
      'Äther', 'tier', 'Volk',
    ]);
  });

  it('groups by category and puts entries without one last', () => {
    expect(categoryGroup(' Stadt ')).toEqual({ key: 'category:stadt', label: 'Stadt' });
    expect(categoryGroup('')).toEqual({ key: 'category:', label: 'Ohne Kategorie' });
    const sorted = byCategory([
      { name: 'a', category: '' },
      { name: 'b', category: 'Wald' },
      { name: 'c', category: 'stadt' },
      { name: 'd', category: 'Stadt' },
    ]);
    expect(sorted.map((one) => one.name)).toEqual(['c', 'd', 'b', 'a']);
  });
});

describe('searchText', () => {
  it('gathers the texts, the knowledge and the checklist of any kind of entry', () => {
    const quest = {
      name: 'Schwarzmarkt', description: 'Im Hafen', goal: 'Finde den Händler', note: 'Lügt', category: 'Haupt', number: 3,
      player_knowledge: [{ title: 'Gerücht', text: 'nachts' }], gm_knowledge: [], checklist: ['Fragen'],
    };
    expect(searchText(quest)).toBe('Im Hafen Finde den Händler Haupt Lügt Gerücht nachts Fragen');
    expect(searchText({ name: 'Sigrun', profession: 'Wache', note: '' })).toBe('Wache');
  });
});

describe('small helpers', () => {
  it('knows when a name is taken exactly', () => {
    expect(namedExactly(ITEMS, ' hafen ')).toBe(true);
    expect(namedExactly(ITEMS, 'Hafe')).toBe(false);
  });

  it('counts the chosen rows', () => {
    expect(chosenCount({ chapter: '1', category: null, kind: '' })).toBe(2);
  });
});
