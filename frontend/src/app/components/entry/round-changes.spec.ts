import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { CharacterService } from '../../core/character.service';
import { EntryRef } from '../../core/models';
import { EntryChanges } from '../../core/session-models';
import { SessionStore } from '../../core/session-store';
import { WorldStore } from '../../core/world-store';
import { RoundChanges } from './round-changes';

/** The entries of the world as they are written. */
const WRITTEN: Record<string, object> = {
  'locations:4': { id: 4, name: 'Hafen', description: 'Es riecht nach Fisch.' },
  'events:5': { id: 5, name: 'Sturm', description: '', trigger: 'Nachts', happening: 'Die Boote reißen sich los.' },
  'quests:7': { id: 7, name: 'Der Schwarzmarkt', description: '', goal: 'Finde den Händler', giver: 2, location: 4, scene: null },
  'npcs:9': { id: 1, npc: 9, name: 'Sigrun' },
};

describe('RoundChanges', () => {
  let changes: WritableSignal<EntryChanges>;
  let session: { state: () => { changes: EntryChanges }; setChanges: Mock };
  let fixture: ComponentFixture<RoundChanges>;
  let host: HTMLElement;

  async function open(entry: EntryRef, start: EntryChanges = {}): Promise<void> {
    changes = signal(start);
    session = {
      state: () => ({ changes: changes() }),
      setChanges: vi.fn((_kind: string, _id: number, next: EntryChanges) => changes.set(next)),
    };
    const world = {
      asWritten: (ref: EntryRef) => WRITTEN[`${ref.kind}:${ref.id}`] ?? null,
      npcOptions: () => [{ id: 2, label: 'Bettler' }],
      locationOptions: () => [{ id: 4, label: 'Hafen' }],
      sceneOptions: () => [],
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: WorldStore, useValue: world },
        { provide: SessionStore, useValue: session },
        { provide: CharacterService, useValue: { get: () => of({ id: 9, description: 'Narbe am Kinn' }) } },
      ],
    });
    fixture = TestBed.createComponent(RoundChanges);
    fixture.componentRef.setInput('entry', entry);
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  const labels = () => [...host.querySelectorAll('label')].map((label) => label.textContent?.trim());
  /** The field under a label. */
  const field = (label: string) => {
    const id = [...host.querySelectorAll('label')].find((found) => found.textContent?.trim() === label)?.getAttribute('for');
    return host.querySelector<HTMLInputElement>(`[id="${id}"]`)!;
  };
  const reset = () => [...host.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Zurücksetzen')!;

  async function leave(label: string, value: string): Promise<void> {
    const input = field(label);
    input.value = value;
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  it('offers the texts of the kind, filled with what counts in the round', async () => {
    await open({ kind: 'events', id: 5 }, { name: 'Der große Sturm' });
    expect(labels()).toEqual(['Name', 'Beschreibung', 'Auslöser', 'Was passiert']);
    expect(field('Name').value).toBe('Der große Sturm');
    expect(field('Was passiert').value).toBe('Die Boote reißen sich los.');
    expect(host.textContent).toContain('In der Welt: Sturm');
  });

  it('saves a text when it is left and keeps the other changes', async () => {
    await open({ kind: 'locations', id: 4 }, { name: 'Alter Hafen' });
    await leave('Beschreibung', 'Alles steht unter Wasser.');
    expect(session.setChanges).toHaveBeenCalledWith('location', 4, { name: 'Alter Hafen', description: 'Alles steht unter Wasser.' });
  });

  it('takes a change away when its field is emptied, and shows the text of the world again', async () => {
    await open({ kind: 'locations', id: 4 }, { name: 'Alter Hafen' });
    await leave('Name', '');
    expect(session.setChanges).toHaveBeenCalledWith('location', 4, {});
    expect(field('Name').value).toBe('Hafen');
  });

  it('sends nothing when a text equals the world', async () => {
    await open({ kind: 'locations', id: 4 });
    await leave('Name', 'Hafen');
    await leave('Beschreibung', '');
    expect(session.setChanges).not.toHaveBeenCalled();
    expect(field('Beschreibung').value).toBe('Es riecht nach Fisch.');
  });

  it('brings everything back with "Zurücksetzen", which waits until something is changed', async () => {
    await open({ kind: 'locations', id: 4 });
    expect(reset().disabled).toBe(true);
    await leave('Name', 'Alter Hafen');
    expect(reset().disabled).toBe(false);
    reset().click();
    await fixture.whenStable();
    expect(session.setChanges).toHaveBeenLastCalledWith('location', 4, {});
  });

  it('keeps the links of a quest beside its texts', async () => {
    await open({ kind: 'quests', id: 7 });
    expect(labels()).toEqual(['Name', 'Beschreibung', 'Ziel', 'Questgeber', 'Startgebiet', 'Entsteht in Szene']);
    expect(field('Ziel').value).toBe('Finde den Händler');
  });

  it('reads the description of a character from the character itself', async () => {
    await open({ kind: 'npcs', id: 9 });
    expect(field('Beschreibung').value).toBe('Narbe am Kinn');
    await leave('Beschreibung', 'Trägt eine Augenklappe.');
    expect(session.setChanges).toHaveBeenCalledWith('npc', 9, { description: 'Trägt eine Augenklappe.' });
  });
});
