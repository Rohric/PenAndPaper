import { Component, computed, inject, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { readError } from '../../core/api-error';
import { EditorBar } from '../../components/form/editor-bar';
import { WorldStore } from '../../core/world-store';
import { ToastService } from '../../global/toast/toast.service';

/** Edit the world itself: its name, the name of its second bar and its lore. Strg + Enter saves. */
@Component({
  selector: 'app-lore-editor',
  imports: [FormsModule, EditorBar],
  host: { '(keydown.control.enter)': 'saveByKey($event)', '(keydown.meta.enter)': 'saveByKey($event)' },
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
      <app-editor-bar [dirty]="dirty()" [busy]="busy()" (save)="save()" (remove)="remove()" />
    </div>
    <div class="panel">
      <div class="field">
        <label for="world-lore">Lore</label>
        <textarea id="world-lore" class="input" rows="16" [ngModel]="draft().lore" (ngModelChange)="set('lore', $event)"></textarea>
      </div>
    </div>
  `,
  styleUrl: './lore-editor.scss',
})
export class LoreEditor {
  private readonly store = inject(WorldStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

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

  /** Change one field of the draft. */
  protected set(key: 'name' | 'second_bar_name' | 'lore', value: string): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  /** Save the world; the second bar is saved without spaces around it. */
  protected save(): void {
    this.busy.set(true);
    this.store.saveWorld({ ...this.draft(), second_bar_name: this.draft().second_bar_name.trim() }).subscribe({
      next: () => this.done(),
      error: (e: unknown) => this.fail(e),
    });
  }

  /** Strg + Enter anywhere in the form saves, when there is something to save. */
  protected saveByKey(event: Event): void {
    event.preventDefault();
    if (this.dirty() && !this.busy()) {
      this.save();
    }
  }

  /** Delete the whole world after the user confirmed. */
  protected remove(): void {
    if (!confirm(`Die Welt „${this.store.world()?.name}“ mit allen Orten, Figuren und Kapiteln wirklich löschen?`)) {
      return;
    }
    this.store.removeWorld().subscribe({
      next: () => void this.router.navigateByUrl('/gm/worlds'),
      error: (e: unknown) => this.fail(e),
    });
  }

  private done(): void {
    this.busy.set(false);
    this.toast.show('Gespeichert', 'ok');
    this.saved.emit();
  }

  private fail(error: unknown): void {
    this.busy.set(false);
    this.toast.show(readError(error), 'danger');
  }
}
