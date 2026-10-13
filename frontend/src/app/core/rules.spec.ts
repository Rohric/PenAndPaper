import { Skill } from './models';
import { bonusPointsLeft } from './house-rules';
import { basePointsLeft, damageText, inspirationPoints, roundHalfUp, skillValue, talentValue } from './rules';

function skill(name: string, talent: Skill['talent'], points: number, bonus = 0): Skill {
  return { name, talent, points, bonus_points: bonus, description: '' };
}

// 129 action points and 150 social points, as in the examples of the rule book.
const SKILLS = [skill('Holzfällen', 'action', 50), skill('Klettern', 'action', 79), skill('Feilschen', 'social', 100), skill('Lügen', 'social', 50)];

describe('rules', () => {
  it('rounds up at one half', () => {
    expect(roundHalfUp(12.5)).toBe(13);
    expect(roundHalfUp(12.4)).toBe(12);
  });

  it('calculates talent value, skill value and inspiration points', () => {
    expect(talentValue(SKILLS, 'action')).toBe(13);
    expect(skillValue(SKILLS[0], SKILLS)).toBe(63);
    expect(inspirationPoints(SKILLS, 'action')).toBe(1);
    expect(inspirationPoints(SKILLS, 'social')).toBe(2);
  });

  it('counts bonus points for skill and talent, but in their own budget', () => {
    const leveled = [skill('Holzfällen', 'action', 50, 11), SKILLS[1]];
    expect(talentValue(leveled, 'action')).toBe(14);
    expect(skillValue(leveled[0], leveled)).toBe(75);
    expect(basePointsLeft(leveled, 400)).toBe(271);
    expect(bonusPointsLeft(leveled, 20)).toBe(9);
  });

  it('describes weapon damage', () => {
    const base = { name: 'Schwert', quantity: 1, description: '' };
    expect(damageText({ ...base, damage_dice: 5, damage_bonus: 0 })).toBe('5W10');
    expect(damageText({ ...base, damage_dice: 5, damage_bonus: 2 })).toBe('5W10 + 2');
    expect(damageText({ ...base, damage_dice: 0, damage_bonus: 0 })).toBe('');
  });
});
