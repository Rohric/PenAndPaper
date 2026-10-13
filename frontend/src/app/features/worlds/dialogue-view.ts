import { Component, inject, input } from '@angular/core';

import { Dialogue } from '../../core/models';
import { WorldStore } from './world-store';

/** Read what is said in a scene, a quest or an event: every conversation as a block, every line with who says it. */
@Component({
  selector: 'app-dialogue-view',
  template: `
    @if (dialogues().length) {
      <div class="field">
        <span class="label">Dialoge</span>
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
      </div>
    }
  `,
  styles: `
    // One conversation: its lines hang on a line at the left, so it reads as one block.
    .talk {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 4px 0 4px 12px;
      border-left: 3px solid var(--line-2);
    }

    .speaker {
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--info);
      font-weight: 600;
    }
  `,
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
      this.store.peek.set({ kind: 'npcs', id: npc });
    }
  }
}
