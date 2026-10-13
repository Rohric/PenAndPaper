import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { EntryRef, Location } from '../../core/models';
import { Kind, WorldStore } from '../../core/world-store';
import { IconName } from '../../components/basic/icon';
import { Portrait } from '../../components/basic/portrait';
import { EntryCard } from '../../components/entry/entry-card';
import { chaptersOf } from '../../components/entry/entry-face';
import { isItem } from '../../components/entry/entry-views';
import { tagColour } from '../../components/entry/tag-colour';
import { NameDialog } from '../../components/form/name-dialog';
import { Tool, Tools } from '../../global/tool-bar/tools.service';
import { Carrier, ItemRow, itemRows } from './item-rows';

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
  { id: 'locations', label: 'Orte', icon: 'pin', kind: 'locations', newLabel: 'Neuer Ort', empty: 'Noch kein Ort.' },
  { id: 'npcs', label: 'Figuren', icon: 'sheet', kind: 'world-npcs', newLabel: 'Neue Figur', empty: 'Noch keine Figur.' },
  { id: 'quests', label: 'Quests', icon: 'quest', kind: 'quests', newLabel: 'Neue Quest', empty: 'Noch keine Quest.' },
  { id: 'events', label: 'Ereignisse', icon: 'flag', kind: 'events', newLabel: 'Neues Ereignis', empty: 'Noch kein Ereignis.' },
  { id: 'items', label: 'Gegenstände', icon: 'gift', kind: 'trivia', newLabel: 'Neuer Gegenstand', empty: 'Noch kein Gegenstand.' },
  { id: 'trivia', label: 'Wissen', icon: 'note', kind: 'trivia', newLabel: 'Neuer Eintrag im Wissen', empty: 'Noch kein Wissen.' },
];

const ITEM_CATEGORY = 'Gegenstand';

/** One tile of the wall: an entry of the world, or an item that only a player character carries. */
interface Tile {
  ref: EntryRef | null;
  /** The item of a player character, which has no entry of its own; a click opens the sheet of the character. */
  carried: ItemRow | null;
}

/**
 * One part of the glossary as a wall of cards. A click on a card opens the popup of the entry.
 * The same wall is used while writing a world and while playing it. The wall can be filtered by chapter,
 * knowledge also by its category; "Neu" in the bar at the bottom starts a new entry from its name.
 */
