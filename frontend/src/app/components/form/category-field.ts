import { Component, computed, inject, input, output } from '@angular/core';

import { Kind, WorldStore } from '../../core/world-store';
import { tagColour } from '../entry/tag-colour';

let fields = 0;

/**
 * The field "Kategorie" of every entry form: free text, and while typing the categories this kind already has in
 * the world are offered. The dot beside the label shows the tone the category has everywhere in the app.
 */
@Component({
  selector: 'app-category-field',
  template: `
    <div class="field">
      <label [for]="inputId()">Kategorie <span class="dot" [style.--kind]="colour()"></span></label>
      <span class="soft">Im Glossar filterst und gruppierst du nach der Kategorie.{{ hint() ? ' ' + hint() : '' }}</span>
      <input
        class="input"
        autocomplete="off"
        maxlength="100"
        [id]="inputId()"
        [attr.list]="listId"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="valueChange.emit($any($event.target).value)"
        (change)="commit.emit($any($event.target).value.trim())"
      />
      <datalist [id]="listId">
        @for (category of suggestions(); track category) {
          <option [value]="category"></option>
        }
      </datalist>
    </div>
  `,
})
export class CategoryField {
  private readonly store = inject(WorldStore);

  readonly inputId = input.required<string>();
  /** The list of the world whose categories are offered. */
  readonly kind = input.required<Kind>();
  readonly value = input('');
  /** One more sentence below the label, like what the category "Gegenstand" does. */
  readonly hint = input('');
  readonly placeholder = input('Zum Beispiel Stadt, Händler, Erster Akt');
  /** Fired with every key, for forms that save with their button. */
  readonly valueChange = output<string>();
  /** Fired when the field is left after a change, for forms that save right away. */
  readonly commit = output<string>();

  protected readonly listId = `category-list-${fields++}`;
  protected readonly colour = computed(() => tagColour(this.value()));
  protected readonly suggestions = computed(() => this.store.categoriesOf(this.kind()));
}
