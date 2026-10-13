import { DestroyRef, Injectable, Signal, TemplateRef, computed, inject, signal } from '@angular/core';

import { IconName } from '../../shared/icon';

/** One symbol of the bar at the bottom of the cockpit: a word, a number, and what a click does. */
export interface Tool {
  id: string;
  word: string;
  icon: IconName;
  /** The colour class of a kind of entry, like "kind--quests". */
  tone?: string;
  /** The number on the symbol; nothing is shown for 0 or null. */
  count?: number | null;
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

interface Source {
  part: ToolPart;
  tools: Signal<Tool[]>;
}

/**
 * The symbols of the bar at the bottom of the cockpit. Every part of the cockpit that has tools reports them
 * here while it is on the screen and takes them back when it leaves, so the middle of the bar always matches the view.
 */
@Injectable()
export class CockpitTools {
  private readonly sources = signal<Source[]>([]);
  private readonly dismissals = signal(0);
  /** Counts how often a popup was asked to close; the bar closes its popup whenever this changes. */
  readonly dismissed = this.dismissals.asReadonly();

  /** The symbols of one part of the bar, in the order they were reported. */
  of(part: ToolPart): Signal<Tool[]> {
    return computed(() => this.sources().filter((source) => source.part === part).flatMap((source) => source.tools()));
  }

  /** Close the open popup, for example because a window at the side opens. */
  dismiss(): void {
    this.dismissals.update((count) => count + 1);
  }

  /** Report symbols. Call it in the constructor of the component; they are taken back when the component is destroyed. */
  provide(part: ToolPart, tools: Signal<Tool[]>): void {
    const source: Source = { part, tools };
    this.sources.update((all) => [...all, source]);
    inject(DestroyRef).onDestroy(() => this.sources.update((all) => all.filter((other) => other !== source)));
  }
}
