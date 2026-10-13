import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Icon } from '../../shared/icon';
import { SidePanel } from '../../shared/side-panel';
import { EntryPeek } from './entry-peek';
import { RecentEntries } from './recent-entries';
import { WorldSearch } from './world-search';
import { WorldStore } from './world-store';

/**
 * The frame of one world. It loads the world once and shows its two parts below a bar that stays
 * in view: the chapters, where the story is written, and the glossary, where everything of the
 * world lives. The search in the bar finds every entry and opens it at the side, and "Zuletzt"
 * lists what was written and changed last.
 * It is built for the desktop only.
 */
@Component({
  selector: 'app-world-workspace',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon, SidePanel, EntryPeek, RecentEntries, WorldSearch],
  providers: [WorldStore],
  templateUrl: './world-workspace.html',
})
export class WorldWorkspace {
  protected readonly store = inject(WorldStore);

  /** From the URL: /gm/worlds/:worldId/... */
  readonly worldId = input.required<string>();
  /** Whether the window with what was written and changed last is open. */
  protected readonly recentOpen = signal(false);

  constructor() {
    effect(() => this.store.load(Number(this.worldId())));
  }
}
