import { Component, computed, input, linkedSignal, output, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PlayerCharacter } from '../../core/models';

const DEFAULT_BONUS = 10;

/**
 * Close a chapter: every character of the group gets bonus points to level with.
 * Each one starts with the usual 10 and can get its own number.
 */
@Component({
  selector: 'app-chapter-close-form',
  imports: [FormsModule],
  template: `
    <form class="stack" (ngSubmit)="close.emit(points())">
      <p class="soft">Jeder Charakter bekommt Bonuspunkte zum Steigern, üblich sind 10. Danach beginnt das nächste Kapitel.</p>
      @for (character of characters(); track character.id) {
        <div class="field">
          <label [for]="'bonus-' + character.id">{{ character.name }} <span class="soft">({{ character.player }})</span></label>
          <input
            class="input input--number"
            type="number"
            min="0"
            [id]="'bonus-' + character.id"
            [name]="'bonus-' + character.id"
            [ngModel]="points()[character.id]"
            (ngModelChange)="set(character.id, $event)"
          />
        </div>
      } @empty {
        <p class="soft">Noch kein Charakter in der Runde.</p>
      }
      <div class="row">
        <button type="submit" class="btn btn--primary">Kapitel abschließen</button>
      </div>
    </form>
  `,
})
export class ChapterCloseForm {
  readonly characters = input.required<PlayerCharacter[]>();
  /** Fired with the bonus points of every character, named by character id. */
  readonly close = output<Record<number, number>>();

  /** Who is in the group; the typed points only start over when that changes, not with every reload. */
  private readonly group = computed(() => this.characters().map((character) => character.id).join(','));
  protected readonly points = linkedSignal<string, Record<number, number>>({
    source: this.group,
    computation: () => Object.fromEntries(untracked(this.characters).map((character) => [character.id, DEFAULT_BONUS])),
  });

  /** Set the points of one character; empty or negative input counts as 0. */
  protected set(characterId: number, value: number | null): void {
    this.points.update((points) => ({ ...points, [characterId]: Math.max(0, Math.floor(value ?? 0)) }));
  }
}
