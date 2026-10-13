import { Directive, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { map } from 'rxjs';

import { readError } from '../../core/api-error';
import { EntryKind, WorldNpc } from '../../core/models';
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
  /** Create a character of the world from a typed name, for a line of a dialogue. */
  protected readonly newSpeaker = (name: string) => this.store.add<WorldNpc>('world-npcs', { name }).pipe(map((link) => link.npc));

  /** Change one field of the draft. */
  protected set<K extends keyof T>(key: K, value: T[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  /** Change a number field; empty or negative input counts as 0. */
  protected setNumber<K extends keyof T>(key: K, value: number | null): void {
    this.set(key, Math.max(0, Math.floor(value ?? 0)) as T[K]);
  }

  /**
   * Look a linked entry up in the window at the side. Not while this form itself is open there
   * with unsaved changes, because the window would leave it.
   */
  protected lookUp(kind: EntryKind, id: number): void {
    const shown = this.store.peek();
    const openHere = shown?.kind === this.kind && shown.id === this.entry().id;
    if (!openHere || !this.dirty()) {
      this.store.peek.set({ kind, id });
    }
  }

  /**
   * Create an entry with the typed name in another list of the world and link it in the draft:
   * added to a list of links, or set as the one linked entry. Saving the form saves the link.
   */
  protected createLinked<K extends keyof T>(key: K, kind: Exclude<Kind, 'scenes'>, name: string): void {
    this.store.add<{ id: number; npc?: number }>(kind, { name }).subscribe({
      next: (created) => this.link(key, created.npc ?? created.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
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

  private link<K extends keyof T>(key: K, id: number): void {
    const linked = this.draft()[key];
    this.set(key, (Array.isArray(linked) ? [...linked, id] : id) as T[K]);
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
