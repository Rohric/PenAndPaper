import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ItemGift } from '../../core/session-models';

/** A prepared item of the world that can be handed over: its name and what is written about it. */
export interface ItemTemplate {
  /** Id of the knowledge entry the item is. */
  id: number;
  name: string;
  description: string;
  /** Whether the item belongs to the scene that is open: to its place, its characters or its quests. */
  here: boolean;
  /** Damage of a weapon in W10 and its bonus; 0 for an item that is no weapon. */
  dice: number;
  bonus: number;
}

/**
 * Hand an item to a character: pick a prepared one or type it, set its damage if it is a weapon,
 * and hide it from the rest of the group if it is a secret.
 */
@Component({
  selector: 'app-item-gift-form',
  imports: [FormsModule],
  template: `
    <form class="stack" (ngSubmit)="submit()">
      @if (templates().length) {
        <div class="field">
          <label for="gift-template">Vorbereiteter Gegenstand</label>
          <select id="gift-template" class="input" name="template" [ngModel]="-1" (ngModelChange)="use($event)">
            <option [ngValue]="-1">Frei eintippen</option>
            @for (template of templates(); track $index) {
              <option [ngValue]="$index">{{ template.name }}{{ template.here ? ' · gehört zu dieser Szene' : '' }}</option>
            }
          </select>
        </div>
      }
      <div class="grid-fields">
        <div class="field">
          <label for="gift-name">Name</label>
          <input id="gift-name" class="input" name="name" [(ngModel)]="name" />
        </div>
        <div class="field">
          <label for="gift-quantity">Anzahl</label>
          <input id="gift-quantity" class="input" name="quantity" type="number" min="1" [(ngModel)]="quantity" />
        </div>
        <div class="field">
          <label for="gift-dice">Schaden in W10</label>
          <input id="gift-dice" class="input" name="dice" type="number" min="0" max="10" [(ngModel)]="dice" />
        </div>
        <div class="field">
          <label for="gift-bonus">Schadensbonus</label>
          <input id="gift-bonus" class="input" name="bonus" type="number" min="0" [(ngModel)]="bonus" />
        </div>
      </div>
      <div class="field">
        <label for="gift-description">Beschreibung</label>
        <textarea id="gift-description" class="input" name="description" rows="2" [(ngModel)]="description"></textarea>
      </div>
      <label class="check">
        <input type="checkbox" name="hidden" [(ngModel)]="hidden" />
        Versteckt: nur dieser Spieler und du sehen den Gegenstand im Glossar
      </label>
      <div class="row">
        <button type="submit" class="btn btn--primary btn--small" [disabled]="!name().trim()">Übergeben</button>
      </div>
    </form>
  `,
})
export class ItemGiftForm {
  /** The prepared items of the world. */
  readonly templates = input<ItemTemplate[]>([]);
  readonly give = output<Omit<ItemGift, 'character'>>();

  protected readonly name = signal('');
  protected readonly quantity = signal(1);
  protected readonly dice = signal(0);
  protected readonly bonus = signal(0);
  protected readonly description = signal('');
  protected readonly hidden = signal(false);
  /** Id of the item of the world that was picked; null for an item typed freely. */
  private readonly item = signal<number | null>(null);

  /** Fill name, description and damage from a prepared item, and remember which item of the world it is. */
  protected use(index: number): void {
    const template = this.templates()[index];
    this.item.set(template?.id ?? null);
    this.name.set(template?.name ?? '');
    this.description.set(template?.description ?? '');
    this.dice.set(template?.dice ?? 0);
    this.bonus.set(template?.bonus ?? 0);
  }

  /** Hand the item over and clear the form. */
  protected submit(): void {
    this.give.emit({
      name: this.name().trim(), quantity: Math.max(1, this.quantity() || 1),
      damage_dice: Math.max(0, this.dice() || 0), damage_bonus: Math.max(0, this.bonus() || 0), description: this.description(),
      item: this.item(), hidden: this.hidden(),
    });
    this.item.set(null);
    this.name.set('');
    this.description.set('');
    this.hidden.set(false);
  }
}
