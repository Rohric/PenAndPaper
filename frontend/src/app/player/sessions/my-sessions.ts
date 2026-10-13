import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { Session } from '../../core/session-models';
import { PlayerBar } from '../player/player-bar';
import { PlayerTools } from '../player/player-tools';
import { SessionService } from './session.service';

/** The sessions in which a character of the player plays. */
@Component({
  selector: 'app-my-sessions',
  imports: [RouterLink, PlayerBar],
  template: `
    <section class="stack">
      <header class="row row--between">
        <div>
          <span class="kicker">Spieler</span>
          <h1 class="title">Meine Runden</h1>
        </div>
      </header>

      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }

      <div class="cards">
        @for (session of sessions(); track session.id) {
          <a class="card" [routerLink]="['/player/sessions', session.id]">
            <span class="kicker">{{ session.world_name }} · seit {{ session.date }}</span>
            <span class="card__title">{{ session.name }}</span>
            @if (session.finished) {
              <span class="chip">beendet</span>
            }
          </a>
        }
      </div>

      @if (!sessions().length) {
        <div class="empty">
          <p>Du spielst noch in keiner Runde. Der Spielleiter nimmt einen deiner Charaktere in eine Runde auf.</p>
        </div>
      }
    </section>
    <app-player-bar />
  `,
})
export class MySessions {
  protected readonly sessions = signal<Session[]>([]);
  protected readonly error = signal('');

  constructor() {
    const tools = inject(PlayerTools);
    tools.provide('view', signal([tools.help('my-sessions')]));
    inject(SessionService).mine().subscribe({
      next: (sessions) => this.sessions.set(sessions),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }
}
