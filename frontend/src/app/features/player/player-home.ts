import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { PlayerCharacter } from '../../core/models';
import { TutorialButton } from '../../shared/tutorial-button';
import { CharacterService } from '../characters/character.service';

/** Start page of every account: the characters of the player, with a form to create one. */
@Component({
  selector: 'app-player-home',
  imports: [FormsModule, RouterLink, TutorialButton],
  templateUrl: './player-home.html',
})
export class PlayerHome {
  protected readonly auth = inject(AuthService);
  private readonly service = inject(CharacterService);
  private readonly router = inject(Router);

  protected readonly characters = signal<PlayerCharacter[]>([]);
  protected readonly newName = signal('');
  protected readonly error = signal('');
  protected readonly checked = signal(false);

  constructor() {
    this.service.list<PlayerCharacter>('player-characters').subscribe({
      next: (characters) => this.characters.set(characters),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Create a character from the typed name and open it. */
  protected create(): void {
    this.service.create<PlayerCharacter>('player-characters', this.newName().trim()).subscribe({
      next: (character) => void this.router.navigate(['/player/characters', character.id], { queryParams: { edit: 1 } }),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Ask the server again whether an admin has unlocked the game master menu. */
  protected checkUnlock(): void {
    this.auth.refresh().subscribe(() => this.checked.set(true));
  }
}
