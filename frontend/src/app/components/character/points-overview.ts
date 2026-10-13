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
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .line {
      display: grid;
      grid-template-columns: 96px 1fr auto;
      gap: 8px;
      align-items: center;
    }

    .line__label {
      font-size: 13px;
      font-weight: 600;
      color: var(--soft);
    }

    .talent-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .talent-card {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      padding: 8px 10px;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      background: var(--surface);
    }

    .talent-card__name {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .talent-card__value {
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 700;
      line-height: 1;
      color: var(--accent);
    }

    .talent-cards--compact .talent-card {
      padding: 4px 8px;
    }

    .talent-cards--compact .talent-card__value {
      font-size: 20px;
    }

    .talent-cards--compact .soft,
    .talent-cards--compact .chip {
      display: none;
    }
  `,
})
export class PointsOverview {
  readonly skills = input.required<Skill[]>();
  readonly budgets = input.required<Budgets>();
  /** Whether bonus points are paid by the tiers of the leveling rule (player characters). */
  readonly leveling = input(false);
  /** Spent inspiration points; only a player character has them. */
  readonly used = input<Partial<Record<Talent, number>> | undefined>(undefined);
  /** A smaller version for under a bar. */
  readonly compact = input(false);

  protected readonly lines = computed(() => {
    const { base, bonus } = this.budgets();
    const baseLeft = basePointsLeft(this.skills(), base);
    const bonusLeft = bonusPointsLeft(this.skills(), bonus, this.leveling());
    return [
      { label: 'Grundpunkte', left: baseLeft, percent: this.percent(base - baseLeft, base) },
      { label: 'Bonuspunkte', left: bonusLeft, percent: this.percent(bonus - bonusLeft, bonus) },
    ];
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
