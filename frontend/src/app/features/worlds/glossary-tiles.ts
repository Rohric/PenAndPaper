import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { readError } from '../../core/api-error';
import { EntryRef, Location } from '../../core/models';
import { Icon, IconName } from '../../shared/icon';
import { Portrait } from '../../shared/portrait';
import { isItem, summaryOf } from './entry-views';
import { EventTile } from './event-tile';
import { Carrier, ItemRow, itemRows } from './item-rows';
import { QuestTile } from './quest-tile';
import { Kind, WorldStore } from './world-store';

export type SectionId = 'locations' | 'npcs' | 'quests' | 'events' | 'items' | 'trivia';

/** One part of the glossary: what it is called, its symbol and the list of the world behind it. */
export interface GlossarySection {
  id: SectionId;
  label: string;
  icon: IconName;
  /** The list new entries are created in; items are knowledge entries of the category "Gegenstand". */
  kind: Exclude<Kind, 'chapters' | 'scenes'>;
  newLabel: string;
  empty: string;
}

export const GLOSSARY_SECTIONS: GlossarySection[] = [
  { id: 'locations', label: 'Orte', icon: 'pin', kind: 'locations', newLabel: 'Name des neuen Ortes', empty: 'Noch kein Ort.' },
  { id: 'npcs', label: 'Figuren', icon: 'sheet', kind: 'world-npcs', newLabel: 'Name der neuen Figur', empty: 'Noch keine Figur.' },
  { id: 'quests', label: 'Quests', icon: 'quest', kind: 'quests', newLabel: 'Name der neuen Quest', empty: 'Noch keine Quest.' },
  { id: 'events', label: 'Ereignisse', icon: 'flag', kind: 'events', newLabel: 'Name des neuen Ereignisses', empty: 'Noch kein Ereignis.' },
  { id: 'items', label: 'Gegenstände', icon: 'gift', kind: 'trivia', newLabel: 'Name des neuen Gegenstands', empty: 'Noch kein Gegenstand.' },
  { id: 'trivia', label: 'Wissen', icon: 'note', kind: 'trivia', newLabel: 'Name des neuen Eintrags', empty: 'Noch kein Wissen.' },
];

const ITEM_CATEGORY = 'Gegenstand';

/** One entry as a tile: what kind it is, its name, how its text begins and what a click opens. */
interface Tile {
  /** The entry a click looks up; an item that only a player character carries has none. */
  ref: EntryRef | null;
  /** Id of the player character whose sheet a click opens instead. */
  player: number | null;
  kicker: string;
  title: string;
  text: string;
  symbol: string;
  fallback: IconName;
}

/**
 * One part of the glossary as a wall of tiles. A click looks the entry up in the window at the side.
 * The same wall is used while writing a world and while playing it.
 */
@Component({
  selector: 'app-glossary-tiles',
  imports: [FormsModule, Icon, Portrait, QuestTile, EventTile],
  template: `
    @if (creatable()) {
      <form class="list-row" (ngSubmit)="create()">
        <input class="input" name="newName" [attr.aria-label]="section().newLabel" [placeholder]="section().newLabel" [(ngModel)]="newName" />
        <button type="submit" class="btn btn--primary" [disabled]="!newName().trim()"><app-icon name="plus" [size]="16" /> Anlegen</button>
      </form>
    }
    @if (error()) {
      <p class="notice notice--error" role="alert">{{ error() }}</p>
    }

    <div class="tiles">
      @if (section().id === 'quests') {
        @for (quest of store.quests(); track quest.id) {
          <app-quest-tile [quest]="quest" />
        }
      } @else if (section().id === 'events') {
        @for (event of store.events(); track event.id) {
          <app-event-tile [event]="event" />
        }
      } @else {
        @for (tile of tiles(); track $index) {
          <button type="button" [class]="'tile kind--' + section().id" (click)="open(tile)">
            <span class="tile__head">
              <app-portrait [symbol]="tile.symbol" [fallback]="tile.fallback" [size]="36" />
              <span class="tile__names">
                @if (tile.kicker) {
                  <span class="kicker">{{ tile.kicker }}</span>
                }
                <span class="tile__title">{{ tile.title }}</span>
              </span>
            </span>
            @if (tile.text) {
              <span class="soft clamp">{{ tile.text }}</span>
            }
          </button>
        }
      }
    </div>

    @if (isEmpty()) {
      <div class="empty">
        <p>{{ section().empty }}</p>
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
  `,
})
export class GlossaryTiles {
  protected readonly store = inject(WorldStore);

