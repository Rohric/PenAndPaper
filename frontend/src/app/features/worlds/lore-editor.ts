import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { readError } from '../../core/api-error';
import { EditorBar } from '../../shared/editor-bar';
import { WorldStore } from './world-store';

/** Edit the world itself: its name and its lore. */
@Component({
  selector: 'app-lore-editor',
  imports: [FormsModule, EditorBar],
  template: `
    <div class="panel">
      <div class="field">
        <label for="world-name">Name der Welt</label>
        <input id="world-name" class="input input--title" [ngModel]="draft().name" (ngModelChange)="set('name', $event)" />
      </div>
      <div class="field">
        <label for="world-lore">Lore</label>
        <textarea id="world-lore" class="input" rows="16" [ngModel]="draft().lore" (ngModelChange)="set('lore', $event)"></textarea>
      </div>
      <app-editor-bar [dirty]="dirty()" [busy]="busy()" [error]="error()" (save)="save()" (remove)="remove()" />
    </div>
  `,
})
export class LoreEditor {
  private readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  protected readonly draft = linkedSignal(() => ({ name: this.store.world()?.name ?? '', lore: this.store.world()?.lore ?? '' }));
  protected readonly dirty = computed(() => {
    const world = this.store.world();
    return this.draft().name !== world?.name || this.draft().lore !== world?.lore;
  });
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  /** Change name or lore in the draft. */
  protected set(key: 'name' | 'lore', value: string): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  /** Save name and lore. */
  protected save(): void {
    this.busy.set(true);
    this.store.saveWorld(this.draft()).subscribe({ next: () => this.finish(''), error: (e: unknown) => this.finish(readError(e)) });
  }

  /** Delete the whole world after the user confirmed. */
  protected remove(): void {
    if (!confirm(`Die Welt „${this.store.world()?.name}“ mit allen Orten, Figuren und Kapiteln wirklich löschen?`)) {
      return;
    }
    this.store.removeWorld().subscribe({
      next: () => void this.router.navigateByUrl('/gm/worlds'),
      error: (e: unknown) => this.finish(readError(e)),
    });
  }

  private finish(error: string): void {
    this.busy.set(false);
    this.error.set(error);
  }
}
