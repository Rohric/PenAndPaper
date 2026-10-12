import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

/** Start page of every account. Player characters arrive in a later step. */
@Component({
  selector: 'app-player-home',
  imports: [RouterLink],
  templateUrl: './player-home.html',
})
export class PlayerHome {
  protected readonly auth = inject(AuthService);
  protected readonly checked = signal(false);

  /** Ask the server again whether an admin has unlocked the game master menu. */
  protected checkUnlock(): void {
    this.auth.refresh().subscribe(() => this.checked.set(true));
  }
}
