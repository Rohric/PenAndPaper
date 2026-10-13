import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Skill, TALENTS, Talent } from '../../core/models';
import { inspirationPoints, skillValue, talentValue } from '../../core/rules';

const MAX_BASE_POINTS = 100;

/** Edit the skills of a character, grouped by the three talents, with the values calculated live. */
@Component({
  selector: 'app-skill-editor',
  imports: [FormsModule],
  templateUrl: './skill-editor.html',
  styleUrl: './skill-editor.scss',
})
export class SkillEditor {
  readonly skills = input.required<Skill[]>();
  readonly skillsChange = output<Skill[]>();

  /** One block per talent: its values and its skills with their place in the full list. */
  protected readonly groups = computed(() => TALENTS.map((talent) => this.group(talent.id, talent.label)));

  /** Append an empty skill to a talent. */
  protected add(talent: Talent): void {
    this.skillsChange.emit([...this.skills(), { name: '', talent, points: 0, bonus_points: 0, description: '' }]);
  }

  /** Change text fields of one skill. */
  protected change(index: number, changes: Partial<Skill>): void {
    this.skillsChange.emit(this.skills().map((skill, i) => (i === index ? { ...skill, ...changes } : skill)));
  }

  /** Change the base points; they stay between 0 and 100. */
  protected setPoints(index: number, value: number | null): void {
    this.change(index, { points: Math.min(MAX_BASE_POINTS, this.whole(value)) });
  }

  /** Change the bonus points gained by leveling. */
  protected setBonus(index: number, value: number | null): void {
    this.change(index, { bonus_points: this.whole(value) });
  }

  /** Remove one skill. */
  protected remove(index: number): void {
    this.skillsChange.emit(this.skills().filter((_, i) => i !== index));
  }

  private whole(value: number | null): number {
    return Math.max(0, Math.floor(value ?? 0));
  }

  private group(talent: Talent, label: string) {
    const skills = this.skills();
    const rows = skills
      .map((skill, index) => ({ skill, index, value: skillValue(skill, skills) }))
      .filter((row) => row.skill.talent === talent);
    return { talent, label, rows, value: talentValue(skills, talent), inspiration: inspirationPoints(skills, talent) };
  }
}
