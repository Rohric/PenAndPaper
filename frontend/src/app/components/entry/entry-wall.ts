import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';

import { Folds } from '../../core/folds';
import { Chosen, Facet, chosenCount, filterWall, groupWall, namedExactly, usefulFacets } from '../../core/wall';
import { WorldStore } from '../../core/world-store';
import { Tool, Tools } from '../../global/tool-bar/tools.service';
import { Fold, foldScope, foldTools } from '../basic/fold';
import { FilterBar } from '../form/filter-bar';
import { EntryCard } from './entry-card';
import { WallTile } from './wall-tiles';

/**
 * All entries of a kind as a wall of tiles of one size, the same everywhere: the filter bar on top, below it the
 * tiles in groups that fold at their title. A tile with many tags spans two columns from the start. The wall
 * reports the symbols "Filter" (shows or hides the rows of filters), "Alle zu" and "Alle auf"; the page reports "Neu".
 */
@Component({
  selector: 'app-entry-wall',
  imports: [NgTemplateOutlet, EntryCard, FilterBar, Fold],
  template: `
    <app-filter-bar
      [placeholder]="placeholder()"
      [facets]="facets()"
      [open]="filtersOpen()"
      [offer]="offer()"
      [empty]="nothingFound()"
      [(query)]="query"
      [(chosen)]="chosen"
      (create)="created($event)"
    />

    @for (group of groups(); track group.key) {
      @if (grouped()) {
        <app-fold [key]="'wall:' + id() + ':' + group.key" [title]="group.label" [count]="group.items.length" [colour]="group.colour ?? ''">
          <ng-container *ngTemplateOutlet="grid; context: { $implicit: group.items }" />
        </app-fold>
      } @else {
        <ng-container *ngTemplateOutlet="grid; context: { $implicit: group.items }" />
      }
    }

    @if (!items().length) {
      <div class="empty">
        <p>{{ empty() }}</p>
        @if (emptyHint()) {
          <p class="soft">{{ emptyHint() }}</p>
        }
      </div>
    }

    <ng-template #grid let-tiles>
      <div class="wall__grid">
        @for (tile of tiles; track tile.key) {
          <app-entry-card [ref]="tile.ref" [loose]="tile.loose ?? null" (press)="tile.press?.()" />
        }
      </div>
    </ng-template>
  `,
  styleUrl: './entry-wall.scss',
})
export class EntryWall {
  private readonly folds = inject(Folds);
  private readonly world = inject(WorldStore);

  /** Names the wall in the memory of the device, like "locations"; another id starts without search and filters. */
  readonly id = input.required<string>();
  readonly items = input.required<WallTile[]>();
  /** The rows of filters this wall offers; rows that would change nothing are left out by themselves. */
  readonly offers = input<Facet[]>([]);
  readonly placeholder = input('Suchen …');
  /** Whether new entries can be created from the search; a session only reads. */
  readonly creatable = input(false);
  /** The sentence of an empty wall, and the hint how to begin. */
  readonly empty = input('Hier steht noch nichts.');
  readonly emptyHint = input('');
  /** Fired with the typed name, to create an entry with it. */
  readonly create = output<string>();

  protected readonly query = linkedSignal({ source: this.id, computation: () => '' });
  protected readonly chosen = linkedSignal<string, Chosen>({ source: this.id, computation: () => ({}) });
  protected readonly facets = computed(() => usefulFacets(this.offers(), this.items()));
  private readonly found = computed(() => filterWall(this.items(), this.query(), this.chosen()));
  protected readonly groups = computed(() => groupWall(this.found()));
  /** Groups get a title only when the whole wall has more than one; filtering does not change the look. */
  protected readonly grouped = computed(() => groupWall(this.items()).length > 1);
  protected readonly nothingFound = computed(() => !!this.items().length && !this.found().length);
  protected readonly offer = computed(() => this.creatable() && !!this.query().trim() && !namedExactly(this.items(), this.query()));

  private readonly scope = computed(() => foldScope(this.world));
  private readonly filterKey = computed(() => `filters:${this.id()}`);
  protected readonly filtersOpen = computed(() => !this.folds.isShut(this.scope(), this.filterKey()));
  private readonly tools = computed<Tool[]>(() => {
    const open = this.filtersOpen();
    const filter: Tool = {
      id: 'filter', word: 'Filter', title: open ? 'Filter verbergen' : 'Filter zeigen', icon: 'filter', pressed: open && !!this.facets().length,
      count: chosenCount(this.chosen()), disabled: !this.facets().length, click: () => this.folds.toggle(this.scope(), this.filterKey()),
    };
    return [filter, ...foldTools(this.folds, this.scope())];
  });

  constructor() {
    inject(Tools).provide('view', this.tools);
  }

  /** Create an entry with the typed name; the search starts empty again, so the new entry is in view. */
  protected created(name: string): void {
    this.query.set('');
    this.create.emit(name);
  }
}
