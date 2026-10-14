/** One value of a row of filters, like a chapter or a category. */
export interface FacetOption {
  value: string;
  label: string;
  /** A colour of its own, like the tone of a category. */
  colour?: string;
  /** More words, shown while the pointer rests on the value. */
  title?: string;
}

/** One row of filters above a wall: what it filters, its word for "all" and its values. */
export interface Facet {
  id: string;
  /** What the row does, read out by screen readers, like "Nach Kapitel filtern". */
  label: string;
  /** The first choice, which filters nothing, like "Alle Kapitel". */
  all: string;
  options: FacetOption[];
}

/** The group a tile of a wall stands in. */
export interface WallGroupKey {
  key: string;
  label: string;
  /** A colour of its own, like the tone of a category. */
  colour?: string;
}

/** One tile of a wall, with what is searched and filtered and the group it stands in. */
export interface WallItem {
  /** Unique among the tiles of the wall. */
  key: string;
  name: string;
  /** Everything else written about it, to search in. */
  text: string;
  /** Its values for each row of filters, by the id of the row. */
  values: Record<string, string[]>;
  group: WallGroupKey;
}

/** A group of a wall with its tiles. */
export interface WallGroup<T extends WallItem> extends WallGroupKey {
  items: T[];
}

/** The value chosen in each row of filters; null or a missing row filters nothing. */
export type Chosen = Record<string, string | null>;

const NO_CATEGORY = 'Ohne Kategorie';

/** The key of a category, the same for every way of writing it; empty for none. */
export function categoryKey(category: string): string {
  return category.trim().toLowerCase();
}

/** The categories of some entries, each once whatever its case, in the order of the alphabet. */
export function categoriesOf(entries: { category: string }[]): string[] {
  const names = new Map<string, string>();
  for (const entry of entries) {
    const name = entry.category.trim();
    if (name && !names.has(categoryKey(name))) {
      names.set(categoryKey(name), name);
    }
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b, 'de'));
}

/** The group of an entry by its category; entries without one stand together under "Ohne Kategorie". */
export function categoryGroup(category: string): WallGroupKey {
  return { key: `category:${categoryKey(category)}`, label: category.trim() || NO_CATEGORY };
}

/** Entries in the order of their categories, those without one last; inside a category the order stays. */
export function byCategory<T extends { category: string }>(entries: T[]): T[] {
  const rank = (entry: T) => (categoryKey(entry.category) ? `0${categoryKey(entry.category)}` : '1');
  return [...entries].sort((a, b) => rank(a).localeCompare(rank(b), 'de'));
}

/** The fields of an entry that hold text to search in, whatever its kind. */
const TEXT_FIELDS = ['description', 'goal', 'trigger', 'happening', 'to_read', 'profession', 'category', 'note'];

/** Everything written about an entry of any kind as one text to search in: its texts, knowledge and checklist. */
export function searchText(entry: object): string {
  const record = entry as Record<string, unknown>;
  const texts = TEXT_FIELDS.map((field) => record[field]).filter((value): value is string => typeof value === 'string');
  const pieces = ['player_knowledge', 'gm_knowledge'].flatMap((field) => (record[field] as { title: string; text: string }[] | undefined) ?? []);
  const steps = (record['checklist'] as string[] | undefined) ?? [];
  return [...texts, ...pieces.map((piece) => `${piece.title} ${piece.text}`), ...steps].filter(Boolean).join(' ');
}

/** Whether a tile has a value in a row of filters. */
function has(item: WallItem, facet: string, value: string): boolean {
  return (item.values[facet] ?? []).includes(value);
}

/** Whether a tile fits the typed words (all of them, in its name or text) and the value chosen in every row. */
export function fits(item: WallItem, query: string, chosen: Chosen): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${item.name} ${item.text}`.toLowerCase();
  const chosenFit = Object.entries(chosen).every(([facet, value]) => value === null || has(item, facet, value));
  return chosenFit && words.every((word) => text.includes(word));
}

/** The tiles that fit the typed words and the chosen values. */
export function filterWall<T extends WallItem>(items: T[], query: string, chosen: Chosen): T[] {
  return items.filter((item) => fits(item, query, chosen));
}

/** The tiles in their groups; the groups keep the order in which they first appear. */
export function groupWall<T extends WallItem>(items: T[]): WallGroup<T>[] {
  const groups = new Map<string, WallGroup<T>>();
  for (const item of items) {
    const group = groups.get(item.group.key) ?? { ...item.group, items: [] };
    group.items.push(item);
    groups.set(item.group.key, group);
  }
  return [...groups.values()];
}

/**
 * The rows of filters that change something: a value that no tile has is left out, and so is a row
 * whose only value fits every tile.
 */
export function usefulFacets(facets: Facet[], items: WallItem[]): Facet[] {
  return facets
    .map((facet) => ({ ...facet, options: facet.options.filter((option) => items.some((item) => has(item, facet.id, option.value))) }))
    .filter((facet) => facet.options.length > 1 || (facet.options.length === 1 && !items.every((item) => has(item, facet.id, facet.options[0].value))));
}

/** Whether a tile of the wall is called exactly like the typed name, whatever the case. */
export function namedExactly(items: WallItem[], name: string): boolean {
  const wanted = name.trim().toLowerCase();
  return items.some((item) => item.name.trim().toLowerCase() === wanted);
}

/** How many rows of filters have a value chosen. */
export function chosenCount(chosen: Chosen): number {
  return Object.values(chosen).filter((value) => value !== null).length;
}
