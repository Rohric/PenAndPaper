import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { readError } from '../../core/api-error';
import { Leavable } from '../../core/leave.guard';
import { AnyCharacter, PlayerCharacter } from '../../core/models';
import { CharacterEditor, EditorSection } from '../../components/character/character-editor';
import { CharacterSheet } from '../../components/character/character-sheet';
import { CharacterService } from '../../core/character.service';
import { Tool } from '../../global/tool-bar/tools.service';
import { PlayerTools } from '../../global/tool-bar/player-tools';

const SECTIONS: EditorSection[] = ['profile', 'skills', 'inventory', 'abilities'];

/** One character of the player: the sheet to read, and the form to write it. The pencils on the sheet open the form at their part. */
@Component({
  selector: 'app-character-page',
  imports: [CharacterSheet, CharacterEditor],
  template: `
    <section class="stack">
      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }

      @if (character(); as shown) {
        @if (editing()) {
          <button type="button" class="btn btn--small back" (click)="toSheet()">Zum Bogen</button>
          <app-character-editor
            kind="player"
            [character]="shown"
            [secondBar]="shown.adventure?.second_bar ?? ''"
            [section]="section()"
            (saved)="onSaved($event)"
            (deleted)="leave()"
            (dirtyChange)="dirty.set($event)"
          />
        } @else {
          <app-character-sheet [character]="shown" [secondBar]="shown.adventure?.second_bar ?? ''" [editable]="true" (edit)="open($event)" />
        }
      }
    </section>
  `,
  styleUrl: './character-page.scss',
})
export class CharacterPage implements Leavable {
  private readonly service = inject(CharacterService);
  private readonly router = inject(Router);
  private readonly playerTools = inject(PlayerTools);

  /** From the URL: /player/characters/:id?edit=1 or ?edit=skills */
  readonly id = input.required<string>();
  readonly edit = input<string>();

  protected readonly character = signal<PlayerCharacter | null>(null);
  protected readonly editing = signal(false);
  protected readonly section = signal<EditorSection>('profile');
  protected readonly dirty = signal(false);
  protected readonly error = signal('');
  /** The symbols of the bar for the sheet: edit, go to the adventure, help. The form brings its own bar. */
  private readonly tools = computed<Tool[]>(() => {
    const adventure = this.character()?.adventure;
    return [
      { id: 'sheet-edit', word: 'Bearbeiten', icon: 'edit', click: () => this.open('profile') },
      ...(adventure ? [{ id: 'sheet-adventure', word: 'Zur Runde', icon: 'flag' as const, title: `Zur Runde: ${adventure.name}`, click: () => void this.router.navigate(['/player/sessions', adventure.id]) }] : []),
      this.playerTools.help('my-characters'),
    ];
  });

  constructor() {
    this.playerTools.provide('view', this.tools);
    // Load the character whenever another one is opened; a fresh one opens as a form.
    effect(() => {
      const wish = this.edit();
      this.editing.set(!!wish);
      this.section.set(SECTIONS.find((section) => section === wish) ?? 'profile');
      this.service.get<PlayerCharacter>('player-characters', Number(this.id())).subscribe({
        next: (character) => this.character.set(character),
        error: (e: unknown) => this.error.set(readError(e)),
      });
    });
  }

  /** Ask before leaving a form with unsaved changes. */
  canLeave(): boolean {
    return !this.editing() || !this.dirty() || confirm('Du hast ungespeicherte Änderungen. Seite trotzdem verlassen?');
  }

  /** Open the form at a section. */
  protected open(section: EditorSection): void {
    this.section.set(section);
    this.editing.set(true);
  }

  /** Back to the sheet, after asking when there are unsaved changes. */
  protected toSheet(): void {
    if (!this.dirty() || confirm('Du hast ungespeicherte Änderungen. Wirklich zurück zum Bogen?')) {
      this.dirty.set(false);
      this.editing.set(false);
    }
  }

  /** Show the saved character on the sheet. */
  protected onSaved(saved: AnyCharacter): void {
    this.character.set(saved as PlayerCharacter);
    this.dirty.set(false);
    this.editing.set(false);
  }

  /** The character is gone; go back to the list. */
  protected leave(): void {
    this.dirty.set(false);
    void this.router.navigateByUrl('/player/characters');
  }
}
