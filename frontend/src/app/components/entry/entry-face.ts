import { Chapter, EntryLink, EntryRef, EntryTexts, isItem, questLabel } from '../../core/models';
import { WorldStore } from '../../core/world-store';
import { IconName } from '../basic/icon';
import { KIND_LABELS, kickerOf, npcLinks, sceneLinks, summaryOf, viewOf } from './entry-views';
import { tagColour } from './tag-colour';

/** A link of an entry with the word that says what it is to the entry, like "Questgeber". */
export interface FaceTag extends EntryLink {
  word: string;
}

/** What a card shows of an entry of the world, the same for every kind. */
export interface Face {
  name: string;
  /** The kind in words, like "Ort" or "Hauptquest 2". */
  kicker: string;
  symbol: string;
  fallback: IconName;
  /** The kind whose colour the card shows, like "npcs" or "items". */
  tone: string;
  /** A colour of its own instead: knowledge shows the colour of its category. */
  colour: string;
  /** One line that stands before the text, like the goal of a quest or what sets an event off. */
  lead: { label: string; text: string } | null;
  /** What the entry is about, in a few lines. */
  text: string;
  /** How many points the checklist of a quest has; 0 for everything else. */
  steps: number;
  /** A small line of figures, like what a chapter holds. */
  facts: string;
  /** What the entry is linked to, for the largest size of the card. */
  tags: FaceTag[];
}

type Maker = (store: WorldStore, id: number) => Face | null;

const BASE = { colour: '', lead: null, steps: 0, facts: '', tags: [] };
const tagged = (word: string, links: EntryLink[]): FaceTag[] => links.map((link) => ({ ...link, word }));

/** The word a tag of a connection carries, by the group the reading view puts it in; chapters are tags of their own. */
const CONNECTION_WORDS: Record<string, string> = {
  'Liegt in': 'In', 'Orte darin': 'Ort', 'Figuren hier': 'Figur', 'Quests hier': 'Quest', 'Ereignisse hier': 'Ereignis',
  'Szenen hier': 'Szene', Ort: 'Ort', Figuren: 'Figur', 'Führt zu': 'Führt zu', Szenen: 'Szene', Gegenstände: 'Gegenstand', Wissen: 'Wissen',
};

/** The connections of an entry as tags, as the reading view lists them. */
function connectionTags(store: WorldStore, ref: EntryRef): FaceTag[] {
  return (viewOf(store, ref, null)?.links ?? []).flatMap((group) =>
    CONNECTION_WORDS[group.label] ? tagged(CONNECTION_WORDS[group.label], group.items) : [],
  );
}

/** The lists of a chapter that carry its entries, by the kind of the entry. */
const CHAPTER_LISTS: Partial<Record<EntryRef['kind'], 'locations' | 'npcs' | 'quests' | 'events' | 'trivia'>> = {
  locations: 'locations',
  npcs: 'npcs',
  quests: 'quests',
  events: 'events',
  trivia: 'trivia',
};

/** The chapters an entry is tagged with; a scene has the one chapter it belongs to. */
export function chaptersOf(store: WorldStore, ref: EntryRef): Chapter[] {
  if (ref.kind === 'scenes') {
    const scene = store.scenes().find((other) => other.id === ref.id);
    return store.chapters().filter((chapter) => chapter.id === scene?.chapter);
  }
  const list = CHAPTER_LISTS[ref.kind];
  return list ? store.chapters().filter((chapter) => chapter[list].includes(ref.id)) : [];
}

/** What a card shows of an entry, or null when the entry is gone. */
export function faceOf(store: WorldStore, ref: EntryRef): Face | null {
  return MAKERS[ref.kind]?.(store, ref.id) ?? null;
}

function texts<T extends EntryTexts & { id: number; name: string; symbol?: string }>(entries: T[], id: number): T | null {
  return entries.find((entry) => entry.id === id) ?? null;
}

function locationFace(store: WorldStore, id: number): Face | null {
  const place = texts(store.locations(), id);
  const parent = store.locations().find((other) => other.id === place?.parent);
  return place && {
    ...BASE, name: place.name, kicker: kickerOf(KIND_LABELS.locations, place.category, parent ? `in ${parent.name}` : ''),
    symbol: place.symbol, fallback: 'pin', tone: 'locations', text: summaryOf(place),
    tags: connectionTags(store, { kind: 'locations', id }),
  };
}

function npcFace(store: WorldStore, id: number): Face | null {
  const link = store.npcs().find((npc) => npc.npc === id);
  return link
    ? { ...BASE, name: link.name, kicker: kickerOf(KIND_LABELS.npcs, link.category), symbol: link.symbol, fallback: 'sheet', tone: 'npcs', text: link.profession }
    : null;
}

