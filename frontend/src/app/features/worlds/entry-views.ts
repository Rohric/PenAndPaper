import { Params, Router } from '@angular/router';

import {
  Dialogue, EntryKind, EntryLink, EntryRef, EntryTexts, Knowledge, Npc, Phrase, Scene, TALENTS, isItem, questLabel,
} from '../../core/models';
import { damageText, skillValue } from '../../core/rules';
import { IconName } from '../../shared/icon';
import { tagColour } from '../../shared/tag-colour';
import { WorldStore } from './world-store';

/**
 * What the reading view of an entry shows: built here for every kind of entry,
 * so one component can display places, characters, quests, events and knowledge.
 */
export interface EntryViewModel {
  kicker: string;
  title: string;
  sub: string;
  /** The kind whose colour the entry shows, like "npcs" or "items". */
  tone: string;
  /** A colour of its own instead: knowledge shows the colour of its category. */
  colour?: string;
  /** The symbol the entry carries, and the usual symbol of its kind. */
  symbol: string;
  fallback: IconName;
  /** How many pictures the entry can show; places and items have room for three. */
  pictures: number;
  dialogues: Dialogue[];
  blocks: { label: string; text: string }[];
  /** Knowledge pieces in two groups: what players can learn, and what only the game master knows. */
  knowledge: { label: string; gmOnly: boolean; pieces: Knowledge[] }[];
  lists: { label: string; items: string[] }[];
  phrases: Phrase[];
  links: { label: string; items: EntryLink[] }[];
}

interface Named {
  id: number;
  name: string;
}

export const KIND_LABELS: Record<EntryKind, string> = {
  locations: 'Ort',
  npcs: 'Figur',
  quests: 'Quest',
  events: 'Ereignis',
  trivia: 'Wissen',
  chapters: 'Kapitel',
  scenes: 'Szene',
};

export { isItem };

const links = (kind: EntryKind, entries: Named[]): EntryLink[] => entries.map((e) => ({ kind, id: e.id, label: e.name }));
const among = <T extends Named>(entries: T[], ids: (number | null)[]): T[] => entries.filter((e) => ids.includes(e.id));

/** Links to characters; they are named by the id of the character, not of the world link. */
export function npcLinks(store: WorldStore, ids: (number | null)[]): EntryLink[] {
  return store
    .npcs()
    .filter((link) => ids.includes(link.npc))
    .map((link) => ({ kind: 'npcs', id: link.npc, label: link.name }));
}

/** Links to scenes, each with the number of its chapter. */
export function sceneLinks(store: WorldStore, scenes: Scene[]): EntryLink[] {
  const number = (scene: Scene) => store.chapters().find((chapter) => chapter.id === scene.chapter)?.number ?? '?';
  return scenes.map((scene) => ({ kind: 'scenes', id: scene.id, label: `Kap. ${number(scene)} · ${scene.name}` }));
}

/** Build the reading view of one entry; null when the entry does not exist (anymore). */
export function viewOf(store: WorldStore, ref: EntryRef, npc: Npc | null): EntryViewModel | null {
  switch (ref.kind) {
    case 'locations':
      return locationView(store, ref.id);
    case 'npcs':
      return npcView(store, ref.id, npc);
    case 'quests':
      return questView(store, ref.id);
    case 'events':
      return eventView(store, ref.id);
    case 'trivia':
      return triviaView(store, ref.id);
    default:
      return null;
  }
}

/** The two knowledge groups of an entry, labelled by who may read them. */
function knowledgeOf(entry: Pick<EntryTexts, 'player_knowledge' | 'gm_knowledge'>): EntryViewModel['knowledge'] {
  return [
    { label: 'Wissen für Spieler', gmOnly: false, pieces: entry.player_knowledge },
    { label: 'Wissen nur für dich', gmOnly: true, pieces: entry.gm_knowledge },
  ];
}

/** One text that says what an entry is about: its description, or else the first thing the game master knows. */
export function summaryOf(entry: EntryTexts): string {
  return entry.description || entry.gm_knowledge[0]?.text || '';
}

/** Everything written about an entry as one text, to search in. */
export function allText(entry: EntryTexts): string {
  const pieces = [...entry.player_knowledge, ...entry.gm_knowledge].map((piece) => `${piece.title} ${piece.text}`);
  return [entry.description, ...pieces].join(' ');
}

/** The knowledge attached to an entry, in two groups: its items and everything else. */
function attached(store: WorldStore, kind: 'locations' | 'npcs' | 'quests' | 'events', id: number): EntryViewModel['links'] {
  const all = store.trivia().filter((trivia) => trivia[kind].includes(id));
  return [
    { label: 'Gegenstände', items: links('trivia', all.filter(isItem)).map((link) => ({ ...link, tone: 'items' })) },
    { label: 'Wissen', items: links('trivia', all.filter((trivia) => !isItem(trivia))) },
  ];
}

