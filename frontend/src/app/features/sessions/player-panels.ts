import { Component, computed, input, signal } from '@angular/core';

import { questLabel } from '../../core/models';
import { damageText } from '../../core/rules';
import { EquipmentLine, PlayerView, SessionEntryKind, SharedEntry, SharedQuest } from '../../core/session-models';
import { Icon, IconName } from '../../shared/icon';
import { Portrait } from '../../shared/portrait';
import { SidePanel } from '../../shared/side-panel';

/** Something the group carries: who has it, what is known about it, and its entry of the world if that is revealed. */
interface CarriedItem {
  name: string;
  text: string;
  owners: string[];
  /** Whether only the reader (and the game master) sees it. */
  hidden: boolean;
  entry: SharedEntry | null;
}

/** One tile on the page of the players, and what a click on it opens at the side. */
interface Card {
  key: string;
  kicker: string;
  title: string;
  text: string;
  symbol: string;
  fallback: IconName;
  entry: SharedEntry | null;
  item: CarriedItem | null;
}

const ITEM_CATEGORY = 'gegenstand';
const NOTHING_MORE = 'Mehr wisst ihr noch nicht.';
const PARTS: { kind: SessionEntryKind; label: string; icon: IconName }[] = [
  { kind: 'location', label: 'Orte', icon: 'pin' },
  { kind: 'npc', label: 'Figuren', icon: 'sheet' },
  { kind: 'event', label: 'Ereignisse', icon: 'flag' },
  { kind: 'trivia', label: 'Wissen', icon: 'note' },
];

const isItem = (entry: SharedEntry) => entry.kind === 'trivia' && entry.category.trim().toLowerCase() === ITEM_CATEGORY;

/**
 * What the players of a session see: the quests shared with them, their glossary with what the
 * group carries, and the group. Everything is a tile; a click opens it in a window at the side
 * with all the group knows. The game master shows the same to check what he has revealed.
 */
@Component({
  selector: 'app-player-panels',
  imports: [Icon, Portrait, SidePanel],
  templateUrl: './player-panels.html',
})
export class PlayerPanels {
  readonly view = input.required<PlayerView>();
  /** Which part is shown; the game master looks at all of them at once. */
  readonly part = input<'quests' | 'glossary' | 'group' | 'all'>('all');

  protected readonly nothingMore = NOTHING_MORE;
  /** Key of the tile that is open at the side; the tile is looked up again with every reload. */
  protected readonly openKey = signal<string | null>(null);
  protected readonly shows = computed(() => ({
    quests: this.part() === 'all' || this.part() === 'quests',
    glossary: this.part() === 'all' || this.part() === 'glossary',
    group: this.part() === 'all' || this.part() === 'group',
  }));
  /** Main quests first, in the order of their numbers, then the side quests. */
  protected readonly quests = computed(() =>
    [...this.view().quests].sort((a, b) => Number(b.main) - Number(a.main) || (a.number ?? Infinity) - (b.number ?? Infinity)),
  );
  /** The parts of the glossary that have something in them, each with its tiles. */
  protected readonly sections = computed(() => {
    const entries = this.view().glossary;
    const parts = PARTS.map((part) => ({ ...part, cards: entries.filter((entry) => entry.kind === part.kind && !isItem(entry)).map(entryCard) }));
    const items = { kind: 'trivia' as const, label: 'Gegenstände', icon: 'gift' as const, cards: this.items().map(itemCard) };
    return [...parts, items].filter((part) => part.cards.length);
  });
  protected readonly openQuest = computed(() => this.quests().find((quest) => `quest:${quest.id}` === this.openKey()) ?? null);
  protected readonly openCard = computed(() => this.sections().flatMap((part) => part.cards).find((card) => card.key === this.openKey()) ?? null);

  /** What the group carries, one item per name, together with the revealed items of the world nobody carries. */
  private readonly items = computed<CarriedItem[]>(() => {
    const revealed = this.view().glossary.filter(isItem);
    const carried = carriedItems(this.view().equipment, revealed);
    const loose = revealed.filter((entry) => !carried.some((item) => item.entry === entry));
    return [...carried, ...loose.map((entry) => ({ name: entry.name, text: entry.description, owners: [], hidden: false, entry }))];
  });

  /** How a quest is called: its kind with its number, and whether it is done. */
  protected kicker(quest: SharedQuest): string {
    return questLabel({ kind: quest.main ? 'main' : 'side', number: quest.number }) + (quest.done ? ' · erledigt' : '');
  }

  /** How many steps of a quest are checked. */
  protected stepsDone(quest: SharedQuest): number {
    return quest.checklist.filter((step) => step.done).length;
  }
}

function entryCard(entry: SharedEntry): Card {
  const fallback = PARTS.find((part) => part.kind === entry.kind)?.icon ?? 'note';
  return {
    key: `${entry.kind}:${entry.id}`, kicker: entry.category, title: entry.name, text: entry.description,
    symbol: entry.symbol, fallback, entry, item: null,
  };
}

function itemCard(item: CarriedItem): Card {
  const owners = item.owners.length ? `Getragen von ${item.owners.join(', ')}` : 'Gegenstand';
  return {
    key: `item:${item.name.toLowerCase()}`, kicker: owners + (item.hidden ? ' · versteckt' : ''), title: item.name, text: item.text,
    symbol: item.entry?.symbol ?? '', fallback: 'gift', entry: item.entry, item,
  };
}

/** Group the lines of all inventories by the name of the item; a line knows its entry by id, or by its name. */
function carriedItems(lines: EquipmentLine[], revealed: SharedEntry[]): CarriedItem[] {
  const items: CarriedItem[] = [];
  for (const line of lines) {
    const known = items.find((item) => item.name.toLowerCase() === line.name.toLowerCase());
    const entry = revealed.find((other) => other.id === line.item || other.name.toLowerCase() === line.name.toLowerCase()) ?? null;
    const text = [line.description, damageText(line)].filter(Boolean).join(' · ');
    const item = known ?? { name: line.name, text: text || (entry?.description ?? ''), owners: [], hidden: true, entry };
    item.owners = item.owners.includes(line.owner) ? item.owners : [...item.owners, line.owner];
    item.hidden = item.hidden && line.hidden;
    if (!known) {
      items.push(item);
    }
  }
  return items;
}
