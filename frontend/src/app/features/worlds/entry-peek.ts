import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { EntryRef } from '../../core/models';
import { SidePanel } from '../../shared/side-panel';
import { EntryView } from './entry-view';
import { entryAddress } from './entry-views';
import { WorldStore } from './world-store';

/** Look an entry up in a window at the side, without leaving the page that linked to it. */
@Component({
  selector: 'app-entry-peek',
  imports: [SidePanel, EntryView],
  template: `
    @if (store.peek(); as shown) {
      <app-side-panel title="Nachschlagen" (closed)="close()">
        <button panelAction type="button" class="btn btn--small" (click)="openInGlossary(shown)">Im Glossar öffnen</button>
        <ng-content />
        <app-entry-view [entry]="shown" />
      </app-side-panel>
    }
  `,
})
export class EntryPeek {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  /** Close the window. */
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
