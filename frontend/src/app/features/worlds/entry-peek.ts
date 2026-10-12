import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { EntryRef } from '../../core/models';
import { EntryView } from './entry-view';
import { entryAddress } from './entry-views';
import { WorldStore } from './world-store';

/** Look an entry up in a panel at the side, without leaving the page that linked to it. */
@Component({
  selector: 'app-entry-peek',
  imports: [EntryView],
  template: `
    @if (store.peek(); as shown) {
      <div class="veil" (click)="close()"></div>
      <aside class="drawer" role="dialog" aria-label="Eintrag nachschlagen">
        <div class="row row--between">
          <button type="button" class="btn btn--small" (click)="close()">Schließen</button>
          <button type="button" class="btn btn--small" (click)="openInGlossary(shown)">Im Glossar öffnen</button>
        </div>
        <app-entry-view [entry]="shown" />
      </aside>
    }
  `,
  styles: `
    // One view for both screens: a panel on the right that never gets wider than the screen.
    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 41;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: min(520px, 100%);
      padding: 16px;
      overflow-y: auto;
      border-left: 1px solid var(--line);
      background: var(--bg);
    }
  `,
  host: { '(document:keydown.escape)': 'close()' },
})
export class EntryPeek {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  /** Close the panel. */
  protected close(): void {
    this.store.peek.set(null);
  }

  /** Leave the page and open the entry in the glossary. */
  protected openInGlossary(ref: EntryRef): void {
    const address = entryAddress(this.store, ref);
    this.close();
    void this.router.navigate(address.commands, { queryParams: address.queryParams });
  }
}
