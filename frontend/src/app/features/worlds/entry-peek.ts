import { Component, effect, inject, input, linkedSignal, output, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';

import { EntryRef } from '../../core/models';
import { Icon } from '../../shared/icon';
import { SidePanel } from '../../shared/side-panel';
import { EntryForm } from './entry-form';
import { EntryView } from './entry-view';
import { Eyes, entryAddress } from './entry-views';
import { WorldStore } from './world-store';

const same = (a: EntryRef, b: EntryRef) => a.kind === b.kind && a.id === b.id;

/**
 * Look an entry up in a window at the side, without leaving the page that linked to it.
 * The window can also edit the entry, follow its links with a way back, and open its whole page.
 */
@Component({
  selector: 'app-entry-peek',
  imports: [SidePanel, Icon, EntryView, EntryForm],
  template: `
    @if (store.peek(); as shown) {
      <app-side-panel [title]="editing() ? 'Bearbeiten' : 'Nachschlagen'" [wide]="editing()" (closed)="close()">
        @if (trail().length > 1) {
          <button panelAction type="button" class="btn btn--small" (click)="back()"><app-icon name="back" [size]="16" /> Zurück</button>
        }
        @if (editable()) {
          <button panelAction type="button" class="btn btn--small" [attr.aria-pressed]="editing()" (click)="editing.set(!editing())">
            <app-icon [name]="editing() ? 'eye' : 'edit'" [size]="16" /> {{ editing() ? 'Lesen' : editLabel() }}
          </button>
        }
        @if (jump()) {
          <button panelAction type="button" class="btn btn--small" (click)="jumped.emit(shown)">
            <app-icon name="expand" [size]="16" /> Zum Eintrag
          </button>
        } @else {
          <button panelAction type="button" class="btn btn--small" (click)="openPage(shown)">
            <app-icon name="expand" [size]="16" /> Ganze Seite
          </button>
        }
        @if (editing()) {
          <app-entry-form [entry]="shown" (saved)="editing.set(false)" (closed)="close()" />
        } @else {
          <ng-content />
          <app-entry-view [entry]="shown" [eyes]="eyes()" (eye)="eye.emit($event)" (step)="step.emit($event)" />
        }
      </app-side-panel>
    }
  `,
})
export class EntryPeek {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  /** Whether the entry can be edited here; a page can switch that off. */
  readonly editable = input(true);
  /** Instead of the whole page, the window offers a way to the place where the entry is edited; a session uses it. */
  readonly jump = input(false);
  readonly jumped = output<EntryRef>();
  /** What the edit button says; a session names the world, because it can also change things for itself only. */
  readonly editLabel = input('Bearbeiten');
  /** What the players see of the entry, when a session decides it; handed on to the reading view. */
  readonly eyes = input<Eyes | null>(null);
  readonly eye = output<string>();
  readonly step = output<number>();

  /** Every newly opened entry starts in the reading view, unless it was asked for with its form. */
  protected readonly editing = linkedSignal({ source: this.store.peek, computation: (shown) => !!shown?.edit });
  /** The entries looked up one after the other, so there is a way back. */
  protected readonly trail = signal<EntryRef[]>([]);

  constructor() {
    effect(() => {
      const shown = this.store.peek();
      untracked(() => this.follow(shown));
    });
  }

  /** Close the window. */
  protected close(): void {
    this.store.peek.set(null);
  }

  /** Go back to the entry that was looked up before. */
  protected back(): void {
    const before = this.trail().at(-2);
    if (before) {
      this.store.peek.set(before);
    }
  }

  /** Leave the page and open the whole page of the entry. */
  protected openPage(ref: EntryRef): void {
    const address = entryAddress(this.store, ref);
    this.close();
    void this.router.navigate(address.commands, { queryParams: address.queryParams });
  }

  /** Keep the trail in step: a new entry is added, going back takes the last one off, closing empties it. */
  private follow(shown: EntryRef | null): void {
    const trail = this.trail();
    const last = trail.at(-1);
    const before = trail.at(-2);
    if (!shown) {
      this.trail.set([]);
    } else if (before && same(before, shown)) {
      this.trail.set(trail.slice(0, -1));
    } else if (!last || !same(last, shown)) {
      this.trail.set([...trail, { kind: shown.kind, id: shown.id }]);
    }
  }
}
