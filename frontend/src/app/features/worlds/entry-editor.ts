import { Directive, computed, inject, input, linkedSignal, output, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { Kind, WorldStore } from './world-store';

/**
 * What every editor of a world entry shares: a draft of the entry, saving and deleting.
 * A concrete editor only names its list and adds its template.
 */
@Directive()
export abstract class EntryEditor<T extends { id: number }> {
  protected readonly store = inject(WorldStore);
  protected abstract readonly kind: Kind;

  readonly entry = input.required<T>();
  /** Fired after the entry was saved. */
  readonly saved = output<void>();
  /** Fired after the entry was deleted. */
  readonly closed = output<void>();

  /** Working copy; it starts over when another entry is opened or the saved one comes back. */
  protected readonly draft = linkedSignal(() => structuredClone(this.entry()));
  protected readonly dirty = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(this.entry()));
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  /** Change one field of the draft. */
  protected set<K extends keyof T>(key: K, value: T[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  /** Change a number field; empty or negative input counts as 0. */
  protected setNumber<K extends keyof T>(key: K, value: number | null): void {
    this.set(key, Math.max(0, Math.floor(value ?? 0)) as T[K]);
  }

  /** Send the draft to the server. */
  protected save(): void {
    this.busy.set(true);
    this.store.save<T>(this.kind, this.entry().id, this.draft()).subscribe({
      next: () => this.done(),
      error: (e: unknown) => this.finish(readError(e)),
    });
  }

  /** Delete the entry after the user confirmed. */
  protected remove(name: string): void {
    if (!confirm(`„${name}“ wirklich löschen?`)) {
      return;
    }
    this.store.remove(this.kind, this.entry().id).subscribe({
      next: () => this.closed.emit(),
      error: (e: unknown) => this.finish(readError(e)),
    });
  }

  private done(): void {
    this.finish('');
    this.saved.emit();
  }

  private finish(error: string): void {
    this.busy.set(false);
    this.error.set(error);
  }
}