function questFace(store: WorldStore, id: number): Face | null {
  const quest = texts(store.quests(), id);
  if (!quest) {
    return null;
  }
  const lead = quest.goal ? { label: 'Ziel', text: quest.goal } : null;
  const text = quest.description || (lead ? '' : summaryOf(quest));
  return {
    ...BASE, name: quest.name, kicker: kickerOf(questLabel(quest), quest.category), symbol: quest.symbol, fallback: 'quest', tone: 'quests',
    lead, text, steps: quest.checklist.length, tags: questTags(store, quest),
  };
}

function questTags(store: WorldStore, quest: { id: number; giver: number | null; location: number | null; scene: number | null; npcs: number[] }): FaceTag[] {
  const places = store.locations().filter((place) => place.id === quest.location);
  const scenes = store.scenes().filter((scene) => scene.id === quest.scene);
  const items = store.trivia().filter((trivia) => isItem(trivia) && trivia.quests.includes(quest.id));
  return [
    ...tagged('Questgeber', npcLinks(store, [quest.giver])),
    ...tagged('Startgebiet', places.map((place) => ({ kind: 'locations', id: place.id, label: place.name }))),
    ...tagged('Szene', sceneLinks(store, scenes)),
    ...tagged('Figur', npcLinks(store, quest.npcs)),
    ...tagged('Gegenstand', items.map((item) => ({ kind: 'trivia', id: item.id, label: item.name, tone: 'items' }))),
  ];
}

function eventFace(store: WorldStore, id: number): Face | null {
  const event = texts(store.events(), id);
  const lead = event?.trigger ? { label: 'Auslöser', text: event.trigger } : null;
  return event && {
    ...BASE, name: event.name, kicker: kickerOf(KIND_LABELS.events, event.category), symbol: event.symbol, fallback: 'flag', tone: 'events',
    lead, text: event.happening || summaryOf(event), tags: connectionTags(store, { kind: 'events', id }),
  };
}

function triviaFace(store: WorldStore, id: number): Face | null {
  const trivia = texts(store.trivia(), id);
  if (!trivia) {
    return null;
  }
  if (isItem(trivia)) {
    return { ...BASE, name: trivia.name, kicker: 'Gegenstand', symbol: trivia.symbol, fallback: 'gift', tone: 'items', text: summaryOf(trivia) };
  }
  const category = trivia.category.trim();
  return {
    ...BASE, name: trivia.name, kicker: category || KIND_LABELS.trivia, symbol: trivia.symbol, fallback: 'note', tone: 'trivia',
    colour: category ? tagColour(category) : '', text: summaryOf(trivia),
  };
}

function sceneFace(store: WorldStore, id: number): Face | null {
  const scene = store.scenes().find((entry) => entry.id === id);
  const chapter = store.chapters().find((other) => other.id === scene?.chapter);
  return scene
    ? {
        ...BASE, name: scene.name, kicker: kickerOf(KIND_LABELS.scenes, scene.category, chapter ? `Kap. ${chapter.number}` : ''),
        symbol: '', fallback: 'book', tone: 'scenes', text: scene.to_read || scene.description,
      }
    : null;
}

function chapterFace(store: WorldStore, id: number): Face | null {
  const chapter = store.chapters().find((entry) => entry.id === id);
  return chapter
    ? {
        ...BASE, name: chapter.name, kicker: kickerOf(`Kapitel ${chapter.number}`, chapter.category), symbol: '', fallback: 'book',
        tone: 'chapters', text: chapter.description || chapter.to_read, facts: chapterFacts(store, chapter),
      }
    : null;
}

/** What a chapter holds, in a few figures: "3 Szenen · 2 Quests · 4 Ereignisse". */
function chapterFacts(store: WorldStore, chapter: Chapter): string {
  const count = (number: number, one: string, many: string) => `${number} ${number === 1 ? one : many}`;
  return [
    count(store.scenesOf(chapter.id).length, 'Szene', 'Szenen'),
    count(chapter.quests.length, 'Quest', 'Quests'),
    count(chapter.events.length, 'Ereignis', 'Ereignisse'),
  ].join(' · ');
}

const MAKERS: Record<EntryRef['kind'], Maker> = {
  locations: locationFace,
  npcs: npcFace,
  quests: questFace,
  events: eventFace,
  trivia: triviaFace,
  scenes: sceneFace,
  chapters: chapterFace,
};
