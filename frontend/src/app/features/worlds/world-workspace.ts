import { Component, effect, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Icon } from '../../shared/icon';
import { EntryPeek } from './entry-peek';
import { WorldSearch } from './world-search';
import { WorldStore } from './world-store';

/**
 * The frame of one world. It loads the world once and shows its two parts below a bar that stays
 * in view: the chapters, where the story is written, and the glossary, where everything of the
 * world lives. The search in the bar finds every entry and opens it at the side.
 * It is built for the desktop only.
 */
@Component({
  selector: 'app-world-workspace',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon, EntryPeek, WorldSearch],
  providers: [WorldStore],
  templateUrl: './world-workspace.html',
})
export class WorldWorkspace {
  protected readonly store = inject(WorldStore);

  /** From the URL: /gm/worlds/:worldId/... */
  readonly worldId = input.required<string>();

  constructor() {
    effect(() => this.store.load(Number(this.worldId())));
  }
}
