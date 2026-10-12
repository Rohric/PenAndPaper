import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Option } from '../core/models';

/**
 * Link entries: only the linked ones are shown, more are added from a small list with search.
 * Replaces a wall of pills when a world has many entries.
 */
@Component({
  selector: 'app-link-picker',
  imports: [FormsModule],
  template: `
    <div class="row">
      @if (chips()) {
        @for (option of chosen(); track option.id) {
          <span class="chip picked">
            {{ option.label }}
            <button type="button" class="picked__x" [attr.aria-label]="option.label + ' entfernen'" (click)="remove(option.id)">×</button>
          </span>
        } @empty {
          <span class="soft">{{ emptyText() }}</span>
        }
      }
      <button type="button" class="btn btn--small" [attr.aria-expanded]="open()" (click)="toggle()">+ Hinzufügen</button>
    </div>

    @if (open()) {
      <div class="chooser">
        <input class="input" type="search" placeholder="Suchen …" [attr.aria-label]="label() + ' suchen'" [ngModel]="query()" (ngModelChange)="query.set($event)" />
        <div class="chooser__list">
          @for (option of matches(); track option.id) {
            <button type="button" class="chooser__item" (click)="add(option.id)">{{ option.label }}</button>
          } @empty {
            <span class="soft">Nichts gefunden.</span>
          }
        </div>
        @if (creatable() && query().trim()) {
          <button type="button" class="btn btn--small" (click)="createNew()">„{{ query().trim() }}“ neu anlegen</button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .picked {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      min-height: 36px;
      padding-right: 4px;
      color: var(--text);
    }

    .picked__x {
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 50%;
      background: var(--surface-2);
      color: var(--soft);
      line-height: 1;
    }

    .chooser {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      border: 1px solid var(--line-2);
      border-radius: var(--radius-sm);
      background: var(--surface-2);
    }

    .chooser__list {
      display: flex;
      flex-direction: column;
      max-height: 220px;
      overflow-y: auto;
    }

    .chooser__item {
      min-height: 40px;
      padding: 6px 10px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--text);
      text-align: left;
    }

    .chooser__item:hover {
      background: var(--surface);
    }
  `,
})
export class LinkPicker {
  /** Everything that can be linked. */
  readonly options = input.required<Option[]>();
  /** Ids of the linked entries. */
  readonly selected = input.required<number[]>();
  readonly label = input('Einträge');
  readonly emptyText = input('Noch nichts verknüpft.');
  /** Whether a new entry can be created from the typed name. */
  readonly creatable = input(false);
  /** Whether the linked entries are listed here; switched off when the page shows them itself. */
  readonly chips = input(true);
  readonly selectedChange = output<number[]>();
  /** Fired with the typed name when the user wants a new entry. */
  readonly create = output<string>();

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly chosen = computed(() =>
    this.selected().flatMap((id) => this.options().filter((option) => option.id === id)),
  );
  protected readonly matches = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.options().filter((o) => !this.selected().includes(o.id) && o.label.toLowerCase().includes(query));
  });

  /** Show or hide the list to choose from. */
  protected toggle(): void {
    this.open.update((open) => !open);
    this.query.set('');
  }

  /** Link one more entry. */
  protected add(id: number): void {
    this.selectedChange.emit([...this.selected(), id]);
  }

  /** Take one entry out of the links. */
  protected remove(id: number): void {
    this.selectedChange.emit(this.selected().filter((other) => other !== id));
  }

  /** Ask the page to create an entry with the typed name. */
  protected createNew(): void {
    this.create.emit(this.query().trim());
    this.query.set('');
  }
}
