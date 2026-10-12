import { Component, effect, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { EntryPeek } from './entry-peek';
import { WorldStore } from './world-store';

/**
 * The frame of one world. It loads the world once and shows its two parts:
 * the chapters, where the story is written, and the glossary, where everything of the world lives.
 */
@Component({
  selector: 'app-world-workspace',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, EntryPeek],
  providers: [WorldStore],
  templateUrl: './world-workspace.html',
  styleUrl: './world-workspace.scss',
})
export class WorldWorkspace {
  protected readonly store = inject(WorldStore);

  /** From the URL: /gm/worlds/:worldId/... */
  readonly worldId = input.required<string>();

  constructor() {
    effect(() => this.store.load(Number(this.worldId())));
  }
}
