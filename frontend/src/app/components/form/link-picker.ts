import { Component, ElementRef, booleanAttribute, computed, input, output, signal, viewChild } from '@angular/core';

import { Option } from '../../core/models';
import { Icon } from '../basic/icon';

const SHOWN = 8;
let fields = 0;

/** One line in the list to choose from: an entry to link, or the offer to create a new one. */
interface Choice {
  option: Option | null;
  label: string;
  hint: string;
}

/**
 * Link entries by typing. The linked entries stand as chips in the field. Typing shows what fits,
 * the arrow keys walk through the list, Enter links the marked entry, Backspace in the empty field
 * takes the last chip away, and Tab moves on. A click on a chip looks the entry up.
 * Chips and choices show the colour of the kind of entry they stand for.
 * With "single" the field holds one entry at most and speaks "value" instead of "selected".
 */
@Component({
  selector: 'app-link-picker',
  imports: [Icon],
  template: `
    <div class="box" (click)="focus()">
      @if (chips()) {
        @for (option of chosen(); track option.id) {
          <span [class]="'token kind--' + (option.tone ?? '')">
            <button type="button" class="token__name" tabindex="-1" (click)="look.emit(option.id); $event.stopPropagation()">
              {{ option.label }}
            </button>
            <button
              type="button"
              class="token__x"
              tabindex="-1"
              [attr.aria-label]="option.label + ' entfernen'"
              (click)="remove(option.id); $event.stopPropagation()"
            >
              <app-icon name="close" [size]="14" />
            </button>
          </span>
        }
      }
      <input
        #box
        class="box__input"
        type="text"
        role="combobox"
        autocomplete="off"
        [id]="inputId()"
        [attr.aria-label]="label()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="listId"
        [attr.aria-activedescendant]="open() && choices().length ? listId + '-' + active() : null"
        [placeholder]="placeholder()"
        [value]="query()"
        (input)="type($any($event.target).value)"
        (keydown)="key($event)"
        (blur)="leave()"
      />
    </div>

    @if (open()) {
      <div class="list" role="listbox" [id]="listId">
        @for (choice of choices(); track $index) {
          <div
            role="option"
            [class]="'list__item kind--' + (choice.option?.tone ?? '')"
            [id]="listId + '-' + $index"
            [class.is-active]="$index === active()"
            [attr.aria-selected]="$index === active()"
            (mousedown)="pick(choice); $event.preventDefault()"
            (mouseenter)="active.set($index)"
          >
            <span class="list__label">{{ choice.label }}</span>
            @if (choice.hint) {
              <span class="list__hint">{{ choice.hint }}</span>
            }
          </div>
        } @empty {
          <span class="list__note">Nichts gefunden.</span>
        }
        @if (more()) {
          <span class="list__note">… und {{ more() }} weitere. Tippe weiter, um einzugrenzen.</span>
        }
      </div>
    }
  `,
  styleUrl: './link-picker.scss',
})
export class LinkPicker {
  /** Everything that can be linked. */
  readonly options = input.required<Option[]>();
  /** Ids of the linked entries. */
  readonly selected = input<number[]>([]);
  /** With "single": the id of the one linked entry, or null. */
  readonly value = input<number | null>(null);
  readonly single = input(false, { transform: booleanAttribute });
  /** What the field is for; read by screen readers. */
  readonly label = input('Einträge');
  /** Shown in the empty field. */
  readonly emptyText = input('Tippen zum Suchen …');
  /** Whether a new entry can be created from the typed name. */
  readonly creatable = input(false);
  /** Whether the linked entries stand in the field; switched off when the page shows them itself. */
  readonly chips = input(true);
  /** Id of the text field, so a label can point to it. */
  readonly inputId = input<string>();
  readonly selectedChange = output<number[]>();
  readonly valueChange = output<number | null>();
  /** Fired with the typed name when the user wants a new entry. */
  readonly create = output<string>();
  /** Fired with the id of a chip that was clicked, to look the entry up. */
  readonly look = output<number>();

  protected readonly listId = `link-list-${fields++}`;
  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');
  protected readonly open = signal(false);
  protected readonly query = signal('');
  /** Position of the marked line in the list. */
  protected readonly active = signal(0);

  private readonly ids = computed(() => {
    const value = this.value();
    return this.single() ? (value === null ? [] : [value]) : this.selected();
  });
  protected readonly chosen = computed(() => this.ids().flatMap((id) => this.options().filter((option) => option.id === id)));
  protected readonly placeholder = computed(() => (this.chips() && this.chosen().length ? (this.single() ? 'ändern …' : 'weitere …') : this.emptyText()));
  /** What fits the typed text and is not linked yet; names that begin with it come first. */
  private readonly found = computed(() => {
    const query = this.query().trim().toLowerCase();
    const rank = (option: Option) => (option.label.toLowerCase().startsWith(query) ? 0 : option.label.toLowerCase().includes(query) ? 1 : 2);
    const fits = (option: Option) => `${option.label} ${option.hint ?? ''}`.toLowerCase().includes(query);
    return this.options().filter((option) => !this.ids().includes(option.id) && fits(option)).sort((a, b) => rank(a) - rank(b));
  });
  protected readonly more = computed(() => Math.max(0, this.found().length - SHOWN));
  protected readonly choices = computed<Choice[]>(() => {
    const name = this.query().trim();
    const lines = this.found().slice(0, SHOWN).map((option) => ({ option, label: option.label, hint: option.hint ?? '' }));
    const known = this.options().some((option) => option.label.toLowerCase() === name.toLowerCase());
    return this.creatable() && name && !known ? [...lines, { option: null, label: `„${name}“ neu anlegen`, hint: '' }] : lines;
  });

  /** Typing opens the list and marks its first line. */
  protected type(text: string): void {
    this.query.set(text);
    this.active.set(0);
    this.open.set(true);
  }

  /** The keys of the field: arrows walk, Enter links, Escape closes, Backspace takes the last chip away. */
  protected key(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && this.open()) {
      event.preventDefault();
      this.pickActive();
    } else if (event.key === 'Escape' && this.open()) {
      event.stopPropagation();
      this.open.set(false);
    } else if (event.key === 'Backspace' && !this.query()) {
      this.removeLast();
    }
  }

  /** Link the chosen entry, or ask the page to create one with the typed name. */
  protected pick(choice: Choice): void {
    if (choice.option) {
      this.emit(this.single() ? [choice.option.id] : [...this.ids(), choice.option.id]);
    } else {
      this.create.emit(this.query().trim());
    }
    this.query.set('');
    this.open.set(false);
  }

  /** Take one entry out of the links. */
  protected remove(id: number): void {
    this.emit(this.ids().filter((other) => other !== id));
  }

  /** A click anywhere in the field puts the cursor into it and shows the list. */
  focus(): void {
    this.box().nativeElement.focus();
    this.open.set(true);
  }

  /** Leaving the field closes the list and drops what was typed but not linked. */
  protected leave(): void {
    this.open.set(false);
    this.query.set('');
  }

  private move(by: number): void {
    const count = this.choices().length;
    this.active.set(this.open() && count ? (this.active() + by + count) % count : 0);
    this.open.set(true);
  }

  private pickActive(): void {
    const choice = this.choices()[this.active()];
    if (choice) {
      this.pick(choice);
    }
  }

  private removeLast(): void {
    const last = this.chosen().at(-1);
    if (last && this.chips()) {
      this.remove(last.id);
    }
  }

  private emit(ids: number[]): void {
    if (this.single()) {
      this.valueChange.emit(ids[0] ?? null);
    } else {
      this.selectedChange.emit(ids);
    }
  }
}
