import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { readError } from '../../core/api-error';
import { PlayerCharacter } from '../../core/models';
import { MasterDetail } from '../../shared/master-detail';
import { TutorialButton } from '../../shared/tutorial-button';
import { CharacterSheet } from '../characters/character-sheet';
import { CharacterService } from '../characters/character.service';

type LevelField = 'skill_points_total' | 'bonus_points_total' | 'life_points' | 'max_life_points';

/** The characters of all players as the game master sees them: read the sheet, and level it. */
@Component({
  selector: 'app-player-characters',
  imports: [FormsModule, MasterDetail, TutorialButton, CharacterSheet],
  templateUrl: './player-characters.html',
})
export class PlayerCharacters {
  private readonly service = inject(CharacterService);

  protected readonly characters = signal<PlayerCharacter[]>([]);
  protected readonly selectedId = signal<number | null>(null);
  protected readonly selected = computed(() => this.characters().find((c) => c.id === this.selectedId()) ?? null);
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  /** What only the game master changes; the draft starts over when another character is opened. */
  protected readonly level = linkedSignal(() => {
    const character = this.selected();
    return {
      skill_points_total: character?.skill_points_total ?? 0,
      bonus_points_total: character?.bonus_points_total ?? 0,
      life_points: character?.life_points ?? 0,
      max_life_points: character?.max_life_points ?? 0,
    };
  });
  protected readonly dirty = computed(() => {
    const character = this.selected();
    const level = this.level();
    return !!character && (Object.keys(level) as LevelField[]).some((key) => level[key] !== character[key]);
  });

  constructor() {
    this.service.list<PlayerCharacter>('gm/player-characters').subscribe({
      next: (characters) => this.characters.set(characters),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Change one of the three values; empty or negative input counts as 0. */
  protected set(key: LevelField, value: number | null): void {
    this.level.update((level) => ({ ...level, [key]: Math.max(0, Math.floor(value ?? 0)) }));
  }

  /** Save budgets and life points of the opened character. */
  protected save(): void {
    const id = this.selectedId();
    if (id === null) {
      return;
    }
    this.busy.set(true);
    this.service.update<PlayerCharacter>('gm/player-characters', id, this.level()).subscribe({
      next: (saved) => this.done(saved),
      error: (e: unknown) => this.finish(readError(e)),
    });
  }

  private done(saved: PlayerCharacter): void {
    this.characters.update((characters) => characters.map((old) => (old.id === saved.id ? saved : old)));
    this.finish('');
  }

  private finish(error: string): void {
    this.busy.set(false);
    this.error.set(error);
  }
}
