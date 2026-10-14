import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

import { readError } from '../../core/api-error';
import { EntryRef } from '../../core/models';
import { Facet } from '../../core/wall';
import { Kind, WorldStore } from '../../core/world-store';
import { IconName } from '../../components/basic/icon';
import { EntryWall } from '../../components/entry/entry-wall';
import { isItem } from '../../components/entry/entry-views';
import {
  ONE_GROUP, QUEST_KIND_FACET, WallTile, categoryFacet, chapterFacet, entryTile, eventTiles, knowledgeTiles, npcTiles, placeFacet, placeTiles,
  questTiles,
} from '../../components/entry/wall-tiles';
import { NameDialog } from '../../components/form/name-dialog';
import { ToastService } from '../../global/toast/toast.service';
import { Tool, Tools } from '../../global/tool-bar/tools.service';
import { Carrier, ItemRow, itemRows } from './item-rows';

export type SectionId = 'locations' | 'npcs' | 'quests' | 'events' | 'items' | 'trivia';

/** One part of the glossary: what it is called, its symbol and the list of the world behind it. */
export interface GlossarySection {
  id: SectionId;
  label: string;
  /** One entry of the part, like "Ort". */
  one: string;
  icon: IconName;
  /** The list new entries are created in; items are knowledge entries of the category "Gegenstand". */
  kind: Exclude<Kind, 'chapters' | 'scenes'>;
  newLabel: string;
  empty: string;
}

export const GLOSSARY_SECTIONS: GlossarySection[] = [
  { id: 'locations', label: 'Orte', one: 'Ort', icon: 'pin', kind: 'locations', newLabel: 'Neuer Ort', empty: 'Noch kein Ort.' },
  { id: 'npcs', label: 'Figuren', one: 'Figur', icon: 'sheet', kind: 'world-npcs', newLabel: 'Neue Figur', empty: 'Noch keine Figur.' },
  { id: 'quests', label: 'Quests', one: 'Quest', icon: 'quest', kind: 'quests', newLabel: 'Neue Quest', empty: 'Noch keine Quest.' },
  { id: 'events', label: 'Ereignisse', one: 'Ereignis', icon: 'flag', kind: 'events', newLabel: 'Neues Ereignis', empty: 'Noch kein Ereignis.' },
  { id: 'items', label: 'Gegenstände', one: 'Gegenstand', icon: 'gift', kind: 'trivia', newLabel: 'Neuer Gegenstand', empty: 'Noch kein Gegenstand.' },
  { id: 'trivia', label: 'Wissen', one: 'Wissen', icon: 'note', kind: 'trivia', newLabel: 'Neuer Eintrag im Wissen', empty: 'Noch kein Wissen.' },
];

/** The category that makes a knowledge entry an item. */
export const ITEM_CATEGORY = 'Gegenstand';
const NOBODY = 'none';

/** Create an entry of a part of the glossary from its name; an item gets the category that makes it an item. */
export function createEntry(store: WorldStore, section: GlossarySection, name: string): Observable<EntryRef> {
  const body = { name, ...(section.id === 'items' ? { category: ITEM_CATEGORY } : {}) };
  const kind = section.id === 'items' ? 'trivia' : section.id;
  return store.add<{ id: number; npc?: number }>(section.kind, body).pipe(map((created) => ({ kind, id: created.npc ?? created.id })));
}

/** Names a carrier in the row "Getragen von"; the ids of characters and of player characters can be the same. */
const carrierKey = (carrier: Carrier) => `${carrier.isPlayer ? 'pc' : 'npc'}:${carrier.id}`;

/**
 * One part of the glossary as a wall of tiles. A click on a tile opens the popup of the entry. The same wall is used
 * while writing a world and while playing it. "Neu" in the bar at the bottom, or the search of the wall, starts a new
 * entry from its name; a session creates nothing.
 */
@Component({
  selector: 'app-glossary-tiles',
  imports: [EntryWall, NameDialog],
  template: `
    <app-entry-wall
      [id]="section().id"
      [items]="tiles()"
      [offers]="offers()"
      [placeholder]="section().label + ' durchsuchen …'"
      [creatable]="creatable()"
      [empty]="section().empty"
      [emptyHint]="creatable() ? 'Mit „Neu“ unten in der Leiste legst du den ersten an.' : ''"
      (create)="create($event)"
    />

    @if (creating()) {
      <app-name-dialog
        [title]="section().newLabel"
        hint="Der Eintrag öffnet sich danach im Seitenfenster, wo du den Rest schreibst."
        [error]="error()"
        (create)="create($event)"
        (closed)="creating.set(false)"
      />
    }
  `,
})
export class GlossaryTiles {
  protected readonly store = inject(WorldStore);
  private readonly toast = inject(ToastService);

