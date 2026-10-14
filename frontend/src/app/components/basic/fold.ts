import { Component, computed, effect, inject, input } from '@angular/core';

import { Folds } from '../../core/folds';
import { WorldStore } from '../../core/world-store';
import { Tool } from '../../global/tool-bar/tools.service';
import { Icon } from './icon';

/** The scope the folds of a page are remembered in: the world that is open, also in its sessions. */
export function foldScope(world: WorldStore | null): string {
  return `world:${world?.worldId() ?? 0}`;
}

/**
 * The two symbols "Alle zu" and "Alle auf" for every page with groups or sections. They reach whatever can be
 * folded on the screen right now, and are greyed out when there is nothing to do.
 */
export function foldTools(folds: Folds, scope: string): Tool[] {
  const keys = folds.shown(scope);
  const shut = keys.filter((key) => folds.isShut(scope, key)).length;
  return [
    { id: 'fold-in', word: 'Alle zu', title: 'Alles zuklappen', icon: 'fold-in', disabled: shut === keys.length, click: () => folds.set(scope, keys, true) },
    { id: 'fold-out', word: 'Alle auf', title: 'Alles aufklappen', icon: 'fold-out', disabled: shut === 0, click: () => folds.set(scope, keys, false) },
  ];
}

/**
 * A group or a section that folds at its title. The title line shows an arrow, the title and, when there is
 * something to count, the number, and a lock for what only the game master reads; folded shut only this line is
 * left. What stands before the title (like the eye of a session) does not fold. The device remembers what is folded
 * for each world.
 */
@Component({
  selector: 'app-fold',
  imports: [Icon],
  template: `
    <div class="fold__head">
      <ng-content select="[foldLead]" />
      <button type="button" class="fold__toggle" [attr.aria-expanded]="!shut()" (click)="toggle()">
        <app-icon class="fold__mark" [class.is-open]="!shut()" name="right" [size]="14" />
        @if (colour()) {
          <span class="dot" [style.--kind]="colour()"></span>
        }
        <span class="fold__title">{{ title() }}</span>
        @if (locked()) {
          <app-icon name="lock" [size]="13" />
        }
        @if (count() !== null) {
          <span class="chip fold__count">{{ count() }}</span>
        }
      </button>
    </div>
    @if (!shut()) {
      <div class="fold__body"><ng-content /></div>
    }
  `,
  styleUrl: './fold.scss',
})
export class Fold {
  private readonly folds = inject(Folds);
  private readonly world = inject(WorldStore, { optional: true });

  /** What the part is called in the memory of the device, like "read:Beschreibung"; the same key folds alike. */
  readonly key = input.required<string>();
  readonly title = input.required<string>();
  /** How many things are inside; null when there is nothing to count, like in a text. */
  readonly count = input<number | null>(null);
  /** The tone of what the part stands for, like a category; shown as a dot before the title. */
  readonly colour = input('');
  /** Whether only the game master reads the part; a lock stands behind the title. */
  readonly locked = input(false);

  private readonly scope = computed(() => foldScope(this.world));
  protected readonly shut = computed(() => this.folds.isShut(this.scope(), this.key()));

  constructor() {
    // The part reports itself while it is on the screen, so "Alle zu" and "Alle auf" reach it.
    effect((onCleanup) => onCleanup(this.folds.show(this.scope(), this.key())));
  }

  /** Fold shut or open, and remember it. */
  protected toggle(): void {
    this.folds.toggle(this.scope(), this.key());
  }
}
