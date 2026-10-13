import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InventoryItem } from '../../core/models';
import { damageText } from '../../core/rules';

const MAX_DAMAGE_DICE = 10;

type NumberField = 'quantity' | 'damage_dice' | 'damage_bonus';

/** Edit the inventory of a character. An entry with damage dice is a weapon. */
@Component({
  selector: 'app-inventory-editor',
  imports: [FormsModule],
  templateUrl: './inventory-editor.html',
  styleUrl: './inventory-editor.scss',
})
export class InventoryEditor {
  readonly items = input.required<InventoryItem[]>();
  readonly itemsChange = output<InventoryItem[]>();

  protected readonly damageText = damageText;

  /** Append an empty entry. */
  protected add(): void {
    const empty: InventoryItem = { name: '', quantity: 1, damage_dice: 0, damage_bonus: 0, description: '' };
    this.itemsChange.emit([...this.items(), empty]);
  }

  /** Change fields of one entry. */
  protected change(index: number, changes: Partial<InventoryItem>): void {
    this.itemsChange.emit(this.items().map((item, i) => (i === index ? { ...item, ...changes } : item)));
  }

  /** Change a number field; damage dice stay between 0 and 10. */
  protected setNumber(index: number, key: NumberField, value: number | null): void {
    const whole = Math.max(0, Math.floor(value ?? 0));
    this.change(index, { [key]: key === 'damage_dice' ? Math.min(MAX_DAMAGE_DICE, whole) : whole });
  }

  /** Remove one entry. */
  protected remove(index: number): void {
    this.itemsChange.emit(this.items().filter((_, i) => i !== index));
  }
}
