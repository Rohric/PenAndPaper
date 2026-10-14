import { DestroyRef, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** How often a session asks for news, and how often while a battle runs, in milliseconds. */
export const ROUND_MS = 3000;
export const BATTLE_MS = 1500;
/** The longest wait after errors, in milliseconds. */
export const MAX_WAIT_MS = 30000;

/**
 * Loads something again and again while a page is open, by the rules in design/grundlagen/schnelligkeit.md:
 * one request at a time, never while the screen is hidden, at once when it shows again or when the page
 * asks for it, and slower after errors until the first success.
 */
export class Poller {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private again = false;
  private stopped = false;
  private failures = 0;

  constructor(
    private readonly load: () => Observable<unknown>,
    private readonly every: () => number,
    private readonly hidden: () => boolean = () => document.hidden,
  ) {}

  /**
   * Start; it stops when the owner is destroyed. Call it in an injection context, or hand the DestroyRef in.
   * Without "immediately" the first load waits for now() or the first tick.
   */
  start(immediately = true, destroyRef: DestroyRef = inject(DestroyRef)): void {
    const onShow = () => {
      if (!this.hidden()) {
        this.now();
      }
    };
    document.addEventListener('visibilitychange', onShow);
    destroyRef.onDestroy(() => {
      this.stop();
      document.removeEventListener('visibilitychange', onShow);
    });
    if (immediately) {
      this.now();
    } else {
      this.schedule();
    }
  }

  /** Load at once, for example after an own action; while a request runs, once more right after it. */
  now(): void {
    if (this.stopped) {
      return;
    }
    if (this.running) {
      this.again = true;
      return;
    }
    this.tick();
  }

  /** Stop for good. */
  stop(): void {
    this.stopped = true;
    this.clear();
  }

  private tick(): void {
    this.clear();
    if (this.hidden()) {
      this.schedule();
      return;
    }
    this.running = true;
    this.load().subscribe({ error: () => this.done(false), complete: () => this.done(true) });
  }

  private done(ok: boolean): void {
    this.running = false;
    this.failures = ok ? 0 : this.failures + 1;
    if (this.again && !this.stopped) {
      this.again = false;
      this.tick();
      return;
    }
    this.schedule();
  }

  /** Wait for the next tick: the usual time, doubled after every error up to the longest wait. */
  private schedule(): void {
    this.clear();
    if (this.stopped) {
      return;
    }
    const wait = Math.min(MAX_WAIT_MS, this.every() * 2 ** this.failures);
    this.timer = setTimeout(() => this.tick(), wait);
  }

  private clear(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
