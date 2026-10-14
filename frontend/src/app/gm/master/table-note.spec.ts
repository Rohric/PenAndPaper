import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Note } from '../../core/session-models';
import { TableNote } from './table-note';

const NOTE = { id: 5, title: 'Neue Notiz', text: '', table_group: 'Kampf', mine: true } as unknown as Note;

describe('TableNote', () => {
  let fixture: ComponentFixture<TableNote>;
  let host: HTMLElement;
  let saved: Pick<Note, 'title' | 'text'>[];

  async function open(fresh = false): Promise<void> {
    fixture = TestBed.createComponent(TableNote);
    fixture.componentRef.setInput('note', NOTE);
    fixture.componentRef.setInput('fresh', fresh);
    saved = [];
    fixture.componentInstance.save.subscribe((changes) => saved.push(changes));
    host = fixture.nativeElement as HTMLElement;
    document.body.appendChild(host);
    await fixture.whenStable();
    // The timers of saving are only faked once the note stands, so waiting for it does not wait for them.
    vi.useFakeTimers();
  }

  const title = () => host.querySelector<HTMLInputElement>('input')!;
  const text = () => host.querySelector<HTMLTextAreaElement>('textarea')!;

  function type(field: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.useRealTimers();
    host?.remove();
  });

  it('shows name and description of the note in place', async () => {
    await open();
    expect(title().value).toBe('Neue Notiz');
    expect(text().value).toBe('');
  });

  it('saves itself a moment after typing', async () => {
    await open();
    type(title(), 'Der Wirt');
    type(text(), 'Er lügt.');
    expect(saved).toEqual([]);
    vi.advanceTimersByTime(800);
    expect(saved).toEqual([{ title: 'Der Wirt', text: 'Er lügt.' }]);
  });

  it('saves at once when a field is left, and not a second time afterwards', async () => {
    await open();
    type(title(), 'Der Wirt');
    title().dispatchEvent(new Event('change'));
    expect(saved).toEqual([{ title: 'Der Wirt', text: '' }]);
    vi.advanceTimersByTime(800);
    expect(saved.length).toBe(1);
  });

  it('never saves a note without a name', async () => {
    await open();
    type(title(), '   ');
    title().dispatchEvent(new Event('change'));
    vi.advanceTimersByTime(800);
    expect(saved).toEqual([]);
  });

  it('puts the cursor into the name of a note that was just laid, marked to be typed over', async () => {
    await open(true);
    expect(document.activeElement).toBe(title());
    expect([title().selectionStart, title().selectionEnd]).toEqual([0, 'Neue Notiz'.length]);
  });
});
