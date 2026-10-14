import { Component, computed, inject, linkedSignal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Icon } from '../../components/basic/icon';
import { bonusPointsLeft } from '../../core/house-rules';
import { PlayerCharacter, TALENTS } from '../../core/models';
import { inspirationLeft, inspirationPoints } from '../../core/rules';
import { SessionStore } from '../../core/session-store';
import { ToastService } from '../../global/toast/toast.service';

/** What "Allen +10" adds to every field. */
export const STEP_ALL = 10;

/** One character in the form: what it has free and how many inspiration points it has left. */
interface Row {
  id: number;
  name: string;
  player: string;
  free: number;
  sparksLeft: number;
  sparks: number;
}

/** The inspiration points of a character over all three talents: left and in all. */
function sparksOf(character: PlayerCharacter): { left: number; total: number } {
  const total = TALENTS.reduce((sum, talent) => sum + inspirationPoints(character.skills, talent.id), 0);
  const left = TALENTS.reduce((sum, talent) => sum + inspirationLeft(character.skills, talent.id, character.inspiration_used), 0);
  return { left, total };
}

/**
 * LvUp: give the characters of the group bonus points, one by one or to all at once, and fill up their
 * inspiration points, for one character or the whole group. Every success shows a message on top.
 */
@Component({
  selector: 'app-level-up-form',
  imports: [FormsModule, Icon],
  templateUrl: './level-up-form.html',
  styleUrl: './level-up-form.scss',
})
export class LevelUpForm {
  private readonly store = inject(SessionStore);
  private readonly toast = inject(ToastService);

  protected readonly rows = computed<Row[]>(() =>
    this.store.characters().map((character) => {
      const sparks = sparksOf(character);
      const free = bonusPointsLeft(character.skills, character.bonus_points_total, true);
      return { id: character.id, name: character.name, player: character.player, free, sparksLeft: sparks.left, sparks: sparks.total };
    }),
  );
  /** Who is in the group; the typed points only start over when that changes, not with every reload. */
  private readonly group = computed(() => this.store.characters().map((character) => character.id).join(','));
  protected readonly points = linkedSignal<string, Record<number, number>>({
    source: this.group,
    computation: () => this.zero(),
  });
  protected readonly anyPoints = computed(() => Object.values(this.points()).some((value) => value > 0));
  protected readonly anyUsed = computed(() => this.rows().some((row) => row.sparksLeft < row.sparks));

  /** Set the points of one character; empty or negative input counts as 0. */
  protected set(id: number, value: number | null): void {
    this.points.update((points) => ({ ...points, [id]: Math.max(0, Math.floor(value ?? 0)) }));
  }

  /** Add to the points of every character. */
  protected addToAll(step = STEP_ALL): void {
    this.points.update((points) => Object.fromEntries(Object.entries(points).map(([id, value]) => [id, value + step])));
  }

  /** Set every field back to 0. */
  protected clear(): void {
    this.points.set(this.zero());
  }

  /** Give everybody with more than 0 points their points; the fields start over afterwards. */
  protected give(): void {
    const given = Object.fromEntries(Object.entries(this.points()).filter(([, value]) => value > 0));
    const names = this.rows().filter((row) => given[row.id]).map((row) => `${row.name} +${given[row.id]}`);
    this.store.level(given, () => {
      this.toast.show(`Bonuspunkte gegeben: ${names.join(', ')}`, 'reward');
      this.clear();
    });
  }

  /** Give one character, or the whole group when no row is named, all their inspiration points back. */
  protected refill(row: Row | null): void {
    this.store.refillInspiration(row ? [row.id] : [], () => this.toast.show(`Geistesblitz aufgefüllt: ${row ? row.name : 'ganze Gruppe'}`, 'reward'));
  }

  private zero(): Record<number, number> {
    return Object.fromEntries(untracked(this.store.characters).map((character) => [character.id, 0]));
  }
}
