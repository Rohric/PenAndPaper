import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * The open windows in the order they were opened, so a key like Escape only reaches the one on top.
 * A window that covers the page (popup, dialog) also stops the page behind it from scrolling.
 */
@Injectable({ providedIn: 'root' })
export class WindowStack {
  private readonly open = signal<object[]>([]);
  private covering = 0;

  /** Report a window while it is open. Call it in the constructor of its head. */
  enter(window: object): void {
    this.open.update((all) => [...all, window]);
    inject(DestroyRef).onDestroy(() => this.open.update((all) => all.filter((other) => other !== window)));
  }

  /** Whether a window is the one on top. */
  isTop(window: object): boolean {
    return this.open().at(-1) === window;
  }

  /** Keep the page from scrolling while the calling window lives. Call it in the constructor of the window. */
  cover(): void {
    this.setCovering(1);
    inject(DestroyRef).onDestroy(() => this.setCovering(-1));
  }

  private setCovering(change: number): void {
    this.covering += change;
    document.body.style.overflow = this.covering > 0 ? 'hidden' : '';
  }
}