function tidy(view: EntryViewModel): EntryViewModel {
  return {
    ...view,
    blocks: view.blocks.filter((block) => block.text.trim()),
    knowledge: view.knowledge.filter((group) => group.pieces.length),
    lists: view.lists.filter((list) => list.items.length),
    links: view.links.filter((group) => group.items.length),
  };
}

function locationView(store: WorldStore, id: number): EntryViewModel | null {
  const place = store.locations().find((l) => l.id === id);
  if (!place) {
    return null;
  }
  const here = <T extends { location: number | null }>(entries: T[]) => entries.filter((e) => e.location === id);
  return tidy({
    kicker: 'Ort', title: place.name, sub: '', lists: [], phrases: [], knowledge: knowledgeOf(place),
    tone: 'locations', symbol: place.symbol, fallback: 'pin', pictures: 3, dialogues: [],
    blocks: [{ label: 'Beschreibung', text: place.description }],
    links: [
      { label: 'Liegt in', items: links('locations', among(store.locations(), [place.parent])) },
      { label: 'Orte darin', items: links('locations', store.locations().filter((l) => l.parent === id)) },
      { label: 'Figuren hier', items: npcLinks(store, here(store.npcs()).map((n) => n.npc)) },
      { label: 'Quests hier', items: links('quests', here(store.quests())) },
      { label: 'Ereignisse hier', items: links('events', here(store.events())) },
      ...attached(store, 'locations', id),
      { label: 'Szenen hier', items: sceneLinks(store, here(store.scenes())) },
    ],
  });
}

function npcView(store: WorldStore, id: number, npc: Npc | null): EntryViewModel | null {
  const link = store.npcs().find((n) => n.npc === id);
  if (!link) {
    return null;
  }
  const loaded = npc?.id === id ? npc : null;
  return tidy({
    kicker: 'Figur', title: link.name, sub: link.profession, phrases: loaded?.phrases ?? [],
    tone: 'npcs', symbol: loaded?.symbol ?? link.symbol, fallback: 'sheet', pictures: 0, dialogues: [],
    knowledge: loaded ? knowledgeOf(loaded) : [],
    blocks: [
      { label: 'Beschreibung', text: loaded?.description ?? '' },
      { label: 'Steckbrief', text: loaded ? facts(loaded) : '' },
    ],
    lists: [
      { label: 'Fähigkeiten', items: loaded ? skillLines(loaded) : [] },
      { label: 'Inventar und Waffen', items: loaded ? itemLines(loaded) : [] },
      { label: 'Besondere Fähigkeiten', items: loaded ? abilityLines(loaded) : [] },
    ],
    links: [
      { label: 'Anzutreffen in', items: links('locations', among(store.locations(), [link.location])) },
      { label: 'Quests', items: links('quests', store.quests().filter((q) => q.giver === id || q.npcs.includes(id))) },
      { label: 'Szenen', items: sceneLinks(store, store.scenes().filter((s) => s.npcs.includes(id))) },
      ...attached(store, 'npcs', id),
    ],
  });
}

function facts(npc: Npc): string {
  const parts = [['Alter', npc.age], ['Geschlecht', npc.gender], ['Lebenspunkte', String(npc.life_points)]];
  return parts.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join(' · ');
}

function skillLines(npc: Npc): string[] {
  const talent = (id: string) => TALENTS.find((t) => t.id === id)?.label ?? '';
  return npc.skills.map((skill) => `${skill.name} · ${skillValue(skill, npc.skills)} (${talent(skill.talent)})`);
}

function itemLines(npc: Npc): string[] {
  return npc.inventory.map((item) => [`${item.quantity}× ${item.name}`, damageText(item)].filter(Boolean).join(' · '));
}

function abilityLines(npc: Npc): string[] {
  return npc.special_abilities.map((ability) => [ability.name, ability.description, ability.roll_condition].filter(Boolean).join(' · '));
}

