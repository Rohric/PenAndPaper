import { InventoryItem, Trivia } from '../../core/models';
import { damageText } from '../../core/rules';
import { isItem, summaryOf } from './entry-views';

/** Somebody who carries items: an NPC of the world, or a character of a group. */
export interface Carrier {
  id: number;
  name: string;
  /** Whether it is a player character; an NPC can be looked up in the glossary. */
  isPlayer: boolean;
  inventory: InventoryItem[];
}

/** One item as the glossary lists it: an entry of the world, something characters carry, or both. */
export interface ItemRow {
  name: string;
  text: string;
  /** Key of the symbol the item carries in the world; empty for an item that is only carried. */
  symbol: string;
  /** Id of the knowledge entry when the item is written down in the world. */
  trivia: number | null;
  owners: Carrier[];
}

const key = (name: string) => name.trim().toLowerCase();

/** What a line of an inventory says about itself: its description and, for a weapon, its damage. */
function lineText(line: InventoryItem): string {
  return [line.description, damageText(line)].filter(Boolean).join(' · ');
}

/**
 * Collect all items into one list: first the items of the world, then what the carriers have.
 * A carried item with the name of a world item belongs to that entry; equal names become one row.
 */
export function itemRows(trivia: Trivia[], carriers: Carrier[]): ItemRow[] {
  const rows: ItemRow[] = trivia.filter(isItem).map((item) => ({ name: item.name, text: summaryOf(item), symbol: item.symbol, trivia: item.id, owners: [] }));
  for (const carrier of carriers) {
    for (const line of carrier.inventory) {
      const row = rows.find((other) => key(other.name) === key(line.name)) ?? addRow(rows, line);
      row.owners = row.owners.includes(carrier) ? row.owners : [...row.owners, carrier];
    }
  }
  return rows;
}

function addRow(rows: ItemRow[], line: InventoryItem): ItemRow {
  const row = { name: line.name, text: lineText(line), symbol: '', trivia: null, owners: [] };
  rows.push(row);
  return row;
}