  readonly section = input.required<GlossarySection>();
  /** Whether new entries can be created here; a session only reads. */
  readonly creatable = input(true);
  /** More carriers of items than the NPCs of the world: the characters of a group. */
  readonly carriers = input<Carrier[]>([]);
  /** Fired with the id of a player character, when an item is clicked that only this character carries. */
  readonly carrier = output<number>();

  protected readonly creating = signal(false);
  protected readonly error = signal('');
  protected readonly tiles = computed<WallTile[]>(() => {
    const store = this.store;
    switch (this.section().id) {
      case 'locations':
        return placeTiles(store);
      case 'npcs':
        return npcTiles(store);
      case 'quests':
        return questTiles(store);
      case 'events':
        return eventTiles(store);
      case 'items':
        return itemRows(store.trivia(), this.allCarriers()).map((row) => this.itemTile(row));
      default:
        return knowledgeTiles(store, store.trivia().filter((trivia) => !isItem(trivia)));
    }
  });
  /** The rows of filters of the part: chapters and categories everywhere, and what the kind has of its own. */
  protected readonly offers = computed<Facet[]>(() => {
    const store = this.store;
    const chapters = chapterFacet(store);
    switch (this.section().id) {
      case 'locations':
        return [chapters, categoryFacet(store.locations()), placeFacet(store)];
      case 'npcs':
        return [chapters, categoryFacet(store.npcs())];
      case 'quests':
        return [chapters, categoryFacet(store.quests()), QUEST_KIND_FACET];
      case 'events':
        return [chapters, categoryFacet(store.events())];
      case 'items':
        return [chapters, this.carrierFacet()];
      default:
        return [chapters, categoryFacet(store.trivia().filter((trivia) => !isItem(trivia)))];
    }
  });
  private readonly newTool = computed<Tool[]>(() =>
    this.creatable() ? [{ id: 'new', word: 'Neu', title: this.section().newLabel, icon: 'plus', click: () => this.creating.set(true) }] : [],
  );

  constructor() {
    inject(Tools).provide('view', this.newTool);
  }

  /** Create an entry with the name and open its form in the window at the side. */
  protected create(name: string): void {
    createEntry(this.store, this.section(), name).subscribe({
      next: (ref) => this.created(ref),
      error: (e: unknown) => this.fail(e),
    });
  }

  /** In the dialog the reason stands in the dialog, elsewhere in a short message on top. */
  private fail(error: unknown): void {
    if (this.creating()) {
      this.error.set(readError(error));
    } else {
      this.toast.show(readError(error), 'danger');
    }
  }

  private created(ref: EntryRef): void {
    this.creating.set(false);
    this.error.set('');
    this.store.read(ref, true);
  }

  private allCarriers(): Carrier[] {
    const npcs = this.store.npcs().map((link) => ({ id: link.npc, name: link.name, isPlayer: false, inventory: link.inventory }));
    return [...npcs, ...this.carriers()];
  }

  /** Everybody who carries something, and "Von niemandem" for items of the world nobody carries. */
  private carrierFacet(): Facet {
    const carrying = this.allCarriers().filter((carrier) => carrier.inventory.length);
    return {
      id: 'carrier', label: 'Nach Träger filtern', all: 'Alle Träger',
      options: [...carrying.map((carrier) => ({ value: carrierKey(carrier), label: carrier.name })), { value: NOBODY, label: 'Von niemandem' }],
    };
  }

  /**
   * An item of the world is its own tile. An item that is only carried is a loose tile: a click looks up the NPC
   * that carries it, or opens the sheet of the player character.
   */
  private itemTile(row: ItemRow): WallTile {
    const carriers = row.owners.length ? row.owners.map(carrierKey) : [NOBODY];
    if (row.trivia !== null) {
      const ref: EntryRef = { kind: 'trivia', id: row.trivia };
      const entry = { name: row.name, category: '', description: row.text };
      return entryTile(this.store, ref, entry, ONE_GROUP, { carrier: carriers });
    }
    const owner = row.owners.find((one) => !one.isPlayer) ?? row.owners[0];
    return {
      key: `carried:${row.name.toLowerCase()}`, ref: null, name: row.name, text: row.text, values: { carrier: carriers }, group: ONE_GROUP,
      loose: {
        name: row.name, kicker: `Getragen von ${row.owners.map((one) => one.name).join(', ')}`, symbol: row.symbol, fallback: 'gift',
        tone: 'items', colour: '', lead: null, text: row.text, steps: 0, facts: '', tags: [],
      },
      press: () => (owner.isPlayer ? this.carrier.emit(owner.id) : this.store.look({ kind: 'npcs', id: owner.id })),
    };
  }
}