function questView(store: WorldStore, id: number): EntryViewModel | null {
  const found = store.quests().find((q) => q.id === id);
  if (!found) {
    return null;
  }
  const quest = store.questNow(found);
  return tidy({
    kicker: questLabel(quest), title: quest.name, sub: '', phrases: [],
    tone: 'quests', symbol: quest.symbol, fallback: 'quest', pictures: 0, dialogues: quest.dialogues,
    knowledge: knowledgeOf(quest),
    blocks: [{ label: 'Beschreibung', text: quest.description }, { label: 'Ziel', text: quest.goal }],
    lists: [{ label: 'Checkliste', items: quest.checklist }],
    links: [
      { label: 'Startgebiet', items: links('locations', among(store.locations(), [quest.location])) },
      { label: 'Questgeber', items: npcLinks(store, [quest.giver]) },
      { label: 'Entsteht in Szene', items: sceneLinks(store, among(store.scenes(), [quest.scene])) },
      { label: 'Beteiligte Figuren', items: npcLinks(store, quest.npcs) },
      ...usedIn(store, 'quests', id),
    ],
  });
}

function eventView(store: WorldStore, id: number): EntryViewModel | null {
  const event = store.events().find((e) => e.id === id);
  if (!event) {
    return null;
  }
  return tidy({
    kicker: 'Ereignis', title: event.name, sub: '', lists: [], phrases: [], knowledge: knowledgeOf(event),
    tone: 'events', symbol: event.symbol, fallback: 'flag', pictures: 0, dialogues: event.dialogues,
    blocks: [
      { label: 'Auslöser', text: event.trigger },
      { label: 'Was passiert', text: event.happening },
      { label: 'Beschreibung', text: event.description },
    ],
    links: [
      { label: 'Ort', items: links('locations', among(store.locations(), [event.location])) },
      ...usedIn(store, 'events', id),
    ],
  });
}

/** Where a quest or an event is used: chapters and scenes, and the items and knowledge attached to it. */
function usedIn(store: WorldStore, kind: 'quests' | 'events', id: number): EntryViewModel['links'] {
  const chapters = store.chapters().filter((chapter) => chapter[kind].includes(id));
  return [
    { label: 'Kapitel', items: chapters.map((c) => ({ kind: 'chapters', id: c.id, label: `Kapitel ${c.number} · ${c.name}` })) },
    { label: 'Szenen', items: sceneLinks(store, store.scenes().filter((scene) => scene[kind].includes(id))) },
    ...attached(store, kind, id),
  ];
}

function triviaView(store: WorldStore, id: number): EntryViewModel | null {
  const trivia = store.trivia().find((t) => t.id === id);
  if (!trivia) {
    return null;
  }
  return tidy({
    kicker: trivia.category || 'Wissen', title: trivia.name, sub: '', lists: [], phrases: [], knowledge: knowledgeOf(trivia),
    tone: isItem(trivia) ? 'items' : 'trivia', colour: trivia.category.trim() ? tagColour(trivia.category) : '',
    symbol: trivia.symbol, fallback: isItem(trivia) ? 'gift' : 'note',
    pictures: isItem(trivia) ? 3 : 0, dialogues: [],
    blocks: [{ label: 'Beschreibung', text: trivia.description }],
    links: [
      { label: 'Orte', items: links('locations', among(store.locations(), trivia.locations)) },
      { label: 'Figuren', items: npcLinks(store, trivia.npcs) },
      { label: 'Quests', items: links('quests', among(store.quests(), trivia.quests)) },
      { label: 'Ereignisse', items: links('events', among(store.events(), trivia.events)) },
      { label: 'Szenen', items: sceneLinks(store, store.scenes().filter((s) => s.trivia.includes(id))) },
    ],
  });
}

/** Where an entry lives in the app: scenes and chapters on the chapter page, the rest in the glossary. */
export function entryAddress(store: WorldStore, ref: EntryRef): { commands: unknown[]; queryParams: Params } {
  const base = ['/gm/worlds', store.worldId()];
  if (ref.kind === 'chapters') {
    return { commands: [...base, 'chapters', ref.id], queryParams: {} };
  }
  if (ref.kind === 'scenes') {
    const chapter = store.scenes().find((scene) => scene.id === ref.id)?.chapter;
    return { commands: [...base, 'chapters', chapter], queryParams: { tab: 'scenes', scene: ref.id } };
  }
  const item = ref.kind === 'trivia' && store.trivia().some((trivia) => trivia.id === ref.id && isItem(trivia));
  return { commands: [...base, 'glossary', item ? 'items' : ref.kind], queryParams: { entry: ref.id } };
}

/** Follow a link: scenes and chapters are opened, everything else is looked up in the side panel. */
export function openEntry(store: WorldStore, router: Router, ref: EntryRef): void {
  if (ref.kind !== 'chapters' && ref.kind !== 'scenes') {
    store.peek.set({ kind: ref.kind, id: ref.id });
    return;
  }
  store.peek.set(null);
  if (ref.kind === 'scenes' && store.openScene) {
    store.openScene(ref.id);
    return;
  }
  const address = entryAddress(store, ref);
  void router.navigate(address.commands, { queryParams: address.queryParams });
}
