import { Component, inject, input } from '@angular/core';

import { Dialogue } from '../../core/models';
import { WorldStore } from '../../core/world-store';

/**
 * Read what is said in a scene, a quest or an event: every conversation as a block, every line with who says it.
 * The reading view puts it into its section "Dialoge", which folds.
 */
@Component({
  selector: 'app-dialogue-view',
  template: `
    @for (dialogue of dialogues(); track $index) {
      <div class="talk">
        @if (dialogue.title) {
          <span class="kicker">{{ dialogue.title }}</span>
        }
        @for (line of dialogue.lines; track $index) {
          <p class="prose">
            @if (line.npc !== null) {
              <button type="button" class="speaker" (click)="lookUp(line.npc)">{{ nameOf(line.npc) }}:</button>
            }
            {{ line.text }}
          </p>
        }
      </div>
    }
  `,
  styleUrl: './dialogue-view.scss',
})
export class DialogueView {
  private readonly store = inject(WorldStore);

  readonly dialogues = input.required<Dialogue[]>();

  /** The name of a speaker; a character that was deleted is unknown. */
  protected nameOf(npc: number): string {
    return this.store.npcs().find((link) => link.npc === npc)?.name ?? 'Unbekannt';
  }

  /** Look the speaker up in the window at the side. */
  protected lookUp(npc: number | null): void {
    if (npc !== null) {
      this.store.look({ kind: 'npcs', id: npc });
    }
  }
}
