import { Component, input, model, output } from '@angular/core';

import { Chosen, Facet } from '../../core/wall';
import { Icon } from '../basic/icon';

/**
 * The bar above a wall of tiles: a search over names and texts, the rows of filters (chapter, category and what
 * a kind has of its own) and, when no entry is called like the typed text, the offer to create one with that name.
 * The rows can be hidden; the search always stays.
 */
@Component({
  selector: 'app-filter-bar',
  imports: [Icon],
  template: `
    <div class="filter__search">
      <input
        class="input"
        type="search"
        autocomplete="off"
        [attr.aria-label]="placeholder()"
        [placeholder]="placeholder()"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
        (keydown.enter)="enter()"
        (keydown.escape)="clear($event)"
      />
      @if (offer()) {
        <button type="button" class="btn btn--small" (click)="create.emit(query().trim())">
          <app-icon name="plus" [size]="16" /> „{{ query().trim() }}“ neu anlegen
        </button>
      }
    </div>
    @if (open()) {
      @for (facet of facets(); track facet.id) {
        <div class="row filter__row" role="group" [attr.aria-label]="facet.label">
          <button type="button" class="pill" [attr.aria-pressed]="(chosen()[facet.id] ?? null) === null" (click)="choose(facet.id, null)">
            {{ facet.all }}
          </button>
          @for (option of facet.options; track option.value) {
            <button
              type="button"
              class="pill"
              [class.pill--tone]="!!option.colour"
              [style.--kind]="option.colour || null"
              [attr.title]="option.title || null"
              [attr.aria-pressed]="chosen()[facet.id] === option.value"
              (click)="choose(facet.id, option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      }
    }
    @if (empty()) {
      <p class="soft" role="status">Nichts gefunden.</p>
    }
  `,
  styleUrl: './filter-bar.scss',
})
export class FilterBar {
  /** The typed words. */
  readonly query = model('');
  /** The value chosen in each row; null filters nothing. */
  readonly chosen = model<Chosen>({});
  readonly facets = input<Facet[]>([]);
  /** Whether the rows of filters are shown; the search stays either way. */
  readonly open = input(true);
  readonly placeholder = input('Suchen …');
  /** Whether a new entry can be created with the typed name. */
  readonly offer = input(false);
  /** Whether nothing fits the search and the filters. */
  readonly empty = input(false);
  /** Fired with the typed name when the user wants a new entry. */
  readonly create = output<string>();

  /** Choose a value in a row, or none. */
  protected choose(facet: string, value: string | null): void {
    this.chosen.update((chosen) => ({ ...chosen, [facet]: value }));
  }

  /** Enter creates the entry, when that is offered. */
  protected enter(): void {
    if (this.offer()) {
      this.create.emit(this.query().trim());
    }
  }

  /** Escape empties the field first; an empty field lets Escape close the window on top. */
  protected clear(event: Event): void {
    if (this.query()) {
      event.stopPropagation();
      this.query.set('');
    }
  }
}
