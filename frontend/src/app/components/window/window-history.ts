import { computed, signal } from '@angular/core';

/** What a window showed one after the other, with a way back and forward again like in a browser. */
export class WindowHistory<T> {
  private readonly items = signal<T[]>([]);
  private readonly index = signal(-1);

  readonly current = computed<T | null>(() => this.items()[this.index()] ?? null);
  readonly canBack = computed(() => this.index() > 0);
  readonly canForward = computed(() => this.index() < this.items().length - 1);

  constructor(private readonly same: (a: T, b: T) => boolean) {}

  /** Show something new: what lay ahead is dropped. Showing what is shown already changes nothing. */
  open(item: T): void {
    const current = this.current();
    if (current && this.same(current, item)) {
      return;
    }
    this.items.update((items) => [...items.slice(0, this.index() + 1), item]);
    this.index.update((index) => index + 1);
  }

  /** Go one step back and return what is shown now. */
  back(): T | null {
    if (this.canBack()) {
      this.index.update((index) => index - 1);
    }
    return this.current();
  }

  /** Go one step forward again and return what is shown now. */
  forward(): T | null {
    if (this.canForward()) {
      this.index.update((index) => index + 1);
    }
    return this.current();
  }

  /** Forget everything, when the window closes. */
  clear(): void {
    this.items.set([]);
    this.index.set(-1);
  }
}
