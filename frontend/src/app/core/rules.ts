import { InventoryItem, Skill, TALENTS, Talent } from './models';

/**
 * Rule calculations for How to be a Hero, mirrored from the backend
 * (character_app/utils.py) so the editor can show values while typing.
 * Base points and bonus points count together for the value of a skill, and no skill is worth
 * more than 100. The house rules of the group are in house-rules.ts.
 */

export const MAX_SKILL_VALUE = 100;

/** Round to the nearest whole number, with .5 always going up. */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/** Base points, bonus points and points bought with credit of one skill. */
export function skillPoints(skill: Skill): number {
  return skill.points + skill.bonus_points + (skill.credit_points ?? 0);
}

/** Talent value: a tenth of all skill points of the talent. */
export function talentValue(skills: Skill[], talent: Talent): number {
  const points = skills.filter((skill) => skill.talent === talent).reduce((sum, skill) => sum + skillPoints(skill), 0);
  return roundHalfUp(points / 10);
}

/** Points of a skill plus the talent value, which may be above the maximum. */
export function rawValue(skill: Skill, skills: Skill[]): number {
  return skillPoints(skill) + talentValue(skills, skill.talent);
}

/** Value a skill is rolled against: its points plus the talent value, at most 100. */
export function skillValue(skill: Skill, skills: Skill[]): number {
  return Math.min(MAX_SKILL_VALUE, rawValue(skill, skills));
}

/** Inspiration points of a talent: a tenth of the talent value. */
export function inspirationPoints(skills: Skill[], talent: Talent): number {
  return roundHalfUp(talentValue(skills, talent) / 10);
}

/** Inspiration points of a talent that are not spent yet. */
export function inspirationLeft(skills: Skill[], talent: Talent, used: Partial<Record<Talent, number>> | undefined): number {
  return Math.max(0, inspirationPoints(skills, talent) - (used?.[talent] ?? 0));
}

/** Unspent base points of the creation budget. */
export function basePointsLeft(skills: Skill[], total: number): number {
  return total - skills.reduce((sum, skill) => sum + skill.points, 0);
}

/** Damage of a weapon as text, for example "5W10 + 2"; empty for other items. */
export function damageText(item: InventoryItem): string {
  if (item.damage_dice <= 0) {
    return '';
  }
  return `${item.damage_dice}W10` + (item.damage_bonus ? ` + ${item.damage_bonus}` : '');
}

/** What the official rules object to in one skill: at least 1 point, at most the maximum value. A capped skill may stand above it. */
export function skillRuleProblems(skill: Skill, skills: Skill[], capped: boolean): string[] {
  const name = skill.name.trim() || 'Fähigkeit';
  const texts: string[] = [];
  const value = rawValue(skill, skills);
  if (skillPoints(skill) < 1) {
    texts.push(`„${name}“ braucht mindestens 1 Punkt.`);
  }
  if (!capped && value > MAX_SKILL_VALUE) {
    const label = TALENTS.find((talent) => talent.id === skill.talent)?.label ?? '';
    texts.push(`„${name}“ hat Wert ${value}. Höchstwert ist ${MAX_SKILL_VALUE}: Verteile ${value - MAX_SKILL_VALUE} Punkte in ${label} um.`);
  }
  return texts;
}
