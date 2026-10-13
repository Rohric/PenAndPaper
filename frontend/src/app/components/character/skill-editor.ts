import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Skill, TALENTS, Talent } from '../../core/models';
import { SkillProblem, nextCost, nextCreditCost, refund } from '../../core/house-rules';
import { MAX_SKILL_VALUE, inspirationPoints, rawValue, skillValue, talentValue } from '../../core/rules';
import { Icon } from '../basic/icon';

const MAX_BASE_POINTS = 100;

/**
 * Edit the skills of a character, one card per talent. Every skill has its base points, its bonus points
 * and its credit, each counter with a minus and a plus and a colour of its own, the value it is rolled against, and the messages of the
 * rules directly below it. While the character plays in an adventure its base points are locked.
 */
@Component({
  selector: 'app-skill-editor',
  imports: [FormsModule, Icon],
  templateUrl: './skill-editor.html',
  styleUrl: './skill-editor.scss',
})
export class SkillEditor {
  readonly skills = input.required<Skill[]>();
  /** The skills as they were saved. */
  readonly stored = input<Skill[]>([]);
  /** Whether the character plays in an adventure, so its base points are fixed. */
  readonly locked = input(false);
  /** Whether the house rules count: bonus points cost by tiers and a talent can have credit. Only in an adventure. */
  readonly leveling = input(false);
  /** Whether the counter of the bonus points is shown; the creation of a player character knows only base points. */
  readonly bonus = input(true);
  /** The open credit of each talent; only a player character has it. */
  readonly credit = input<Record<Talent, number> | undefined>(undefined);
  readonly problems = input<SkillProblem[]>([]);
  readonly hints = input<{ index: number; text: string }[]>([]);
  readonly skillsChange = output<Skill[]>();

  protected readonly maxValue = MAX_SKILL_VALUE;
  /** The skill the user tapped last; it explains what its talent's credit can do there. */
  protected readonly active = signal<number | null>(null);
  /** One block per talent: its values and its skills with their place in the full list. */
  protected readonly groups = computed(() => TALENTS.map((talent) => this.group(talent.id, talent.label)));
  /** Problems that belong to no single skill, like too many points spent. */
  protected readonly general = computed(() => this.problems().filter((problem) => problem.index === null));

  /** Append an empty skill to a talent. */
  protected add(talent: Talent): void {
    this.skillsChange.emit([...this.skills(), { name: '', talent, points: 0, bonus_points: 0, credit_points: 0, description: '' }]);
  }

  /** Change fields of one skill. */
  protected change(index: number, changes: Partial<Skill>): void {
    this.skillsChange.emit(this.skills().map((skill, i) => (i === index ? { ...skill, ...changes } : skill)));
  }

  /** Set the base points; they stay between 0 and 100 and never below what is fixed. */
  protected setPoints(index: number, value: number | null): void {
    this.change(index, { points: Math.min(MAX_BASE_POINTS, Math.max(this.fixed(index), this.whole(value))) });
  }

  /** Set the points won by leveling. */
  protected setBonus(index: number, value: number | null): void {
    this.change(index, { bonus_points: Math.min(MAX_BASE_POINTS, this.whole(value)) });
  }

  /** Set the points bought with credit. */
  protected setCredit(index: number, value: number | null): void {
    this.change(index, { credit_points: Math.min(MAX_BASE_POINTS, this.whole(value)) });
  }

  /** Move the points bought with credit by a step. */
  protected stepCredit(index: number, step: number): void {
    this.setCredit(index, (this.skills()[index].credit_points ?? 0) + step);
  }

  /** Move the base points by a step. */
  protected stepPoints(index: number, step: number): void {
    this.setPoints(index, this.skills()[index].points + step);
  }

  /** Move the points won by leveling by a step. */
  protected stepBonus(index: number, step: number): void {
    this.setBonus(index, this.skills()[index].bonus_points + step);
  }

  /** Whether a skill can be removed: not when it keeps base points in an adventure. */
  protected removable(index: number): boolean {
    return !this.locked() || this.fixed(index) === 0;
  }

  /** Remove one skill. */
  protected remove(index: number): void {
    this.skillsChange.emit(this.skills().filter((_, i) => i !== index));
  }

  /** The base points a skill must keep, because they were saved while the character plays in an adventure. */
  protected fixed(index: number): number {
    const id = this.skills()[index]?.id;
    return this.locked() && id !== undefined ? (this.stored().find((old) => old.id === id)?.points ?? 0) : 0;
  }

  /** What the next point won by leveling costs. */
  protected cost(skill: Skill): number {
    return nextCost(skill);
  }

  /** What the next point bought with credit costs. */
  protected creditPrice(skill: Skill): number {
    return nextCreditCost(skill);
  }

  /** What the credit of the talent means for the skill the user tapped; empty when it has none. */
  private creditNote(skill: Skill, label: string): { text: string; usable: boolean } | null {
    const credit = this.credit()?.[skill.talent] ?? 0;
    if (credit <= 0) {
      return null;
    }
    const own = `Du hast ${credit} ${credit === 1 ? 'Punkt' : 'Punkte'} Guthaben in ${label}.`;
    if (rawValue(skill, this.skills()) >= MAX_SKILL_VALUE) {
      return { text: `${own} „${skill.name || 'Die Fähigkeit'}“ ist bei ${MAX_SKILL_VALUE}. Setz das Guthaben bei einer anderen Fähigkeit in ${label} ein.`, usable: false };
    }
    const price = nextCreditCost(skill);
    return credit >= price
      ? { text: `${own} Hier kannst du es einsetzen: +1 kostet ${price} Guthaben.`, usable: true }
      : { text: `${own} Für +1 hier brauchst du ${price} Guthaben.`, usable: false };
  }

  private whole(value: number | null): number {
    return Math.max(0, Math.floor(value ?? 0));
  }

  private group(talent: Talent, label: string) {
    const skills = this.skills();
    const rows = skills
      .map((skill, index) => ({
        skill,
        index,
        value: skillValue(skill, skills),
        capped: rawValue(skill, skills) > MAX_SKILL_VALUE,
        fixed: this.fixed(index),
        earned: skill.bonus_points + (skill.credit_points ?? 0),
        problems: this.problems().filter((problem) => problem.index === index),
        hints: this.hints().filter((hint) => hint.index === index),
        note: this.active() === index ? this.creditNote(skill, label) : null,
        showCredit: this.leveling() && (refund(skills, talent) > 0 || (skill.credit_points ?? 0) > 0),
        creditBlocked: (this.credit()?.[talent] ?? 0) < nextCreditCost(skill) || rawValue(skill, skills) >= MAX_SKILL_VALUE,
      }))
      .filter((row) => row.skill.talent === talent);
    const credit = this.credit()?.[talent] ?? 0;
    return { talent, label, rows, credit, value: talentValue(skills, talent), inspiration: inspirationPoints(skills, talent) };
  }
}
