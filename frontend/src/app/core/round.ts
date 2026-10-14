// What a round has of its own, without changing the world: the texts it changes about an entry of the world
// ("In dieser Runde ändern"), the groups of the table of the game master and the notes lying in them.

import { EntryKind, EntryRef, ITEM_CATEGORY } from './models';
import { EntryChanges, LinkKey, Note, SessionEntry, SessionEntryKind, TextKey } from './session-models';

/** One text field of the form "In dieser Runde ändern": its key, its label and whether it is a long text. */
export interface ChangeField {
  key: TextKey;
  label: string;
  long: boolean;
}

const NAME: ChangeField = { key: 'name', label: 'Name', long: false };
const DESCRIPTION: ChangeField = { key: 'description', label: 'Beschreibung', long: true };

/** The texts a round may change, by the kind of the entry, in the order of the form; the backend allows the same. */
export const CHANGE_FIELDS: Record<SessionEntryKind, ChangeField[]> = {
  location: [NAME, DESCRIPTION],
  npc: [NAME, DESCRIPTION],
  trivia: [NAME, DESCRIPTION],
  event: [NAME, DESCRIPTION, { key: 'trigger', label: 'Auslöser', long: true }, { key: 'happening', label: 'Was passiert', long: true }],
  scene: [NAME, { key: 'description', label: 'Was passiert', long: true }, { key: 'to_read', label: 'Vorlesen', long: true }],
  quest: [NAME, DESCRIPTION, { key: 'goal', label: 'Ziel', long: true }],
};

/** The links a round may change about a quest. */
export const QUEST_LINKS: LinkKey[] = ['giver', 'location', 'scene'];

/** How the kinds of world entries are called in a session. An NPC is named by the id of the character. */
export const SESSION_KINDS: Partial<Record<EntryKind, SessionEntryKind>> = {
  scenes: 'scene',
  quests: 'quest',
  events: 'event',
  locations: 'location',
  npcs: 'npc',
  trivia: 'trivia',
};

/** How the kinds of a session are called among the entries of a world. */
export const ENTRY_KINDS: Record<SessionEntryKind, EntryKind> = {
  scene: 'scenes',
  quest: 'quests',
  event: 'events',
  location: 'locations',
  npc: 'npcs',
  trivia: 'trivia',
};

/**
 * One changed text as it counts, the same way the server reads it: only a text counts, and an empty name never does,
 * so an entry never loses its name. Undefined when the world's text stays.
 */
export function changedText(changes: EntryChanges | undefined, key: TextKey): string | undefined {
  const value = changes?.[key];
  return typeof value === 'string' && (key !== 'name' || value) ? value : undefined;
}

/**
 * An entry as a round has it: the changed texts of its kind and, for a quest, the changed links instead of those of
 * the world. Only what the entry has is changed, and an entry without any change stays the same object.
 */
export function withChanges<T extends object>(kind: SessionEntryKind, entry: T, changes: EntryChanges | undefined): T {
  if (!changes) {
    return entry;
  }
  const patch: Record<string, unknown> = {};
  for (const field of CHANGE_FIELDS[kind]) {
    const text = changedText(changes, field.key);
    if (text !== undefined && field.key in entry) {
      patch[field.key] = text;
    }
  }
  for (const key of kind === 'quest' ? QUEST_LINKS : []) {
    if (key in changes) {
      patch[key] = changes[key] ?? null;
    }
  }
  return Object.keys(patch).length ? { ...entry, ...patch } : entry;
}

/**
 * The changes after one field of the form was set. What equals the world again is no change anymore, and an emptied
 * text takes its change away, so the world's text comes back.
 */
export function changeOne<K extends TextKey | LinkKey>(
  changes: EntryChanges | undefined, key: K, value: EntryChanges[K], world: unknown,
): EntryChanges {
  const next: EntryChanges = { ...changes };
  const emptied = typeof value === 'string' && !value.trim();
  if (emptied || (value ?? null) === (world ?? null)) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return next;
}

/** What lies in one group of the table: entries of the world or the round, and notes of the game master. */
export interface TableGroup {
  /** Empty for what lies on the table without a group of its own. */
  name: string;
  entries: { ref: EntryRef; kind: SessionEntryKind }[];
  notes: Note[];
}

/**
 * The groups of the table in the order of their names; what has no group comes first. A group is there as long as
 * it holds entries or notes; a group that was just made stays while it is named in "made". A note lies on the table
 * only in a group of its own; without one it is an ordinary note.
 */
export function tableGroups(entries: SessionEntry[], notes: Note[], made: string[] = []): TableGroup[] {
  const placed = entries.filter((entry) => entry.on_table);
  const lying = notes.filter((note) => note.table_group);
  const names = new Set(['', ...made, ...placed.map((entry) => entry.table_group), ...lying.map((note) => note.table_group)]);
  return [...names]
    .sort((a, b) => Number(!!a) - Number(!!b) || a.localeCompare(b, 'de'))
    .map((name) => ({
      name,
      entries: placed.filter((entry) => entry.table_group === name).map((entry) => ({ ref: { kind: ENTRY_KINDS[entry.kind], id: entry.entry_id }, kind: entry.kind })),
      notes: lying.filter((note) => note.table_group === name),
    }))
    .filter((group) => group.entries.length || group.notes.length || made.includes(group.name));
}

/** The question before a group of the table is deleted, by what lies in it. */
export function deleteQuestion(group: { name: string; entries: unknown[]; notes: unknown[] }, label: string): string {
  const entries = group.entries.length ? 'Die Einträge gehen vom Tisch' : '';
  const notes = group.notes.length ? 'die Notizen werden gelöscht' : '';
  const what = [entries, notes].filter(Boolean).join(', ');
  const sentence = what ? ` ${what.charAt(0).toUpperCase()}${what.slice(1)}.` : '';
  return `Gruppe „${label}“ löschen?${sentence}`;
}

/** What a note on the table can become: the kinds of entries, each with its word and the colour of its kind. */
export type NoteTarget = 'scenes' | 'locations' | 'npcs' | 'quests' | 'events' | 'items' | 'trivia';

export const NOTE_TARGETS: { id: NoteTarget; label: string }[] = [
  { id: 'scenes', label: 'Szene' },
  { id: 'locations', label: 'Ort' },
  { id: 'npcs', label: 'Figur' },
  { id: 'quests', label: 'Quest' },
  { id: 'events', label: 'Ereignis' },
  { id: 'items', label: 'Gegenstand' },
  { id: 'trivia', label: 'Wissen' },
];

/** The new entry a note turns into: the list it is created in, what is sent, and its kind as an entry. */
export interface NoteEntry {
  list: 'scenes' | 'locations' | 'world-npcs' | 'quests' | 'events' | 'trivia';
  body: Record<string, unknown>;
  kind: EntryKind;
}

/**
 * Turn a note into the entry of a kind: its title becomes the name, its text the description. A scene keeps the text
 * as what happens in it, an item gets the category that makes it an item. A character is created by its name; its
 * description belongs to the character itself and is written there afterwards.
 */
export function noteEntry(target: NoteTarget, note: Pick<Note, 'title' | 'text'>): NoteEntry {
  const name = note.title.trim() || 'Neue Notiz';
  const description = note.text;
  switch (target) {
    case 'npcs':
      return { list: 'world-npcs', body: { name }, kind: 'npcs' };
    case 'items':
      return { list: 'trivia', body: { name, description, category: ITEM_CATEGORY }, kind: 'trivia' };
    default:
      return { list: target, body: { name, description }, kind: target };
  }
}
