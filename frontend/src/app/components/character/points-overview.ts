import { Component, computed, input } from '@angular/core';

import { Skill, TALENTS, Talent } from '../../core/models';
import { Budgets, bonusPointsLeft, creditLeft } from '../../core/house-rules';
import { basePointsLeft, inspirationLeft, inspirationPoints, talentValue } from '../../core/rules';

/**
 * The points of a character at a glance: how much of the base points and the bonus points is spent,
 * and for each talent its value, its inspiration points and the credit it has. Compact it fits under a bar.
 */
@Component({
  selector: 'app-points-overview',
  template: `
    @for (line of lines(); track line.label) {
      <div class="line">
        <span class="line__label">{{ line.label }}</span>
        <span class="meter" [class.meter--over]="line.left < 0"><span class="meter__fill" [style.width.%]="line.percent"></span></span>
        <span class="chip" [class.chip--danger]="line.left < 0">{{ line.left < 0 ? -line.left + ' zu viel' : line.left + ' übrig' }}</span>
      </div>
    }
    <div class="talent-cards" [class.talent-cards--compact]="compact()">
      @for (talent of talents(); track talent.id) {
        <div class="talent-card">
          <span class="talent-card__name">{{ talent.label }}</span>
          <span class="talent-card__value">{{ talent.value }}</span>
          <span class="soft">Geistesblitz {{ talent.left }}/{{ talent.inspiration }}</span>
          @if (talent.credit) {
            <span class="chip chip--danger">Guthaben {{ talent.credit }}</span>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './points-overview.scss',
})
export class PointsOverview {
  readonly skills = input.required<Skill[]>();
  readonly budgets = input.required<Budgets>();
  /** Whether bonus points are paid by the tiers of the leveling rule (player characters). */
  readonly leveling = input(false);
  /** Spent inspiration points; only a player character has them. */
  readonly used = input<Partial<Record<Talent, number>> | undefined>(undefined);
  /** Whether the bar of the bonus points is shown; the creation of a player character knows only base points. */
  readonly bonus = input(true);
  /** A smaller version for under a bar. */
  readonly compact = input(false);

  protected readonly lines = computed(() => {
    const { base, bonus } = this.budgets();
    const baseLeft = basePointsLeft(this.skills(), base);
    const bonusLeft = bonusPointsLeft(this.skills(), bonus, this.leveling());
    const lines = [{ label: 'Grundpunkte', left: baseLeft, percent: this.percent(base - baseLeft, base) }];
    return this.bonus() ? [...lines, { label: 'Bonuspunkte', left: bonusLeft, percent: this.percent(bonus - bonusLeft, bonus) }] : lines;
  });
  protected readonly talents = computed(() => {
    const credit = this.leveling() ? creditLeft(this.skills()) : undefined;
    return TALENTS.map((talent) => ({
      id: talent.id,
      label: talent.label,
      value: talentValue(this.skills(), talent.id),
      inspiration: inspirationPoints(this.skills(), talent.id),
      left: inspirationLeft(this.skills(), talent.id, this.used()),
      credit: credit?.[talent.id] ?? 0,
    }));
  });

  private percent(spent: number, total: number): number {
    return total > 0 ? Math.min(100, Math.max(0, (spent / total) * 100)) : 0;
  }
}
