import { Injectable, signal } from '@angular/core';

const PREFIX = 'pnp.folds.';

/** The folded parts this device remembers for a scope; nothing when the storage is missing or broken. */
export function savedFolds(scope: string): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(PREFIX + scope) ?? '[]');
    return Array.isArray(saved) ? saved.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
}

/** Remember the folded parts of a scope on this device. */
export function rememberFolds(scope: string, keys: string[]): void {
  try {
    localStorage.setItem(PREFIX + scope, JSON.stringify(keys));
  } catch {
    // What is folded is only a convenience; without storage everything simply starts open next time.
  }
}

/** One foldable part that is on the screen right now. */
interface Shown {
  scope: string;
  key: string;
}

/**
 * Which parts of the pages are folded shut: the groups of a wall, the sections of a reading view. A scope is one
 * world, and the device remembers every scope. The parts on the screen report themselves, so "Alle zu" and
 * "Alle auf" reach all of them.
 */
@Injectable({ providedIn: 'root' })
export class Folds {
  /** Counts the changes; everything that asks whether a part is shut asks again after one. */
  private readonly changes = signal(0);
  private readonly shut = new Map<string, Set<string>>();
  private readonly onScreen = signal<Shown[]>([]);

  /** Whether a part of a scope is folded shut. */
  isShut(scope: string, key: string): boolean {
    this.changes();
    return this.of(scope).has(key);
  }

  /** Fold a part shut, or open when it is shut. */
  toggle(scope: string, key: string): void {
    this.set(scope, [key], !this.isShut(scope, key));
  }

  /** Fold some parts of a scope shut or open, and remember it. */
  set(scope: string, keys: string[], shut: boolean): void {
    const folded = this.of(scope);
    keys.forEach((key) => (shut ? folded.add(key) : folded.delete(key)));
    rememberFolds(scope, [...folded]);
    this.changes.update((count) => count + 1);
  }

  /** Report a part that is on the screen now; the function that comes back takes it back. */
  show(scope: string, key: string): () => void {
    const part: Shown = { scope, key };
    this.onScreen.update((all) => [...all, part]);
    return () => this.onScreen.update((all) => all.filter((other) => other !== part));
  }

  /** The keys of the parts of a scope that are on the screen, each once. */
  shown(scope: string): string[] {
    return [...new Set(this.onScreen().filter((part) => part.scope === scope).map((part) => part.key))];
  }

  private of(scope: string): Set<string> {
    let folded = this.shut.get(scope);
    if (!folded) {
      folded = new Set(savedFolds(scope));
      this.shut.set(scope, folded);
    }
    return folded;
  }
}
