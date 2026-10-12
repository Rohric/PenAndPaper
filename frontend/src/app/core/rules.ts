import { InventoryItem, Skill, Talent } from './models';

/**
 * Rule calculations for How to be a Hero, mirrored from the backend
 * (character_app/utils.py) so the editor can show values while typing.
 * Base points and bonus points always count together.
 */

/** Round to the nearest whole number, with .5 always going up. */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/** Base points plus bonus points of one skill. */
export function skillPoints(skill: Skill): number {
  return skill.points + skill.bonus_points;
}

/** Talent value: a tenth of all skill points of the talent. */
export function talentValue(skills: Skill[], talent: Talent): number {
  const points = skills.filter((skill) => skill.talent === talent).reduce((sum, skill) => sum + skillPoints(skill), 0);
  return roundHalfUp(points / 10);
}

/** Value a skill is rolled against: its points plus the talent value. */
export function skillValue(skill: Skill, skills: Skill[]): number {
  return skillPoints(skill) + talentValue(skills, skill.talent);
}

/** Inspiration points of a talent: a tenth of the talent value. */
export function inspirationPoints(skills: Skill[], talent: Talent): number {
  return roundHalfUp(talentValue(skills, talent) / 10);
}

/** Unspent base points of the creation budget. */
export function basePointsLeft(skills: Skill[], total: number): number {
  return total - skills.reduce((sum, skill) => sum + skill.points, 0);
}

/** Unspent bonus points of the leveling budget. */
export function bonusPointsLeft(skills: Skill[], total: number): number {
  return total - skills.reduce((sum, skill) => sum + skill.bonus_points, 0);
}

/** Damage of a weapon as text, for example "5W10 + 2"; empty for other items. */
export function damageText(item: InventoryItem): string {
  if (item.damage_dice <= 0) {
    return '';
  }
  return `${item.damage_dice}W10` + (item.damage_bonus ? ` + ${item.damage_bonus}` : '');
}
