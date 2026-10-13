import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { World } from '../../core/models';
import { NameDialog } from '../../components/form/name-dialog';
import { NavService } from '../../global/frame/nav.service';
import { Tools } from '../../global/tool-bar/tools.service';

/** All worlds of the game master; "Neu" in the bar at the bottom starts a new one. */
@Component({
  selector: 'app-world-list',
  imports: [RouterLink, NameDialog],
  templateUrl: './world-list.html',
})
export class WorldList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly worlds = signal<World[]>([]);
  protected readonly creating = signal(false);
  protected readonly error = signal('');

  constructor() {
    const nav = inject(NavService);
    nav.crumbs.provide(signal([{ label: 'Welten' }]));
    nav.topic.provide(signal(['start']));
    inject(Tools).provide('view', signal([{ id: 'new', word: 'Neu', title: 'Neue Welt', icon: 'plus', click: () => this.creating.set(true) }]));
    this.api.get<World[]>('worlds/').subscribe({
      next: (worlds) => this.worlds.set(worlds),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Create a world from the typed name and open it. */
  protected create(name: string): void {
    this.api.post<World>('worlds/', { name }).subscribe({
      next: (world) => void this.router.navigate(['/gm/worlds', world.id]),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }
}
