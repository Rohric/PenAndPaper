import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { World } from '../../core/models';

/** All worlds of the game master, with a form to start a new one. */
@Component({
  selector: 'app-world-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './world-list.html',
})
export class WorldList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly worlds = signal<World[]>([]);
  protected readonly newName = signal('');
  protected readonly error = signal('');

  constructor() {
    this.api.get<World[]>('worlds/').subscribe({
      next: (worlds) => this.worlds.set(worlds),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Create a world from the typed name and open it. */
  protected create(): void {
    this.api.post<World>('worlds/', { name: this.newName().trim() }).subscribe({
      next: (world) => void this.router.navigate(['/gm/worlds', world.id, 'lore']),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }
}
