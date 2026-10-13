import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { TutorialService } from '../../core/tutorial.service';
import { CockpitTools, Tool } from '../sessions/cockpit-tools';

/**
 * The symbols of the bar at the bottom of the player pages: 'always' is the main row, 'view' the row of
 * the open page. A component that needs the bottom of the screen itself, like the editor of a character, covers the bar.
 */
@Injectable({ providedIn: 'root' })
export class PlayerTools extends CockpitTools {
  private readonly tutorial = inject(TutorialService);
  private readonly covers = signal(0);
  /** Whether something else uses the bottom of the screen right now. */
  readonly covered = computed(() => this.covers() > 0);

  /** Hide the bar while the calling component lives. Call it in a constructor. */
  cover(): void {
    this.covers.update((count) => count + 1);
    inject(DestroyRef).onDestroy(() => this.covers.update((count) => count - 1));
  }

  /** The symbol that opens the help for a page. */
  help(topic: string, step: number | string = 0): Tool {
    return { id: 'help', word: 'Hilfe', icon: 'help', click: () => this.tutorial.open(topic, step) };
  }
}
