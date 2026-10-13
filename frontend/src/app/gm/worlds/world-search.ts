import { Component, computed, inject, viewChild } from '@angular/core';

import { EntryKind, Option, isItem } from '../../core/models';
import { LinkPicker } from '../../shared/link-picker';
import { KIND_LABELS, allText } from './entry-views';
import { WorldStore } from './world-store';

const KINDS: EntryKind[] = ['locations', 'npcs', 'quests', 'events', 'trivia'];
// Ids repeat between the kinds, so an option carries its kind in the millions of its id.
const SPAN = 1_000_000;

/**
 * Search the whole world by typing: names and texts of places, characters, quests, events and
 * knowledge. The chosen entry opens in the window at the side.
 */
@Component({
  selector: 'app-world-search',
  imports: [LinkPicker],
  template: `
    <app-link-picker
      single
      label="In der ganzen Welt suchen"
      emptyText="Welt durchsuchen …"
      [chips]="false"
      [options]="options()"
      (valueChange)="open($event)"
    />
  `,
  styles: `
    :host {
      display: block;
      width: 320px;
    }
  `,
})
export class WorldSearch {
  private readonly store = inject(WorldStore);
  private readonly picker = viewChild(LinkPicker);

  protected readonly options = computed<Option[]>(() => [
    ...this.store.locations().map((place) => this.option('locations', place.id, place.name, allText(place))),
    ...this.store.npcs().map((link) => this.option('npcs', link.npc, link.name, link.profession)),
    ...this.store.quests().map((quest) => this.option('quests', quest.id, quest.name, `${quest.goal} ${allText(quest)}`)),
    ...this.store.events().map((event) => this.option('events', event.id, event.name, allText(event))),
    ...this.store.trivia().map((trivia) => ({
      ...this.option('trivia', trivia.id, trivia.name, `${trivia.category} ${allText(trivia)}`),
      tone: isItem(trivia) ? 'items' : 'trivia',
    })),
  ]);

  /** Put the cursor into the search field. */
  focus(): void {
    this.picker()?.focus();
  }

  /** Look the chosen entry up at the side. */
  protected open(value: number | null): void {
    if (value !== null) {
      this.store.peek.set({ kind: KINDS[Math.floor(value / SPAN)], id: value % SPAN });
    }
  }

  private option(kind: EntryKind, id: number, label: string, text: string): Option {
    return { id: KINDS.indexOf(kind) * SPAN + id, label, hint: `${KIND_LABELS[kind]} · ${text}`.trim(), tone: kind };
  }
}
