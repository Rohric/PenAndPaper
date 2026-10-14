import { Component, computed, input, output, signal } from '@angular/core';

import { PlayerCharacter, TALENTS } from '../../core/models';
import { damageText, inspirationPoints, skillValue, talentValue } from '../../core/rules';
import { Icon } from '../basic/icon';
import { barPercent } from './point-bar';

const LIFE_STEPS = [-5, -1, 1, 5];

/** What the game master can open for a character in the window at the side. */
export type CharacterPanel = 'sheet' | 'messages' | 'item';

/**
 * One character of the group as a tile that folds open: closed it shows name, life points and the second bar,
 * open also the values to roll against, the weapons and the buttons of the game master.
 */
@Component({
  selector: 'app-character-tile',
  imports: [Icon],
  templateUrl: './character-tile.html',
  styleUrl: './character-tile.scss',
})
export class CharacterTile {
  readonly character = input.required<PlayerCharacter>();
  /** Answers of the player the game master has not read yet. */
  readonly unread = input(0);
  /** The name of the second bar of the world; empty when there is none. */
  readonly secondBar = input('');
  /** Asks to set the life points to this value. */
  readonly life = output<number>();
  /** Asks to set the points of the second bar to this value. */
  readonly second = output<number>();
  readonly open = output<CharacterPanel>();

  protected readonly expanded = signal(false);
  protected readonly steps = LIFE_STEPS;
  /** How full the life bar is, in percent of the character's maximum. */
  protected readonly percent = computed(() => barPercent(this.character().life_points, this.character().max_life_points));
  protected readonly secondPercent = computed(() => barPercent(this.character().second_bar_points, this.character().max_second_bar_points));
  /** Ask for more or fewer life points, never below 0 and never above the maximum. */
  protected changeLife(step: number): void {
    const { life_points, max_life_points } = this.character();
    this.life.emit(Math.min(max_life_points, Math.max(0, life_points + step)));
  }

  /** Ask for more or fewer points of the second bar, never below 0 and never above its maximum. */
  protected changeSecond(step: number): void {
    const { second_bar_points, max_second_bar_points } = this.character();
    this.second.emit(Math.min(max_second_bar_points, Math.max(0, second_bar_points + step)));
  }

  protected readonly talents = computed(() => {
    const skills = this.character().skills;
    return TALENTS.map((talent) => ({
      label: talent.label,
      value: talentValue(skills, talent.id),
      inspiration: inspirationPoints(skills, talent.id),
      skills: skills.filter((skill) => skill.talent === talent.id).map((skill) => ({ name: skill.name, value: skillValue(skill, skills) })),
    }));
  });
  protected readonly weapons = computed(() =>
    this.character()
      .inventory.filter((item) => item.damage_dice > 0)
      .map((item) => `${item.name} · ${damageText(item)}`),
  );
}
