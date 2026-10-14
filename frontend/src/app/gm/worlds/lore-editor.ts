import { Component, computed, inject, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { readError } from '../../core/api-error';
import { EditorBar } from '../../components/form/editor-bar';
import { WorldStore } from '../../core/world-store';

/** Edit the world itself: its name, the name of its second bar and its lore. */
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
        <label for="world-second-bar">Zweite Leiste (freiwillig)</label>
        <span class="soft">Zum Beispiel Willen oder Geistige Gesundheit. Leer lassen, wenn die Welt keine hat. Jeder Charakter in Runden dieser Welt hat sie dann neben dem Leben.</span>
        <input id="world-second-bar" class="input" maxlength="60" [ngModel]="draft().second_bar_name" (ngModelChange)="set('second_bar_name', $event)" />
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

  /** Fired after name and lore were saved. */
  readonly saved = output<void>();

  protected readonly draft = linkedSignal(() => {
    const world = this.store.world();
    return { name: world?.name ?? '', second_bar_name: world?.second_bar_name ?? '', lore: world?.lore ?? '' };
  });
  protected readonly dirty = computed(() => {
    const world = this.store.world();
    const draft = this.draft();
    return draft.name !== world?.name || draft.lore !== world?.lore || draft.second_bar_name !== world?.second_bar_name;
  });
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  /** Change one field of the draft. */
  protected set(key: 'name' | 'second_bar_name' | 'lore', value: string): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  /** Save the world; the second bar is saved without spaces around it. */
  protected save(): void {
    this.busy.set(true);
    this.store.saveWorld({ ...this.draft(), second_bar_name: this.draft().second_bar_name.trim() }).subscribe({ next: () => this.done(), error: (e: unknown) => this.finish(readError(e)) });
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

  private done(): void {
    this.finish('');
    this.saved.emit();
  }

  private finish(error: string): void {
    this.busy.set(false);
    this.error.set(error);
  }
}
