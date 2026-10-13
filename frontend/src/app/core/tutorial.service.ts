import { Injectable, computed, signal } from '@angular/core';

import { TUTORIALS } from '../shared/tutorial-content';

const SEEN_KEY = 'pnp.tutorial.seen';
const FIRST_TUTORIAL = 'start';
/** How many places the way back remembers. */
const TRAIL_LENGTH = 10;

/** A place in the tutorials: which one and which step. */
interface Place {
  id: string;
  step: number;
}

/** Which tutorial is open and which of its steps is shown, and where the user came from. */
@Injectable({ providedIn: 'root' })
export class TutorialService {
  readonly tutorials = TUTORIALS;
  private readonly openId = signal<string | null>(null);
  readonly step = signal(0);
  readonly current = computed(() => TUTORIALS.find((tutorial) => tutorial.id === this.openId()) ?? null);
  /** The places the user came from by jumping to another tutorial, the last one at the end. */
  private readonly trail = signal<Place[]>([]);
  /** The tutorial the way back leads to, or null when there is none. */
  readonly previous = computed(() => {
    const place = this.trail().at(-1);
    return place ? (TUTORIALS.find((tutorial) => tutorial.id === place.id) ?? null) : null;
  });

  /**
   * Open a tutorial at a step: a number, or the name of a step like "leveling". An unknown topic opens the
   * general one. When another tutorial is open, the place the user leaves is kept for the way back.
   */
  open(id: string, step: number | string = 0): void {
    const known = TUTORIALS.some((tutorial) => tutorial.id === id) ? id : FIRST_TUTORIAL;
    const here = this.current();
    if (here && (here.id !== known || this.step() !== this.numberOf(known, step))) {
      this.trail.update((trail) => [...trail, { id: here.id, step: this.step() }].slice(-TRAIL_LENGTH));
    }
    this.show(known, step);
  }

  /** Go back to the place the user came from. */
  returnToPrevious(): void {
    const place = this.trail().at(-1);
    if (place) {
      this.trail.update((trail) => trail.slice(0, -1));
      this.show(place.id, place.step);
    }
  }

  /** Show the general tutorial once, the first time the app is used on this device. */
  openOnFirstVisit(first = FIRST_TUTORIAL): void {
    if (!localStorage.getItem(SEEN_KEY)) {
      this.open(first);
    }
  }

  /** Jump to one step of the open tutorial. */
  goTo(step: number): void {
    const last = (this.current()?.steps.length ?? 1) - 1;
    this.step.set(Math.min(Math.max(step, 0), last));
  }

  /** Go one step on; after the last step the window closes. */
  next(): void {
    const last = (this.current()?.steps.length ?? 1) - 1;
    if (this.step() >= last) {
      this.close();
    } else {
      this.step.update((step) => step + 1);
    }
  }

  /** Go one step back. */
  back(): void {
    this.goTo(this.step() - 1);
  }

  /** Close the window and remember that the user has seen a tutorial. */
  close(): void {
    localStorage.setItem(SEEN_KEY, '1');
    this.openId.set(null);
    this.trail.set([]);
  }

  private show(id: string, step: number | string): void {
    this.openId.set(id);
    this.step.set(0);
    this.goTo(this.numberOf(id, step));
  }

  /** The number of a step: a number is taken as it is, a name is looked up in the tutorial. */
  private numberOf(id: string, step: number | string): number {
    if (typeof step === 'number') {
      return step;
    }
    return Math.max(0, TUTORIALS.find((tutorial) => tutorial.id === id)?.steps.findIndex((other) => other.id === step) ?? 0);
  }
}
