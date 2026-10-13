import { Skill, TALENTS, Talent } from './models';
import { MAX_SKILL_VALUE, basePointsLeft, rawValue, skillPoints, skillRuleProblems } from './rules';

/**
 * House rules of the group, which the official rules of How to be a Hero do not know. Mirrored from the
 * backend (character_app/house_rules.py) so the editor can show them while typing.
 * Leveling: a point won after the creation costs bonus points by tiers. Above 100: a skill stays at the
 * maximum and gives credit to its talent. Credit is a pot of its own with its own counter on every skill:
 * it pays by the same tiers, but only for skills of its talent, and it never mixes with bonus points.
 * In an adventure the base points of a character are locked.
 */

/** What one point won by leveling costs, by the points the skill has after it: [up to, cost]. Above: LEVEL_TOP_COST. */
export const LEVEL_STEPS: [number, number][] = [[30, 1], [50, 2], [70, 3]];
export const LEVEL_TOP_COST = 4;
/** Points above the maximum that give one point of credit for the same talent. */
export const OVERFLOW_RATE = 2;

/** What the point that brings a skill to the given points costs. */
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

/** What the points a skill bought with credit cost in credit; they lie above its bonus points. */
export function creditCost(skill: Skill): number {
  const start = skill.points + skill.bonus_points;
  let cost = 0;
  for (let points = start + 1; points <= start + (skill.credit_points ?? 0); points++) {
    cost += levelCost(points);
  }
  return cost;
}

/** The cost of the next point won by leveling in a skill, in bonus points. */
export function nextCost(skill: Skill): number {
  return levelCost(skill.points + skill.bonus_points + 1);
}

/** The cost of the next point bought with credit, in credit. */
export function nextCreditCost(skill: Skill): number {
  return levelCost(skillPoints(skill) + 1);
}

/** Credit of a talent: half of the points its skills have above the maximum. */
export function refund(skills: Skill[], talent: Talent): number {
  const over = skills.filter((skill) => skill.talent === talent).reduce((sum, skill) => sum + Math.max(0, rawValue(skill, skills) - MAX_SKILL_VALUE), 0);
  return Math.floor(over / OVERFLOW_RATE);
}

/**
 * Unspent bonus points. A character with the leveling rule pays by the tiers; any other character pays one
 * bonus point for one point. Credit is a pot of its own and never pays for bonus points.
 */
export function bonusPointsLeft(skills: Skill[], total: number, leveling = false): number {
  if (!leveling) {
    return total - skills.reduce((sum, skill) => sum + skill.bonus_points, 0);
  }
  return total - skills.reduce((sum, skill) => sum + bonusCost(skill), 0);
}

/** For each talent the credit that is not spent yet; below zero when more is spent than it has. */
export function creditLeft(skills: Skill[]): Record<Talent, number> {
  const left = { action: 0, knowledge: 0, social: 0 } as Record<Talent, number>;
  for (const { id } of TALENTS) {
    const spent = skills.filter((skill) => skill.talent === id).reduce((sum, skill) => sum + creditCost(skill), 0);
    left[id] = refund(skills, id) - spent;
  }
  return left;
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

function bought(skill: Skill | undefined): number {
  return (skill?.bonus_points ?? 0) + (skill?.credit_points ?? 0);
}

function lockedProblems(skill: Skill, skills: Skill[], old: Skill | undefined): string[] {
  const name = skill.name.trim() || 'Fähigkeit';
  const texts: string[] = [];
  if (old && (skill.points < old.points || skill.talent !== old.talent)) {
    texts.push(`„${name}“: Grundpunkte und Begabung sind im Abenteuer fest.`);
  }
  if (rawValue(skill, skills) > MAX_SKILL_VALUE && bought(skill) > bought(old)) {
    texts.push(`„${name}“ ist schon bei ${MAX_SKILL_VALUE}. Mehr geht nicht.`);
  }
  return texts;
}

function creditProblems(skills: Skill[]): SkillProblem[] {
  const left = creditLeft(skills);
  return TALENTS.filter((talent) => left[talent.id] < 0).map((talent) => ({
    index: null,
    text: `In ${talent.label} ist mehr Guthaben eingesetzt, als die Begabung hat: ${-left[talent.id]} zu viel. Nimm Guthaben-Punkte zurück.`,
  }));
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
  problems.push(...creditProblems(skills));
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
