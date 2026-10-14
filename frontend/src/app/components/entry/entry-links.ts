import { EntryKind, EntryRef, isItem } from '../../core/models';
import { WorldStore } from '../../core/world-store';
import { viewOf } from './entry-views';

/** One labelled group of entries that an entry is connected to. */
export interface Connection {
  label: string;
  refs: EntryRef[];
}

/** The connections of an entry, labelled; scenes are built here, everything else comes from the reading view. */
export function connectionsOf(store: WorldStore, ref: EntryRef): Connection[] {
  if (ref.kind === 'scenes') {
    return sceneConnections(store, ref.id);
  }
  return (viewOf(store, ref, null)?.links ?? []).map((group) => ({
    label: group.label,
    refs: group.items.filter((item) => item.kind !== 'chapters').map((item): EntryRef => ({ kind: item.kind, id: item.id })),
  }));
}

function sceneConnections(store: WorldStore, id: number): Connection[] {
  const scene = store.scenes().find((other) => other.id === id);
  if (!scene) {
    return [];
  }
  const of = (kind: EntryKind, ids: number[]): EntryRef[] => ids.map((entry) => ({ kind, id: entry }));
  const trivia = store.trivia().filter((entry) => scene.trivia.includes(entry.id));
  const quests = store.quests().filter((quest) => scene.quests.includes(quest.id) || quest.scene === scene.id);
  return [
    { label: 'Ort', refs: of('locations', scene.location ? [scene.location] : []) },
    { label: 'Figuren', refs: of('npcs', scene.npcs) },
    { label: 'Quests', refs: of('quests', quests.map((quest) => quest.id)) },
    { label: 'Ereignisse', refs: of('events', scene.events) },
    { label: 'Gegenstände', refs: of('trivia', trivia.filter(isItem).map((entry) => entry.id)) },
    { label: 'Wissen', refs: of('trivia', trivia.filter((entry) => !isItem(entry)).map((entry) => entry.id)) },
    { label: 'Führt zu', refs: of('scenes', scene.leads_to) },
  ];
}
