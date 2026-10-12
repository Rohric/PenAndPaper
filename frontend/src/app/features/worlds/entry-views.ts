import { Params, Router } from '@angular/router';

import { EntryKind, EntryLink, EntryRef, Npc, Phrase, QUEST_KINDS, Scene, TALENTS } from '../../core/models';
import { damageText, skillValue } from '../../core/rules';
import { WorldStore } from './world-store';

/**
 * What the reading view of an entry shows: built here for every kind of entry,
 * so one component can display places, characters, quests, events and knowledge.
 */
export interface EntryViewModel {
  kicker: string;
  title: string;
  sub: string;
  blocks: { label: string; text: string }[];
  lists: { label: string; items: string[] }[];
  phrases: Phrase[];
  links: { label: string; items: EntryLink[] }[];
}

/** A search result: a link with the kind of entry it leads to. */
export interface SearchHit extends EntryLink {
  kicker: string;
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

function tidy(view: EntryViewModel): EntryViewModel {
  return {
    ...view,
    blocks: view.blocks.filter((block) => block.text.trim()),
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
    kicker: 'Ort', title: place.name, sub: '', lists: [], phrases: [],
    blocks: [{ label: 'Beschreibung', text: place.lore }],
    links: [
      { label: 'Liegt in', items: links('locations', among(store.locations(), [place.parent])) },
      { label: 'Orte darin', items: links('locations', store.locations().filter((l) => l.parent === id)) },
      { label: 'Figuren hier', items: npcLinks(store, here(store.npcs()).map((n) => n.npc)) },
      { label: 'Quests hier', items: links('quests', here(store.quests())) },
      { label: 'Ereignisse hier', items: links('events', here(store.events())) },
      { label: 'Wissen', items: links('trivia', store.trivia().filter((t) => t.locations.includes(id))) },
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
    blocks: [
      { label: 'Steckbrief', text: loaded ? facts(loaded) : '' },
      { label: 'Beschreibung', text: loaded?.description ?? '' },
    ],
    lists: [
      { label: 'Fähigkeiten', items: loaded ? skillLines(loaded) : [] },
      { label: 'Inventar und Waffen', items: loaded ? itemLines(loaded) : [] },
    ],
    links: [
      { label: 'Anzutreffen in', items: links('locations', among(store.locations(), [link.location])) },
      { label: 'Quests', items: links('quests', store.quests().filter((q) => q.giver === id || q.npcs.includes(id))) },
      { label: 'Szenen', items: sceneLinks(store, store.scenes().filter((s) => s.npcs.includes(id))) },
      { label: 'Wissen', items: links('trivia', store.trivia().filter((t) => t.npcs.includes(id))) },
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

function questView(store: WorldStore, id: number): EntryViewModel | null {
  const quest = store.quests().find((q) => q.id === id);
  if (!quest) {
    return null;
  }
  return tidy({
    kicker: QUEST_KINDS.find((k) => k.id === quest.kind)?.label ?? 'Quest', title: quest.name, sub: '', phrases: [],
    blocks: [{ label: 'Text', text: quest.text }, { label: 'Ziel', text: quest.goal }],
    lists: [{ label: 'Checkliste', items: quest.checklist }],
    links: [
      { label: 'Ort', items: links('locations', among(store.locations(), [quest.location])) },
      { label: 'Auftraggeber', items: npcLinks(store, [quest.giver]) },
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
    kicker: 'Ereignis', title: event.name, sub: '', lists: [], phrases: [],
    blocks: [{ label: 'Was passiert', text: event.text }],
    links: [
      { label: 'Ort', items: links('locations', among(store.locations(), [event.location])) },
      ...usedIn(store, 'events', id),
    ],
  });
}

/** Where a quest or an event is used: chapters, scenes and knowledge. */
function usedIn(store: WorldStore, kind: 'quests' | 'events', id: number): EntryViewModel['links'] {
  const chapters = store.chapters().filter((chapter) => chapter[kind].includes(id));
  return [
    { label: 'Kapitel', items: chapters.map((c) => ({ kind: 'chapters', id: c.id, label: `Kapitel ${c.number} · ${c.name}` })) },
    { label: 'Szenen', items: sceneLinks(store, store.scenes().filter((scene) => scene[kind].includes(id))) },
    { label: 'Wissen', items: links('trivia', store.trivia().filter((trivia) => trivia[kind].includes(id))) },
  ];
}

function triviaView(store: WorldStore, id: number): EntryViewModel | null {
  const trivia = store.trivia().find((t) => t.id === id);
  if (!trivia) {
    return null;
  }
  return tidy({
    kicker: trivia.category || 'Wissen', title: trivia.name, sub: '', lists: [], phrases: [],
    blocks: [{ label: 'Text', text: trivia.text }],
    links: [
      { label: 'Orte', items: links('locations', among(store.locations(), trivia.locations)) },
      { label: 'Figuren', items: npcLinks(store, trivia.npcs) },
      { label: 'Quests', items: links('quests', among(store.quests(), trivia.quests)) },
      { label: 'Ereignisse', items: links('events', among(store.events(), trivia.events)) },
      { label: 'Szenen', items: sceneLinks(store, store.scenes().filter((s) => s.trivia.includes(id))) },
    ],
  });
}

/** Find the typed text in names and texts of the whole glossary. */
export function searchGlossary(store: WorldStore, text: string): SearchHit[] {
  const query = text.trim().toLowerCase();
  const has = (...texts: string[]) => texts.some((t) => t.toLowerCase().includes(query));
  const hits = (kind: EntryKind, entries: Named[]) => links(kind, entries).map((l) => ({ ...l, kicker: KIND_LABELS[kind] }));
  return [
    ...hits('locations', store.locations().filter((l) => has(l.name, l.lore))),
    ...npcLinks(store, store.npcs().filter((n) => has(n.name, n.profession)).map((n) => n.npc)).map((l) => ({ ...l, kicker: 'Figur' })),
    ...hits('quests', store.quests().filter((q) => has(q.name, q.text, q.goal))),
    ...hits('events', store.events().filter((e) => has(e.name, e.text))),
    ...hits('trivia', store.trivia().filter((t) => has(t.name, t.category, t.text))),
  ];
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
  return { commands: [...base, 'glossary', ref.kind], queryParams: { entry: ref.id } };
}

/** Follow a link: scenes and chapters are opened, everything else is looked up in the side panel. */
export function openEntry(store: WorldStore, router: Router, ref: EntryRef): void {
  if (ref.kind !== 'chapters' && ref.kind !== 'scenes') {
    store.peek.set({ kind: ref.kind, id: ref.id });
    return;
  }
  const address = entryAddress(store, ref);
  store.peek.set(null);
  void router.navigate(address.commands, { queryParams: address.queryParams });
}
