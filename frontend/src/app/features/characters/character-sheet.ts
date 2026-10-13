import { Component, computed, input, output } from '@angular/core';

import { AnyCharacter, Skill, TALENTS } from '../../core/models';
import { basePointsLeft, bonusPointsLeft, damageText, inspirationPoints, skillValue, talentValue } from '../../core/rules';

/** A check a player wants to roll: what it is on and the value to roll against. */
export interface RollWish {
  label: string;
  value: number;
}

/**
 * The character sheet to read: master data, talents with their values, skills with the value
 * they are rolled against, inventory, weapons and special abilities.
 */
@Component({
  selector: 'app-character-sheet',
  templateUrl: './character-sheet.html',
  styleUrl: './character-sheet.scss',
})
export class CharacterSheet {
  readonly character = input.required<AnyCharacter>();
  /** Whether talents and skills are buttons that ask for a roll. */
  readonly rollable = input(false);
  readonly roll = output<RollWish>();

  protected readonly facts = computed(() => {
    const character = this.character();
    return [character.age && `Alter ${character.age}`, character.gender].filter(Boolean).join(' · ');
  });
  protected readonly baseLeft = computed(() => basePointsLeft(this.character().skills, this.character().skill_points_total));
  protected readonly bonusLeft = computed(() => bonusPointsLeft(this.character().skills, this.character().bonus_points_total));
  /** The three talents, each with its value, its inspiration points and its skills. */
  protected readonly talents = computed(() => {
    const skills = this.character().skills;
    return TALENTS.map((talent) => ({
      label: talent.label,
      value: talentValue(skills, talent.id),
      inspiration: inspirationPoints(skills, talent.id),
      skills: skills.filter((skill) => skill.talent === talent.id),
    }));
  });
  protected readonly damage = damageText;

  /** The value a skill is rolled against. */
  protected valueOf(skill: Skill): number {
    return skillValue(skill, this.character().skills);
  }
}
