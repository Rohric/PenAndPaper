import { Injectable, Signal, TemplateRef, signal } from '@angular/core';

import { IconName } from '../../components/basic/icon';
import { Slot } from '../../core/slot';

/** One symbol of the bar at the bottom: a word, a number, and what a click does. */
export interface Tool {
  id: string;
  word: string;
  /** The full name, shown as a tooltip and read out; the word under the symbol stays short. */
  title?: string;
  icon: IconName;
  /** The colour class of a kind of entry, like "kind--quests". */
  tone?: string;
  /** The number on the symbol; nothing is shown for 0 or null. */
  count?: number | null;
  /** A small dot on the symbol: something here waits for the user. */
  alert?: boolean;
  /** The symbol is a switch and is on. */
  pressed?: boolean;
  disabled?: boolean;
  /** What a click does when it opens no popup. */
  click?: () => void;
  /** What a click opens above the symbol. */
  popup?: TemplateRef<unknown>;
  popupTitle?: string;
  /** A wider popup, for tiles. */
  wide?: boolean;
  /** Anything the popup needs to know which symbol opened it; it gets the whole tool as its template variable. */
  data?: unknown;
}

/** Where in the bar a symbol stands: the same in every view, the ones of the view, or the same again on the right. */
export type ToolPart = 'always' | 'view' | 'right';

/**
 * The symbols of the bar at the bottom of the game master pages. Every page and every part of a page that has
 * tools reports them here while it is on the screen, so the middle of the bar always matches the view.
 */
@Injectable({ providedIn: 'root' })
export class Tools {
  private readonly parts: Record<ToolPart, Slot<Tool>> = { always: new Slot<Tool>(), view: new Slot<Tool>(), right: new Slot<Tool>() };
  private readonly dismissals = signal(0);
  /** Counts how often a popup was asked to close; the bar closes its popup whenever this changes. */
  readonly dismissed = this.dismissals.asReadonly();

  /** The symbols of one part of the bar, in the order they were reported. */
  of(part: ToolPart): Signal<Tool[]> {
    return this.parts[part].items;
  }

  /** Close the open popup, for example because a window at the side opens. */
  dismiss(): void {
    this.dismissals.update((count) => count + 1);
  }

  /** Report symbols. Call it in the constructor of the component; they are taken back when the component is destroyed. */
  provide(part: ToolPart, tools: Signal<Tool[]>): void {
    this.parts[part].provide(tools);
  }
}
