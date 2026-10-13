import { Component, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { AnyCharacter, PlayerCharacter } from '../../core/models';
import { TutorialButton } from '../../shared/tutorial-button';
import { CharacterEditor } from '../characters/character-editor';
import { CharacterSheet } from '../characters/character-sheet';
import { CharacterService } from '../characters/character.service';

/** One character of the player: the sheet to read, and the form to write it. */
@Component({
  selector: 'app-character-page',
  imports: [RouterLink, TutorialButton, CharacterSheet, CharacterEditor],
  template: `
    <section class="stack">
      <div class="row row--between">
        <a class="btn btn--small" routerLink="/player/characters">Alle Charaktere</a>
        <app-tutorial-button topic="my-characters" />
      </div>

      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }

      @if (character(); as shown) {
        @if (editing()) {
          <button type="button" class="btn btn--small back" (click)="editing.set(false)">Zum Bogen</button>
          <app-character-editor kind="player" [character]="shown" (saved)="onSaved($event)" (deleted)="leave()" />
        } @else {
          <app-character-sheet [character]="shown">
            <button type="button" class="btn btn--small" (click)="editing.set(true)">Bearbeiten</button>
          </app-character-sheet>
        }
      }
    </section>
  `,
  styles: `
    .back {
      align-self: flex-start;
    }
  `,
})
export class CharacterPage {
  private readonly service = inject(CharacterService);
  private readonly router = inject(Router);

  /** From the URL: /player/characters/:id?edit=1 */
  readonly id = input.required<string>();
  readonly edit = input<string>();

  protected readonly character = signal<PlayerCharacter | null>(null);
  protected readonly editing = signal(false);
  protected readonly error = signal('');

  constructor() {
    // Load the character whenever another one is opened; a fresh one opens as a form.
    effect(() => {
      this.editing.set(!!this.edit());
      this.service.get<PlayerCharacter>('player-characters', Number(this.id())).subscribe({
        next: (character) => this.character.set(character),
        error: (e: unknown) => this.error.set(readError(e)),
      });
    });
  }

  /** Show the saved character on the sheet. */
  protected onSaved(saved: AnyCharacter): void {
    this.character.set(saved as PlayerCharacter);
    this.editing.set(false);
  }

  /** The character is gone; go back to the list. */
  protected leave(): void {
    void this.router.navigateByUrl('/player/characters');
  }
}
