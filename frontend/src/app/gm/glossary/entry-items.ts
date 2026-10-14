import { Component, computed, inject, input } from '@angular/core';

import { readError } from '../../core/api-error';
import { Trivia } from '../../core/models';
import { LinkPicker } from '../../components/form/link-picker';
import { isItem } from '../../components/entry/entry-views';
import { WorldStore } from '../../core/world-store';
import { ToastService } from '../../global/toast/toast.service';
import { ITEM_CATEGORY } from './glossary-tiles';

/**
 * The items that belong to a place, a character or a quest. An item is a knowledge entry of the
 * category "Gegenstand". The link is stored at the item, so every change here is saved right away.
 */
@Component({
  selector: 'app-entry-items',
  imports: [LinkPicker],
  template: `
    <app-link-picker
      label="Gegenstände"
      emptyText="Gegenstand suchen oder neu anlegen …"
      [creatable]="true"
      [options]="options()"
      [selected]="selected()"
      (selectedChange)="change($event)"
      (create)="createNew($event)"
      (look)="store.look({ kind: 'trivia', id: $event })"
    />
  `,
})
export class EntryItems {
  protected readonly store = inject(WorldStore);
  private readonly toast = inject(ToastService);

  /** What the items are attached to; a character is named by the id of the character. */
  readonly kind = input.required<'locations' | 'npcs' | 'quests'>();
  readonly entryId = input.required<number>();

  private readonly items = computed(() => this.store.trivia().filter(isItem));
  protected readonly options = computed(() => {
    const ids = new Set(this.items().map((item) => item.id));
    return this.store.triviaOptions().filter((option) => ids.has(option.id));
  });
  protected readonly selected = computed(() =>
    this.items()
      .filter((item) => item[this.kind()].includes(this.entryId()))
      .map((item) => item.id),
  );

  /** Save every item that was attached or taken off. */
  protected change(ids: number[]): void {
    const before = this.selected();
    this.items()
      .filter((item) => ids.includes(item.id) !== before.includes(item.id))
      .forEach((item) => this.save(item, ids.includes(item.id)));
  }

  /** Create a new item with the typed name, attached to this entry right away. */
  protected createNew(name: string): void {
    const body = { name, category: ITEM_CATEGORY, [this.kind()]: [this.entryId()] };
    this.store.add<Trivia>('trivia', body).subscribe({
      error: (e: unknown) => this.toast.show(readError(e), 'danger'),
    });
  }

  private save(item: Trivia, attach: boolean): void {
    const id = this.entryId();
    const linked = attach ? [...item[this.kind()], id] : item[this.kind()].filter((other) => other !== id);
    this.store.save('trivia', item.id, { [this.kind()]: linked }).subscribe({
      error: (e: unknown) => this.toast.show(readError(e), 'danger'),
    });
  }
}
