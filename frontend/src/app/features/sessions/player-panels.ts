import { Component, computed, input } from '@angular/core';

import { PlayerView, SessionEntryKind } from '../../core/session-models';

const KIND_LABELS: Record<SessionEntryKind, string> = {
  scene: 'Szene',
  quest: 'Quest',
  event: 'Ereignis',
  location: 'Ort',
  npc: 'Figur',
  trivia: 'Wissen',
};

/**
 * What the players of a session see: the quests shared with them, their glossary and the group.
 * The game master shows the same to check what he has revealed.
 */
@Component({
  selector: 'app-player-panels',
  templateUrl: './player-panels.html',
})
export class PlayerPanels {
  readonly view = input.required<PlayerView>();
  /** Which part is shown; the game master looks at all of them at once. */
  readonly part = input<'quests' | 'glossary' | 'group' | 'all'>('all');

  protected readonly labels = KIND_LABELS;
  /** Main quests first, in the order of their numbers, then the side quests. */
  protected readonly quests = computed(() =>
    [...this.view().quests].sort((a, b) => Number(b.main) - Number(a.main) || (a.number ?? Infinity) - (b.number ?? Infinity)),
  );
  protected readonly shows = computed(() => ({
    quests: this.part() === 'all' || this.part() === 'quests',
    glossary: this.part() === 'all' || this.part() === 'glossary',
    group: this.part() === 'all' || this.part() === 'group',
  }));
}