@Component({
  selector: 'app-glossary-tiles',
  imports: [Portrait, EntryCard, NameDialog],
  template: `
    @if (store.chapters().length) {
      <div class="row" role="group" aria-label="Nach Kapitel filtern">
        <button type="button" class="pill" [attr.aria-pressed]="chapter() === null" (click)="chapter.set(null)">Alle Kapitel</button>
        @for (item of store.chapters(); track item.id) {
          <button type="button" class="pill" [attr.title]="item.name" [attr.aria-pressed]="chapter() === item.id" (click)="chapter.set(item.id)">
            Kap. {{ item.number }}
          </button>
        }
      </div>
    }

    @if (section().id === 'trivia' && categories().length) {
      <div class="row" role="group" aria-label="Nach Kategorie filtern">
        <button type="button" class="pill" [attr.aria-pressed]="category() === null" (click)="category.set(null)">Alle</button>
        @for (name of categories(); track name) {
          <button type="button" class="pill pill--tone" [style.--kind]="colourOf(name)" [attr.aria-pressed]="category() === name" (click)="category.set(name)">
            {{ name || 'Ohne Kategorie' }}
          </button>
        }
      </div>
    }

    <div class="tiles">
      @for (tile of tiles(); track $index) {
        @if (tile.ref; as ref) {
          <app-entry-card [ref]="ref" [size]="rich() ? 'card' : 'tile'" />
        } @else if (tile.carried; as item) {
          <button type="button" class="tile kind--items" (click)="carrier.emit(item.owners[0].id)">
            <span class="tile__head">
              <app-portrait fallback="gift" [symbol]="item.symbol" [size]="32" />
              <span class="tile__names">
                <span class="kicker">Getragen von {{ item.owners[0].name }}</span>
                <span class="tile__title">{{ item.name }}</span>
              </span>
            </span>
            @if (item.text) {
              <span class="soft clamp">{{ item.text }}</span>
            }
          </button>
        }
      }
    </div>

    @if (!tiles().length) {
      <div class="empty">
        <p>{{ filtered() ? 'Kein Eintrag passt zu diesem Filter.' : section().empty }}</p>
        @if (creatable() && !filtered()) {
          <p class="soft">Mit „Neu“ unten in der Leiste legst du den ersten an.</p>
        }
      </div>
    }

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
  styleUrl: './glossary-tiles.scss',
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

  protected readonly creating = signal(false);
  protected readonly error = signal('');
  /** The chapter the wall is filtered by; null shows all. */
  protected readonly chapter = signal<number | null>(null);
  /** The categories of the knowledge of the world, in the order of the alphabet; knowledge without one comes last. */
  protected readonly categories = computed(() => {
    const names = new Set(this.store.trivia().filter((trivia) => !isItem(trivia)).map((trivia) => trivia.category.trim()));
    return [...names].sort((a, b) => Number(!a) - Number(!b) || a.localeCompare(b));
  });
  /** The category the knowledge is filtered by; null shows all. Another part of the glossary starts without a filter. */
  protected readonly category = linkedSignal<SectionId, string | null>({ source: () => this.section().id, computation: () => null });
  protected readonly colourOf = tagColour;
  /** Quests and events show more of themselves than the other kinds. */
  protected readonly rich = computed(() => this.section().id === 'quests' || this.section().id === 'events');
  protected readonly filtered = computed(() => this.chapter() !== null || this.category() !== null);
  protected readonly tiles = computed(() => {
    const chapter = this.chapter();
    const tiles = this.tilesOf(this.section().id);
    return chapter === null ? tiles : tiles.filter((tile) => !!tile.ref && chaptersOf(this.store, tile.ref).some((other) => other.id === chapter));
  });
  private readonly newTool = computed<Tool[]>(() =>
    this.creatable() ? [{ id: 'new', word: 'Neu', title: this.section().newLabel, icon: 'plus', click: () => this.creating.set(true) }] : [],
  );

  constructor() {
    inject(Tools).provide('view', this.newTool);
  }

  /** Create an entry from the typed name and open its form in the window at the side. */
  protected create(name: string): void {
    const section = this.section();
    const body = { name, ...(section.id === 'items' ? { category: ITEM_CATEGORY } : {}) };
    this.store.add<{ id: number; npc?: number }>(section.kind, body).subscribe({
      next: (created) => this.created(created.npc ?? created.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  private created(id: number): void {
    const kind = this.section().id;
    this.creating.set(false);
    this.error.set('');
    this.store.read({ kind: kind === 'items' ? 'trivia' : kind, id }, true);
  }

  private tilesOf(section: SectionId): Tile[] {
    const entry = (kind: EntryRef['kind'], id: number): Tile => ({ ref: { kind, id }, carried: null });
    switch (section) {
      case 'locations':
        return this.places(null, new Set()).map((place) => entry('locations', place.id));
      case 'npcs':
        return this.store.npcs().map((link) => entry('npcs', link.npc));
      case 'quests':
        return this.store.quests().map((quest) => entry('quests', quest.id));
      case 'events':
        return this.store.events().map((event) => entry('events', event.id));
      case 'items':
        return itemRows(this.store.trivia(), this.allCarriers()).map((row) => this.itemTile(row));
      default:
        return this.knowledge().map((id) => entry('trivia', id));
    }
  }

  /** Places in the order of their tree: every place is followed by the places that lie inside it. */
  private places(parent: Location | null, seen: Set<number>): Location[] {
    return this.store
      .locations()
      .filter((place) => place.parent === (parent?.id ?? null) && !seen.has(place.id))
      .flatMap((place) => {
        seen.add(place.id);
        return [place, ...this.places(place, seen)];
      });
  }

  /** Knowledge without the items, grouped by its category and filtered by the chosen one; entries without one come last. */
  private knowledge(): number[] {
    const rank = (category: string) => (category ? `0${category.toLowerCase()}` : '1');
    const chosen = this.category();
    return this.store
      .trivia()
      .filter((trivia) => !isItem(trivia) && (chosen === null || trivia.category.trim() === chosen))
      .sort((a, b) => rank(a.category).localeCompare(rank(b.category)))
      .map((trivia) => trivia.id);
  }

  private allCarriers(): Carrier[] {
    const npcs = this.store.npcs().map((link) => ({ id: link.npc, name: link.name, isPlayer: false, inventory: link.inventory }));
    return [...npcs, ...this.carriers()];
  }

  /** An item opens its entry of the world; without one the NPC that carries it, or else the sheet of the player character. */
  private itemTile(row: ItemRow): Tile {
    const npc = row.owners.find((owner) => !owner.isPlayer);
    const ref: EntryRef | null = row.trivia !== null ? { kind: 'trivia', id: row.trivia } : npc ? { kind: 'npcs', id: npc.id } : null;
    return { ref, carried: ref || !row.owners.length ? null : row };
  }
}
