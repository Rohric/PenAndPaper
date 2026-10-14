import { Chapter, EntryRef, Location, QUEST_KINDS, Quest, Trivia, WorldEvent, WorldNpc } from '../../core/models';
import { Facet, WallGroupKey, WallItem, byCategory, categoriesOf, categoryGroup, categoryKey, searchText } from '../../core/wall';
import { WorldStore } from '../../core/world-store';
import { Face, chaptersOf } from './entry-face';
import { tagColour } from './tag-colour';

/** One tile of a wall: an entry of the world, or something that only looks like one. */
export interface WallTile extends WallItem {
  ref: EntryRef | null;
  /** The face of a tile that is no entry of the world, like an item only a player carries. */
  loose?: Face;
  /** What a click on such a loose tile does. */
  press?: () => void;
}

/** The group of the walls that have none: one group, so no title is shown. */
export const ONE_GROUP: WallGroupKey = { key: 'all', label: '' };

/** The group of an entry by its category, with the tone of the category. */
function categoryGrouped(entry: { category: string }): WallGroupKey {
  return { ...categoryGroup(entry.category), colour: categoryKey(entry.category) ? tagColour(entry.category) : '' };
}

/** A tile of an entry of the world, with its chapters and its category to filter by. */
export function entryTile(
  store: WorldStore, ref: EntryRef, entry: { name: string; category: string }, group: WallGroupKey, values: Record<string, string[]> = {},
): WallTile {
  const chapters = chaptersOf(store, ref).map((chapter) => String(chapter.id));
  return { key: `${ref.kind}:${ref.id}`, ref, name: entry.name, text: searchText(entry), values: { chapter: chapters, category: [categoryKey(entry.category)], ...values }, group };
}

/** The row of chapters: "Alle Kapitel", "Kap. 1" … */
export function chapterFacet(store: WorldStore): Facet {
  const options = store.chapters().map((chapter) => ({ value: String(chapter.id), label: `Kap. ${chapter.number}`, title: chapter.name }));
  return { id: 'chapter', label: 'Nach Kapitel filtern', all: 'Alle Kapitel', options };
}

/** The row of categories: the categories of these entries in their tones, and "Ohne Kategorie". */
export function categoryFacet(entries: { category: string }[]): Facet {
  const options = categoriesOf(entries).map((name) => ({ value: categoryKey(name), label: name, colour: tagColour(name) }));
  return {
    id: 'category', label: 'Nach Kategorie filtern', all: 'Alle Kategorien',
    options: [...options, { value: '', label: 'Ohne Kategorie', colour: tagColour('') }],
  };
}

/** The row of the kinds of quests. */
export const QUEST_KIND_FACET: Facet = {
  id: 'kind', label: 'Nach Art filtern', all: 'Alle Arten', options: QUEST_KINDS.map((kind) => ({ value: kind.id, label: kind.label })),
};

/** The places with places inside them, as the row "Liegt in". */
export function placeFacet(store: WorldStore): Facet {
  const parents = store.locations().filter((place) => store.locations().some((other) => other.parent === place.id));
  return { id: 'in', label: 'Nach Ort filtern', all: 'Überall', options: parents.map((place) => ({ value: String(place.id), label: `in ${place.name}` })) };
}

/** Characters of the world, in groups by category. */
export function npcTiles(store: WorldStore, links: WorldNpc[] = store.npcs()): WallTile[] {
  return byCategory(links).map((link) => entryTile(store, { kind: 'npcs', id: link.npc }, link, categoryGrouped(link)));
}

/** Quests in groups by category; main quests first by their number, then side quests by name. */
export function questTiles(store: WorldStore, quests: Quest[] = store.quests()): WallTile[] {
  const rank = (quest: Quest) => (quest.kind === 'main' ? (quest.number ?? Number.MAX_SAFE_INTEGER) : Number.POSITIVE_INFINITY);
  const ordered = [...quests].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'de'));
  return byCategory(ordered).map((quest) => entryTile(store, { kind: 'quests', id: quest.id }, quest, categoryGrouped(quest), { kind: [quest.kind] }));
}

/** Events in groups by category. */
export function eventTiles(store: WorldStore, events: WorldEvent[] = store.events()): WallTile[] {
  return byCategory(events).map((event) => entryTile(store, { kind: 'events', id: event.id }, event, categoryGrouped(event)));
}

/** Knowledge in groups by category. */
export function knowledgeTiles(store: WorldStore, trivia: Trivia[]): WallTile[] {
  return byCategory(trivia).map((entry) => entryTile(store, { kind: 'trivia', id: entry.id }, entry, categoryGrouped(entry)));
}

/** Chapters by their number, in groups by category. */
export function chapterTiles(store: WorldStore, chapters: Chapter[] = store.chapters()): WallTile[] {
  return byCategory(chapters).map((chapter) => entryTile(store, { kind: 'chapters', id: chapter.id }, chapter, categoryGrouped(chapter)));
}

/**
 * Places in the order of their tree: every place is followed by the places inside it. A place with places inside
 * is a group with all of them; places on their own stand together under "Einzelne Orte". The row "Liegt in"
 * finds a place by every place around it.
 */
export function placeTiles(store: WorldStore): WallTile[] {
  const places = store.locations();
  const inside = (parent: Location) => places.filter((place) => place.parent === parent.id);
  const roots = places.filter((place) => !places.some((other) => other.id === place.parent));
  const walk = (place: Location, around: number[], group: WallGroupKey, seen: Set<number>): WallTile[] => {
    seen.add(place.id);
    const tile = entryTile(store, { kind: 'locations', id: place.id }, place, group, { in: around.map(String) });
    const below = inside(place).filter((child) => !seen.has(child.id));
    return [tile, ...below.flatMap((child) => walk(child, [...around, place.id], group, seen))];
  };
  const seen = new Set<number>();
  const trees = roots.filter((root) => inside(root).length).flatMap((root) => walk(root, [], { key: `place:${root.id}`, label: root.name }, seen));
  const single = roots.filter((root) => !inside(root).length).flatMap((root) => walk(root, [], { key: 'place:single', label: 'Einzelne Orte' }, seen));
  return [...trees, ...single];
}
