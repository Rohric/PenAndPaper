import { Component, computed, input, output, signal } from '@angular/core';

import { AnyCharacter, Skill, TALENTS } from '../../core/models';
import { damageText, inspirationPoints, skillValue, talentValue } from '../../core/rules';
import { Icon } from '../basic/icon';
import { Portrait } from '../basic/portrait';
import { EditorSection } from './character-editor';
import { PointsOverview } from './points-overview';

/** A check a player wants to roll: what it is on and the value to roll against. */
export interface RollWish {
  label: string;
  value: number;
  /** The talent the check belongs to. */
  talent?: string;
}

/**
 * The character sheet to read: master data, talents with their values, skills with the value
 * they are rolled against, inventory, weapons and special abilities.
 */
@Component({
  selector: 'app-character-sheet',
  imports: [Icon, Portrait, PointsOverview],
  templateUrl: './character-sheet.html',
  styleUrl: './character-sheet.scss',
})
export class CharacterSheet {
  readonly character = input.required<AnyCharacter>();
  /** Whether talents and skills are buttons that ask for a roll. */
  readonly rollable = input(false);
  readonly roll = output<RollWish>();
  /** Whether pencils lead from the parts of the sheet to the editor. */
  readonly editable = input(false);
  readonly edit = output<EditorSection>();

  protected readonly sortBy = signal<'list' | 'value' | 'name'>('list');
  protected readonly query = signal('');

  protected readonly facts = computed(() => {
    const character = this.character();
    return [character.age && `Alter ${character.age}`, character.gender].filter(Boolean).join(' · ');
  });
  protected readonly budgets = computed(() => ({ base: this.character().skill_points_total, bonus: this.character().bonus_points_total }));
  private readonly isPlayer = computed(() => this.character().backstory !== undefined);
  /** The house rules (tiers, credit) count for a player character while it plays in an adventure. */
  protected readonly leveling = computed(() => this.isPlayer() && !!this.character().adventure);
  /** Bonus points are shown for NPCs and in an adventure; the creation of a player character knows only base points. */
  protected readonly bonus = computed(() => !this.isPlayer() || this.leveling());
  protected readonly lifePercent = computed(() => {
    const { life_points, max_life_points } = this.character();
    return max_life_points ? Math.min(100, Math.max(0, (life_points / max_life_points) * 100)) : 0;
  });
  /** The three talents, each with its value, its inspiration points and its skills. */
  protected readonly talents = computed(() => {
    const skills = this.character().skills;
    return TALENTS.map((talent) => ({
      id: talent.id,
      label: talent.label,
      value: talentValue(skills, talent.id),
      inspiration: inspirationPoints(skills, talent.id),
      skills: this.arranged(skills.filter((skill) => skill.talent === talent.id)),
    }));
  });
  protected readonly damage = damageText;

  private arranged(skills: Skill[]): Skill[] {
    const query = this.query().trim().toLowerCase();
    const found = skills.filter((skill) => skill.name.toLowerCase().includes(query));
    switch (this.sortBy()) {
      case 'value':
        return [...found].sort((a, b) => this.valueOf(b) - this.valueOf(a));
      case 'name':
        return [...found].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return found;
    }
  }

  /** The value a skill is rolled against. */
  protected valueOf(skill: Skill): number {
    return skillValue(skill, this.character().skills);
  }
}
