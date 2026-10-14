import { describe, expect, it } from 'vitest';

import { Quest, Scene, WorldNpc } from './models';
import { changeOne, changedText, deleteQuestion, noteEntry, tableGroups, withChanges } from './round';
import { Note, SessionEntry } from './session-models';

const quest = { id: 7, name: 'Der Schwarzmarkt', description: 'Im Hafen', goal: 'Finde den Händler', giver: 3, location: 4, scene: null } as unknown as Quest;
const scene = { id: 2, name: 'Taverne', description: 'Es wird laut', to_read: 'Rauch', location: 4 } as unknown as Scene;
const npc = { id: 1, npc: 9, name: 'Sigrun', profession: 'Wache', location: 4 } as unknown as WorldNpc;

const entry = (kind: SessionEntry['kind'], id: number, group: string, onTable = true): SessionEntry =>
  ({ id: id * 10, kind, entry_id: id, on_table: onTable, table_group: group }) as unknown as SessionEntry;
const note = (id: number, group: string): Note => ({ id, title: `Notiz ${id}`, text: '', table_group: group, mine: true }) as unknown as Note;

describe('changedText', () => {
  it('counts a text, but never an empty name or a link', () => {
    expect(changedText({ description: '' }, 'description')).toBe('');
    expect(changedText({ name: '' }, 'name')).toBeUndefined();
    expect(changedText({ name: null }, 'name')).toBeUndefined();
    expect(changedText(undefined, 'goal')).toBeUndefined();
  });
});

describe('withChanges', () => {
  it('shows the texts of the round instead of those of the world', () => {
    const changed = withChanges('quest', quest, { name: 'Die Schmuggler', goal: 'Folge dem Boot' });
    expect([changed.name, changed.goal, changed.description]).toEqual(['Die Schmuggler', 'Folge dem Boot', 'Im Hafen']);
    expect(quest.name).toBe('Der Schwarzmarkt');
  });

  it('takes the links of a quest, also when the round takes one away', () => {
    const changed = withChanges('quest', quest, { giver: null, scene: 2 });
    expect([changed.giver, changed.location, changed.scene]).toEqual([null, 4, 2]);
  });

  it('only changes what the kind allows: a scene keeps its place, a character only gets a name', () => {
    const changes = { name: 'Schänke', to_read: 'Laute Musik', location: 8 };
    expect(withChanges('scene', scene, changes)).toMatchObject({ name: 'Schänke', to_read: 'Laute Musik', location: 4 });
    const named = withChanges('npc', npc, { name: 'Hauptfrau Sigrun', description: 'Narbe am Kinn' });
    expect(named.name).toBe('Hauptfrau Sigrun');
    expect('description' in named).toBe(false);
  });

  it('keeps the very same object when nothing differs', () => {
    expect(withChanges('quest', quest, undefined)).toBe(quest);
    expect(withChanges('quest', quest, {})).toBe(quest);
    expect(withChanges('quest', quest, { name: '' })).toBe(quest);
  });
});

describe('changeOne', () => {
  it('sets a change and keeps the others', () => {
    expect(changeOne({ goal: 'Folge dem Boot' }, 'name', 'Die Schmuggler', 'Der Schwarzmarkt')).toEqual({ goal: 'Folge dem Boot', name: 'Die Schmuggler' });
  });

  it('takes a change away when the field is emptied or equals the world again', () => {
    expect(changeOne({ name: 'Die Schmuggler', goal: 'x' }, 'name', '  ', 'Der Schwarzmarkt')).toEqual({ goal: 'x' });
    expect(changeOne({ name: 'Die Schmuggler' }, 'name', 'Der Schwarzmarkt', 'Der Schwarzmarkt')).toEqual({});
    expect(changeOne({ giver: null }, 'giver', 3, 3)).toEqual({});
  });

  it('keeps a link the round takes away, unless the world has none either', () => {
    expect(changeOne({}, 'giver', null, 3)).toEqual({ giver: null });
    expect(changeOne({}, 'scene', null, null)).toEqual({});
  });
});

describe('tableGroups', () => {
  it('puts entries and notes into their groups, the loose entries first, the rest by name', () => {
    const groups = tableGroups([entry('npc', 1, 'Zum Schluss'), entry('quest', 2, ''), entry('scene', 3, 'Kampf')], [note(5, 'Kampf'), note(6, 'Anfang')]);
    expect(groups.map((group) => [group.name, group.entries.length, group.notes.length])).toEqual([
      ['', 1, 0],
      ['Anfang', 0, 1],
      ['Kampf', 1, 1],
      ['Zum Schluss', 1, 0],
    ]);
    expect(groups[2].entries[0].ref).toEqual({ kind: 'scenes', id: 3 });
  });

  it('keeps a group only while something lies in it or it was just made, and lays no note without a group', () => {
    const groups = tableGroups([entry('npc', 1, 'Weg', false)], [note(5, '')], ['Neu']);
    expect(groups.map((group) => group.name)).toEqual(['Neu']);
  });
});

describe('deleteQuestion', () => {
  it('says what happens to the entries and the notes of the group', () => {
    expect(deleteQuestion({ name: 'Kampf', entries: [1], notes: [1] }, 'Kampf')).toBe('Gruppe „Kampf“ löschen? Die Einträge gehen vom Tisch, die Notizen werden gelöscht.');
    expect(deleteQuestion({ name: 'Kampf', entries: [1], notes: [] }, 'Kampf')).toBe('Gruppe „Kampf“ löschen? Die Einträge gehen vom Tisch.');
    expect(deleteQuestion({ name: 'Kampf', entries: [], notes: [1] }, 'Kampf')).toBe('Gruppe „Kampf“ löschen? Die Notizen werden gelöscht.');
    expect(deleteQuestion({ name: 'Leer', entries: [], notes: [] }, 'Leer')).toBe('Gruppe „Leer“ löschen?');
  });
});

describe('noteEntry', () => {
  const written = { title: 'Der Wirt', text: 'Er lügt.' };

  it('turns the title into the name and the text into the description', () => {
    expect(noteEntry('locations', written)).toEqual({ list: 'locations', body: { name: 'Der Wirt', description: 'Er lügt.' }, kind: 'locations' });
    expect(noteEntry('scenes', written)).toEqual({ list: 'scenes', body: { name: 'Der Wirt', description: 'Er lügt.' }, kind: 'scenes' });
  });

  it('makes an item a knowledge entry of the category "Gegenstand" and a character by its name only', () => {
    expect(noteEntry('items', written)).toEqual({ list: 'trivia', body: { name: 'Der Wirt', description: 'Er lügt.', category: 'Gegenstand' }, kind: 'trivia' });
    expect(noteEntry('npcs', written)).toEqual({ list: 'world-npcs', body: { name: 'Der Wirt' }, kind: 'npcs' });
  });

  it('never makes an entry without a name', () => {
    expect(noteEntry('trivia', { title: '  ', text: '' }).body['name']).toBe('Neue Notiz');
  });
});
