import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { readError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { Option, PlayerCharacter, World } from '../../core/models';
import { Session } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { IdSelect } from '../../shared/id-select';
import { LinkPicker } from '../../shared/link-picker';
import { LoginQr } from '../../shared/login-qr';
import { SidePanel } from '../../shared/side-panel';
import { TutorialButton } from '../../shared/tutorial-button';
import { CharacterService } from '../characters/character.service';
import { SessionService } from './session.service';

/** The sessions of the game master, with the form that starts a new one. */
@Component({
  selector: 'app-session-list',
  imports: [FormsModule, RouterLink, Icon, IdSelect, LinkPicker, LoginQr, SidePanel, TutorialButton],
  templateUrl: './session-list.html',
})
export class SessionList {
  private readonly api = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly sessions = signal<Session[]>([]);
  protected readonly worlds = signal<World[]>([]);
  protected readonly characters = signal<PlayerCharacter[]>([]);
  protected readonly error = signal('');
  /** Whether the window with the QR code for the phones of the players is open. */
  protected readonly qrOpen = signal(false);

  protected readonly name = signal('');
  protected readonly date = signal(new Date().toISOString().slice(0, 10));
  protected readonly world = signal<number | null>(null);
  protected readonly chosen = signal<number[]>([]);

  protected readonly worldOptions = computed<Option[]>(() => this.worlds().map((w) => ({ id: w.id, label: w.name })));
  protected readonly characterOptions = computed<Option[]>(() =>
    this.characters().filter((c) => !c.adventure).map((c) => ({ id: c.id, label: c.name, hint: `Spieler: ${c.player}` })),
  );

  constructor() {
    const parts = {
      sessions: this.api.list(),
      worlds: inject(ApiService).get<World[]>('worlds/'),
      characters: inject(CharacterService).list<PlayerCharacter>('gm/player-characters'),
    };
    forkJoin(parts).subscribe({
      next: (data) => this.fill(data),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Start a session with the chosen world and characters and open it. */
  protected create(): void {
    const session = { name: this.name().trim(), date: this.date(), world: this.world() ?? 0, characters: this.chosen() };
    this.api.create(session).subscribe({
      next: (created) => void this.router.navigate(['/gm/sessions', created.id]),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  private fill(data: { sessions: Session[]; worlds: World[]; characters: PlayerCharacter[] }): void {
    this.sessions.set(data.sessions);
    this.worlds.set(data.worlds);
    this.characters.set(data.characters);
  }
}