  readonly section = input.required<GlossarySection>();
  /** Whether new entries can be created here; a session only reads. */
  readonly creatable = input(true);
  /** More carriers of items than the NPCs of the world: the characters of a group. */
  readonly carriers = input<Carrier[]>([]);
  /** Fired with the id of a player character, when an item is clicked that only this character carries. */
  readonly carrier = output<number>();

  protected readonly newName = signal('');
  protected readonly error = signal('');
  protected readonly tiles = computed(() => this.tilesOf(this.section().id));
  protected readonly isEmpty = computed(() => {
    const own = { quests: this.store.quests(), events: this.store.events() };
    const section = this.section().id;
    return section === 'quests' || section === 'events' ? !own[section].length : !this.tiles().length;
  });

  /** Look the entry of a tile up at the side, or ask for the sheet of the character that carries the item. */
  protected open(tile: Tile): void {
    if (tile.ref) {
      this.store.peek.set(tile.ref);
    } else if (tile.player !== null) {
      this.carrier.emit(tile.player);
    }
  }

  /** Create an entry from the typed name and open its form at the side. */
  protected create(): void {
    const section = this.section();
    const body = { name: this.newName().trim(), ...(section.id === 'items' ? { category: ITEM_CATEGORY } : {}) };
    this.store.add<{ id: number; npc?: number }>(section.kind, body).subscribe({
      next: (created) => this.created(created.npc ?? created.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  private created(id: number): void {
    const kind = this.section().id;
    this.newName.set('');
    this.error.set('');
    this.store.peek.set({ kind: kind === 'items' ? 'trivia' : kind, id, edit: true });
  }

  private tilesOf(section: SectionId): Tile[] {
    switch (section) {
      case 'locations':
        return this.placeTiles(null, new Set());
      case 'npcs':
        return this.store.npcs().map((link) => ({
          ref: { kind: 'npcs', id: link.npc }, player: null, kicker: link.profession, title: link.name, text: '', symbol: link.symbol,
          fallback: 'sheet',
        }));
      case 'items':
        return itemRows(this.store.trivia(), this.allCarriers()).map((row) => this.itemTile(row));
      case 'trivia':
        return this.knowledgeTiles();
      default:
        return [];
    }
  }

  /** Places in the order of their tree: every place is followed by the places that lie inside it. */
  private placeTiles(parent: Location | null, seen: Set<number>): Tile[] {
    return this.store
      .locations()
      .filter((place) => place.parent === (parent?.id ?? null) && !seen.has(place.id))
      .flatMap((place) => {
        seen.add(place.id);
        const tile: Tile = {
          ref: { kind: 'locations', id: place.id }, player: null, kicker: parent ? `in ${parent.name}` : '', title: place.name,
          text: summaryOf(place), symbol: place.symbol, fallback: 'pin',
        };
        return [tile, ...this.placeTiles(place, seen)];
      });
  }

  /** Knowledge without the items, grouped by its category; entries without one come last. */
  private knowledgeTiles(): Tile[] {
    const rank = (category: string) => (category ? `0${category.toLowerCase()}` : '1');
    return this.store
      .trivia()
      .filter((trivia) => !isItem(trivia))
      .sort((a, b) => rank(a.category).localeCompare(rank(b.category)))
      .map((trivia) => ({
        ref: { kind: 'trivia', id: trivia.id }, player: null, kicker: trivia.category, title: trivia.name, text: summaryOf(trivia),
        symbol: trivia.symbol, fallback: 'note',
      }));
  }

  private allCarriers(): Carrier[] {
    const npcs = this.store.npcs().map((link) => ({ id: link.npc, name: link.name, isPlayer: false, inventory: link.inventory }));
    return [...npcs, ...this.carriers()];
  }

  /** An item opens its entry of the world; without one the NPC that carries it, or else the player character. */
  private itemTile(row: ItemRow): Tile {
    const owners = row.owners.map((owner) => owner.name).join(', ');
    const npc = row.owners.find((owner) => !owner.isPlayer);
    const ref: EntryRef | null = row.trivia !== null ? { kind: 'trivia', id: row.trivia } : npc ? { kind: 'npcs', id: npc.id } : null;
    const kicker = owners ? `Getragen von ${owners}` : 'Gegenstand der Welt';
    return { ref, player: row.owners[0]?.id ?? null, kicker, title: row.name, text: row.text, symbol: row.symbol, fallback: 'gift' };
  }
}
