import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerCharacter } from '../../core/models';
import { SessionStore } from '../../core/session-store';
import { ToastService } from '../../global/toast/toast.service';
import { LevelUpForm } from './level-up-form';

/** A character with one skill of 60 points in Handeln, which gives one inspiration point. */
function character(id: number, used: PlayerCharacter['inspiration_used'] = {}): PlayerCharacter {
  return {
    id, name: `Held ${id}`, player: `spieler${id}`, bonus_points_total: 0, inspiration_used: used,
    skills: [{ id: 1, name: 'Klettern', talent: 'action', points: 60, bonus_points: 0, description: '' }],
  } as unknown as PlayerCharacter;
}

describe('LevelUpForm', () => {
  let store: { characters: WritableSignal<PlayerCharacter[]>; level: Mock; refillInspiration: Mock };
  let toast: { show: Mock };
  let fixture: ComponentFixture<LevelUpForm>;
  let host: HTMLElement;

  beforeEach(async () => {
    store = {
      characters: signal([character(1), character(2, { action: 1 })]),
      level: vi.fn((_points: Record<number, number>, done: () => void) => done()),
      refillInspiration: vi.fn((_ids: number[], done: () => void) => done()),
    };
    toast = { show: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionStore, useValue: store },
        { provide: ToastService, useValue: toast },
      ],
    });
    fixture = TestBed.createComponent(LevelUpForm);
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  /** Click a button by its text; with several of the same text, the one at the index. */
  async function click(text: string, index = 0): Promise<void> {
    const found = [...host.querySelectorAll('button')].filter((button) => button.textContent?.trim() === text);
    found[index].click();
    await fixture.whenStable();
  }

  function button(text: string, index = 0): HTMLButtonElement {
    return [...host.querySelectorAll('button')].filter((found) => found.textContent?.trim() === text)[index];
  }

  function values(): string[] {
    return [...host.querySelectorAll<HTMLInputElement>('input[type=number]')].map((input) => input.value);
  }

  it('starts with every field at 0 and nothing to give', () => {
    expect(values()).toEqual(['0', '0']);
    expect(button('Bonuspunkte geben').disabled).toBe(true);
  });

  it('adds 10 to every field with "Allen +10" and gives only what is more than 0', async () => {
    await click('+', 0);
    await click('Allen +10');
    expect(values()).toEqual(['11', '10']);
    await click('Bonuspunkte geben');
    expect(store.level).toHaveBeenCalledWith({ 1: 11, 2: 10 }, expect.any(Function));
  });

  it('gives a single character its points and starts over at 0 afterwards', async () => {
    await click('+', 0);
    await click('+', 0);
    await click('Bonuspunkte geben');
    expect(store.level).toHaveBeenCalledWith({ 1: 2 }, expect.any(Function));
    expect(toast.show).toHaveBeenCalledWith('Bonuspunkte gegeben: Held 1 +2', 'reward');
    expect(values()).toEqual(['0', '0']);
  });

  it('fills up the inspiration of one character or the whole group, but not of someone who spent nothing', async () => {
    expect(button('Auffüllen', 0).disabled).toBe(true);
    expect(button('Auffüllen', 1).disabled).toBe(false);
    await click('Auffüllen', 1);
    expect(store.refillInspiration).toHaveBeenCalledWith([2], expect.any(Function));
    expect(toast.show).toHaveBeenCalledWith('Geistesblitz aufgefüllt: Held 2', 'reward');
    await click('Ganze Gruppe auffüllen');
    expect(store.refillInspiration).toHaveBeenCalledWith([], expect.any(Function));
    expect(toast.show).toHaveBeenCalledWith('Geistesblitz aufgefüllt: ganze Gruppe', 'reward');
  });
});
