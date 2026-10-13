import { Skill, TALENTS, Talent } from './models';
import { MAX_SKILL_VALUE, basePointsLeft, rawValue, skillPoints, skillRuleProblems } from './rules';

/**
 * House rules of the group, which the official rules of How to be a Hero do not know. Mirrored from the
 * backend (character_app/house_rules.py) so the editor can show them while typing.
 * Leveling: a point won after the creation costs bonus points by tiers. Above 100: a skill stays at the
 * maximum and gives credit to its talent. In an adventure the base points of a character are locked.
 */

/** What one point won by leveling costs, by the points the skill has after it: [up to, cost]. Above: LEVEL_TOP_COST. */
export const LEVEL_STEPS: [number, number][] = [[30, 1], [50, 2], [70, 3]];
export const LEVEL_TOP_COST = 4;
/** Points above the maximum that give one point of credit for the same talent. */
export const OVERFLOW_RATE = 2;

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

function talentCost(skills: Skill[], talent: Talent): number {
  return skills.filter((skill) => skill.talent === talent).reduce((sum, skill) => sum + bonusCost(skill), 0);
}

/**
 * Unspent bonus points. A character with the leveling rule pays by the tiers and gets the credit of its
 * talents back; any other character pays one bonus point for one point.
 */
export function bonusPointsLeft(skills: Skill[], total: number, leveling = false): number {
  if (!leveling) {
    return total - skills.reduce((sum, skill) => sum + skill.bonus_points, 0);
  }
  return total - TALENTS.reduce((sum, talent) => sum + Math.max(0, talentCost(skills, talent.id) - refund(skills, talent.id)), 0);
}

/** The free bonus points and, for each talent, the credit that is not spent yet. */
export interface CreditLeft {
  free: number;
  credit: Record<Talent, number>;
}

/**
 * Free points count as spent first. What is left over after them is credit, which only pays for skills of
 * its own talent. Both together are the unspent bonus points.
 */
export function creditLeft(skills: Skill[], total: number): CreditLeft {
  let free = bonusPointsLeft(skills, total, true);
  const credit = { action: 0, knowledge: 0, social: 0 } as Record<Talent, number>;
  for (const { id } of TALENTS) {
    const granted = refund(skills, id);
    const cost = talentCost(skills, id);
    const returned = Math.min(granted, cost, Math.max(0, free));
    credit[id] = Math.max(0, granted - cost) + returned;
    free -= returned;
  }
  return { free, credit };
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

function lockedProblems(skill: Skill, skills: Skill[], old: Skill | undefined): string[] {
  const name = skill.name.trim() || 'Fähigkeit';
  const texts: string[] = [];
  if (old && (skill.points < old.points || skill.talent !== old.talent)) {
    texts.push(`„${name}“: Grundpunkte und Begabung sind im Abenteuer fest.`);
  }
  if (rawValue(skill, skills) > MAX_SKILL_VALUE && skill.bonus_points > (old?.bonus_points ?? 0)) {
    texts.push(`„${name}“ ist schon bei ${MAX_SKILL_VALUE}. Mehr geht nicht.`);
  }
  return texts;
}

/**
 * What is wrong with the skills of a player character. stored are the skills as they were saved. While the
 * character plays in an adventure (locked) its base points stay and a skill above the maximum stays at it.
 */
export function skillProblems(skills: Skill[], stored: Skill[], locked: boolean, budgets: Budgets): SkillProblem[] {
  const problems: SkillProblem[] = skills.flatMap((skill, index) => {
    const old = stored.find((other) => other.id !== undefined && other.id === skill.id);
    const texts = [...skillRuleProblems(skill, skills, locked), ...(locked ? lockedProblems(skill, skills, old) : [])];
    return texts.map((text) => ({ index, text }));
  });
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
