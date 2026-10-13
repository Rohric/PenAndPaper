import { DestroyRef, Signal, computed, inject, signal } from '@angular/core';

/**
 * A list in the frame that the parts of the page fill while they are on the screen, like the tabs on the
 * left or the symbols of the bar. What a part reports is taken back by itself when the part leaves.
 */
export class Slot<T> {
  private readonly sources = signal<Signal<T[]>[]>([]);
  /** Everything that is reported right now, in the order it was reported. */
  readonly items = computed(() => this.sources().flatMap((source) => source()));

  /** Report items. Call it in the constructor of a component; they are gone when the component is destroyed. */
  provide(items: Signal<T[]>): void {
    this.sources.update((all) => [...all, items]);
    inject(DestroyRef).onDestroy(() => this.sources.update((all) => all.filter((other) => other !== items)));
  }
}
