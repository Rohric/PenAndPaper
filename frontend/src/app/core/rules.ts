import { InventoryItem, Skill, TALENTS, Talent } from './models';

/**
 * Rule calculations for How to be a Hero, mirrored from the backend
 * (character_app/utils.py) so the editor can show values while typing.
 * Base points and bonus points count together for the value of a skill. A point won by
 * leveling costs bonus points by tiers (house rule), and no skill is worth more than 100.
 */

export const MAX_SKILL_VALUE = 100;
/** What one point won by leveling costs, by the points the skill has after it: [up to, cost]. Above: LEVEL_TOP_COST. */
export const LEVEL_STEPS: [number, number][] = [[30, 1], [50, 2], [70, 3]];
export const LEVEL_TOP_COST = 4;
/** Points above the maximum that give one point of credit for the same talent. */
export const OVERFLOW_RATE = 2;

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

/** What the point that brings a skill to the given points costs in bonus points. */
export function levelCost(points: number): number {
  return LEVEL_STEPS.find(([limit]) => points <= limit)?.[1] ?? LEVEL_TOP_COST;
}

/** What the points a skill won by leveling cost in bonus points. */
export function bonusCost(skill: Skill): number {
  let cost = 0;
  for (let points = skill.points + 1; points <= skill.points + skill.bonus_points; points++) {
    cost += levelCost(points);
  }
  return cost;
}

/** The cost of the next point won by leveling in a skill. */
export function nextCost(skill: Skill): number {
  return levelCost(skillPoints(skill) + 1);
}

/** Credit of a talent: half of the points its skills have above the maximum. */
export function refund(skills: Skill[], talent: Talent): number {
  const over = skills.filter((skill) => skill.talent === talent).reduce((sum, skill) => sum + Math.max(0, rawValue(skill, skills) - MAX_SKILL_VALUE), 0);
  return Math.floor(over / OVERFLOW_RATE);
}

/** Unspent base points of the creation budget. */
export function basePointsLeft(skills: Skill[], total: number): number {
  return total - skills.reduce((sum, skill) => sum + skill.points, 0);
}

/**
 * Unspent bonus points. A character with the leveling rule pays by the tiers and gets the credit of its
 * talents back; any other character pays one bonus point for one point.
 */
export function bonusPointsLeft(skills: Skill[], total: number, leveling = false): number {
  if (!leveling) {
    return total - skills.reduce((sum, skill) => sum + skill.bonus_points, 0);
  }
  const spent = TALENTS.reduce((sum, talent) => {
    const cost = skills.filter((skill) => skill.talent === talent.id).reduce((all, skill) => all + bonusCost(skill), 0);
    return sum + Math.max(0, cost - refund(skills, talent.id));
  }, 0);
  return total - spent;
}

/** Damage of a weapon as text, for example "5W10 + 2"; empty for other items. */
export function damageText(item: InventoryItem): string {
  if (item.damage_dice <= 0) {
    return '';
  }
  return `${item.damage_dice}W10` + (item.damage_bonus ? ` + ${item.damage_bonus}` : '');
}

/** One thing that is wrong with the skills; index is the place of the skill in the list, null for the whole list. */
export interface SkillProblem {
  index: number | null;
  text: string;
}

/** The totals of a character that its skills must not exceed. */
export interface Budgets {
  base: number;
  bonus: number;
}

/**
 * What is wrong with the skills of a player character. stored are the skills as they were saved. While the
 * character plays in an adventure (locked) its base points stay and no skill can be bought above the maximum.
 */
export function skillProblems(skills: Skill[], stored: Skill[], locked: boolean, budgets: Budgets): SkillProblem[] {
  const problems = skills.flatMap((skill, index) => skillProblemsOf(skill, index, skills, stored.find((old) => old.id !== undefined && old.id === skill.id), locked));
  if (locked) {
    const kept = new Set(skills.map((skill) => skill.id));
    stored.forEach((old) => {
      if (old.points && !kept.has(old.id)) {
        problems.push({ index: null, text: `„${old.name}“ hat Grundpunkte und bleibt bestehen.` });
      }
    });
  }
  const base = basePointsLeft(skills, budgets.base);
  const bonus = bonusPointsLeft(skills, budgets.bonus, true);
  if (base < 0) {
    problems.push({ index: null, text: `Es sind ${-base} Grundpunkte zu viel verteilt.` });
  }
  if (bonus < 0) {
    problems.push({ index: null, text: `Es sind ${-bonus} Bonuspunkte zu viel ausgegeben.` });
  }
  return problems;
}

function skillProblemsOf(skill: Skill, index: number, skills: Skill[], old: Skill | undefined, locked: boolean): SkillProblem[] {
  const name = skill.name.trim() || 'Fähigkeit';
  const texts: string[] = [];
  const value = rawValue(skill, skills);
  if (skillPoints(skill) < 1) {
    texts.push(`„${name}“ braucht mindestens 1 Punkt.`);
  }
  if (!locked && value > MAX_SKILL_VALUE) {
    const label = TALENTS.find((talent) => talent.id === skill.talent)?.label ?? '';
    texts.push(`„${name}“ hat Wert ${value}. Höchstwert ist ${MAX_SKILL_VALUE}: Verteile ${value - MAX_SKILL_VALUE} Punkte in ${label} um.`);
  }
  if (locked && old && (skill.points < old.points || skill.talent !== old.talent)) {
    texts.push(`„${name}“: Grundpunkte und Begabung sind im Abenteuer fest.`);
  }
  if (locked && value > MAX_SKILL_VALUE && skill.bonus_points > (old?.bonus_points ?? 0)) {
    texts.push(`„${name}“ ist schon bei ${MAX_SKILL_VALUE}. Mehr geht nicht.`);
  }
  return texts.map((text) => ({ index, text }));
}

/** Hints that do not stop saving: a skill that is capped, with the credit it gives. */
export function skillHints(skills: Skill[]): { index: number; text: string }[] {
  return skills.flatMap((skill, index) => {
    const over = rawValue(skill, skills) - MAX_SKILL_VALUE;
    if (over <= 0) {
      return [];
    }
    const label = TALENTS.find((talent) => talent.id === skill.talent)?.label ?? '';
    return [{ index, text: `„${skill.name}“ ist bei ${MAX_SKILL_VALUE} gedeckelt, ${over} Punkte wirken nicht. Zwei davon geben 1 Punkt Guthaben für ${label}.` }];
  });
}
