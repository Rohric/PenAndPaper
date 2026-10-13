import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Status } from '../../core/session-models';
import { Icon } from '../basic/icon';
import { Portrait, PortraitState } from '../basic/portrait';

/** One combatant on the timeline of a battle. */
export interface TimelineEntry {
  id: number;
  name: string;
  symbol: string;
  isPlayer: boolean;
  initiative: number;
  /** Whether the combatant cannot act anymore. */
  out: boolean;
  statuses: Status[];
}

/** A status that is given with one click. */
interface Preset {
  name: string;
  skips: boolean;
}

const PRESETS: Preset[] = [
  { name: 'gefroren', skips: true },
  { name: 'betäubt', skips: true },
  { name: 'vergiftet', skips: false },
  { name: 'brennt', skips: false },
];
/** The colour a portrait takes for a status; every other status only marks it. */
const STATES: Record<string, PortraitState> = { gefroren: 'frozen', betäubt: 'frozen', vergiftet: 'poisoned', brennt: 'burning' };

/**
 * The order of a battle as a line of portraits: who is on turn, who comes next, who sits out and
 * who is out of the fight. The colour of a portrait shows a status. The game master clicks a
 * portrait to give or take statuses, like "gefroren" for two turns, which makes the combatant sit out.
 */
@Component({
  selector: 'app-battle-timeline',
  imports: [FormsModule, Icon, Portrait],
  templateUrl: './battle-timeline.html',
  styleUrl: './battle-timeline.scss',
})
export class BattleTimeline {
  /** The combatants in the order of their initiative. */
  readonly entries = input.required<TimelineEntry[]>();
  /** Id of the combatant whose turn it is. */
  readonly current = input<number | null>(null);
  /** Whether statuses can be given and taken here; players only watch. */
  readonly editable = input(false);
  /** Asks to set the statuses of a combatant. */
  readonly statuses = output<{ id: number; statuses: Status[] }>();

  protected readonly presets = PRESETS;
  private readonly openId = signal<number | null>(null);
  /** The combatant whose statuses are being edited. */
  protected readonly opened = computed(() => this.entries().find((entry) => entry.id === this.openId()) ?? null);

  // The status that is being given.
  protected readonly name = signal('');
  protected readonly rounds = signal<number | null>(null);
  protected readonly skips = signal(false);

  /** Open or close the statuses of a combatant. */
  protected toggle(id: number): void {
    this.openId.set(this.openId() === id ? null : id);
  }

  /** Which colour the portrait of a combatant takes. */
  protected stateOf(entry: TimelineEntry): PortraitState {
    if (entry.out) {
      return 'out';
    }
    const known = entry.statuses.map((status) => STATES[status.name.toLowerCase()]).find(Boolean);
    return known ?? (entry.statuses.length ? 'marked' : entry.id === this.current() ? 'turn' : 'plain');
  }

  /** What stands below a portrait: on turn, out of the fight, or the initiative. */
  protected lineOf(entry: TimelineEntry): string {
    if (entry.out) {
      return 'kampfunfähig';
    }
    return entry.id === this.current() ? 'ist dran' : `Initiative ${entry.initiative || '–'}`;
  }

  /** A status in words: its name, the turns it lasts and whether the combatant sits out. */
  protected describe(status: Status): string {
    const turns = status.rounds ? ` ${status.rounds}` : '';
    return `${status.name}${turns}${status.skips ? ' · setzt aus' : ''}`;
  }

  /** Fill the form from a status that is given often. */
  protected usePreset(preset: Preset): void {
    this.name.set(preset.name);
    this.skips.set(preset.skips);
  }

  /** Give the typed status to the combatant; a status with the same name is replaced. */
  protected give(entry: TimelineEntry): void {
    const name = this.name().trim();
    const turns = Math.floor(this.rounds() ?? 0);
    const status: Status = { name, rounds: turns > 0 ? turns : null, skips: this.skips() };
    const others = entry.statuses.filter((other) => other.name.toLowerCase() !== name.toLowerCase());
    this.statuses.emit({ id: entry.id, statuses: [...others, status] });
    this.name.set('');
    this.rounds.set(null);
    this.skips.set(false);
  }

  /** Take one status away. */
  protected remove(entry: TimelineEntry, at: number): void {
    this.statuses.emit({ id: entry.id, statuses: entry.statuses.filter((_, index) => index !== at) });
  }
}
