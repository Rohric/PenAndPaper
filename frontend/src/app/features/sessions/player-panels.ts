import { Component, computed, input, output, signal } from '@angular/core';

import { questLabel } from '../../core/models';
import { damageText } from '../../core/rules';
import {
  EquipmentLine, PlayerView, QUEST_STATUSES, QuestLog, SessionEntryKind, SharedEntry, SharedQuest, questStatus,
} from '../../core/session-models';
import { Icon, IconName } from '../../shared/icon';
import { Portrait } from '../../shared/portrait';
import { SidePanel } from '../../shared/side-panel';
import { tagColour } from '../../shared/tag-colour';
import { QuestLogView } from './quest-log';

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
  /** The kind whose colour the tile shows. */
  tone: string;
  entry: SharedEntry | null;
  item: CarriedItem | null;
}

const ITEM_CATEGORY = 'gegenstand';
const NOTHING_MORE = 'Mehr wisst ihr noch nicht.';
const PARTS: { kind: SessionEntryKind; label: string; icon: IconName; tone: string }[] = [
  { kind: 'location', label: 'Orte', icon: 'pin', tone: 'locations' },
  { kind: 'npc', label: 'Figuren', icon: 'sheet', tone: 'npcs' },
  { kind: 'event', label: 'Ereignisse', icon: 'flag', tone: 'events' },
  { kind: 'trivia', label: 'Wissen', icon: 'note', tone: 'trivia' },
];

const isItem = (entry: SharedEntry) => entry.kind === 'trivia' && entry.category.trim().toLowerCase() === ITEM_CATEGORY;

/**
 * What the players of a session see: their quest log, their glossary with what the group carries,
 * and the group. Everything is a tile; a click opens it in a window at the side with all the group
 * knows. In the quest log the group writes its own notes, tags and points. The game master shows
 * the same page, read only, to check what he has revealed.
 */
@Component({
  selector: 'app-player-panels',
  imports: [Icon, Portrait, SidePanel, QuestLogView],
  templateUrl: './player-panels.html',
})
export class PlayerPanels {
  readonly view = input.required<PlayerView>();
  /** Which part is shown; the game master looks at all of them at once. */
  readonly part = input<'quests' | 'glossary' | 'group' | 'all'>('all');
  /** Whether the reader can write into the quest log; the game master only looks here. */
  readonly editable = input(false);
  /** Fired with the log of a quest after the group changed it. */
  readonly logChange = output<{ quest: number; log: QuestLog }>();
  /** Fired with all checked points of a quest after one was checked or unchecked. */
  readonly stepsChange = output<{ quest: number; steps: number[] }>();

  protected readonly nothingMore = NOTHING_MORE;
  protected readonly colourOf = tagColour;
  /** Key of the tile that is open at the side; the tile is looked up again with every reload. */
  protected readonly openKey = signal<string | null>(null);
  protected readonly shows = computed(() => ({
    quests: this.part() === 'all' || this.part() === 'quests',
    glossary: this.part() === 'all' || this.part() === 'glossary',
    group: this.part() === 'all' || this.part() === 'group',
  }));
  /** Main quests first, in the order of their numbers, then the side quests. */
  private readonly quests = computed(() =>
    [...this.view().quests].sort((a, b) => Number(b.main) - Number(a.main) || (a.number ?? Infinity) - (b.number ?? Infinity)),
  );
  /** The quest log in its three parts: running, open and finished; an empty part is left out. */
  protected readonly questGroups = computed(() =>
    QUEST_STATUSES.map((status) => ({ ...status, quests: this.quests().filter((quest) => questStatus(quest) === status.id) })).filter(
      (group) => group.quests.length,
    ),
  );
  /** The parts of the glossary that have something in them, each with its tiles. */
  protected readonly sections = computed(() => {
    const entries = this.view().glossary;
    const parts = PARTS.map((part) => ({ ...part, cards: entries.filter((entry) => entry.kind === part.kind && !isItem(entry)).map(entryCard) }));
    const items = { kind: 'trivia' as const, label: 'Gegenstände', icon: 'gift' as const, tone: 'items', cards: this.items().map(itemCard) };
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

  /** How a quest is called: its kind with its number. */
  protected kicker(quest: SharedQuest): string {
    return questLabel({ kind: quest.main ? 'main' : 'side', number: quest.number });
  }

  /** How many of the shown points of a quest are checked. */
  protected stepsDone(quest: SharedQuest): number {
    return quest.checklist.filter((step) => step.done).length;
  }

  /** Check or uncheck a point of the game master and hand on all checked points of the quest. */
  protected toggleStep(quest: SharedQuest, position: number): void {
    const done = quest.checklist.filter((step) => step.done).map((step) => step.position);
    const steps = done.includes(position) ? done.filter((other) => other !== position) : [...done, position];
    this.stepsChange.emit({ quest: quest.id, steps });
  }
}

function entryCard(entry: SharedEntry): Card {
  const part = PARTS.find((other) => other.kind === entry.kind);
  return {
    key: `${entry.kind}:${entry.id}`, kicker: entry.category, title: entry.name, text: entry.happening || entry.description,
    symbol: entry.symbol, fallback: part?.icon ?? 'note', tone: part?.tone ?? 'trivia', entry, item: null,
  };
}

function itemCard(item: CarriedItem): Card {
  const owners = item.owners.length ? `Getragen von ${item.owners.join(', ')}` : 'Gegenstand';
  return {
    key: `item:${item.name.toLowerCase()}`, kicker: owners + (item.hidden ? ' · versteckt' : ''), title: item.name, text: item.text,
    symbol: item.entry?.symbol ?? '', fallback: 'gift', tone: 'items', entry: item.entry, item,
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
