import { Injectable, computed, signal } from '@angular/core';

import { TUTORIALS } from '../shared/tutorial-content';

const SEEN_KEY = 'pnp.tutorial.seen';
const FIRST_TUTORIAL = 'start';

/** Which tutorial is open and which of its steps is shown. */
@Injectable({ providedIn: 'root' })
export class TutorialService {
  readonly tutorials = TUTORIALS;
  private readonly openId = signal<string | null>(null);
  readonly step = signal(0);
  readonly current = computed(() => TUTORIALS.find((tutorial) => tutorial.id === this.openId()) ?? null);

  /** Open a tutorial at its first step; an unknown topic opens the general one. */
  open(id: string): void {
    this.openId.set(TUTORIALS.some((tutorial) => tutorial.id === id) ? id : FIRST_TUTORIAL);
    this.step.set(0);
  }

  /** Show the general tutorial once, the first time the app is used on this device. */
  openOnFirstVisit(): void {
    if (!localStorage.getItem(SEEN_KEY)) {
      this.open(FIRST_TUTORIAL);
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
  }
}
