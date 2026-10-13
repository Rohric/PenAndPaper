import { Component, computed, effect, inject, input, linkedSignal, output, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';

import { EntryRef } from '../../core/models';
import { SessionStore } from '../../core/session-store';
import { WorldStore } from '../../core/world-store';
import { EntryForm } from '../../gm/glossary/entry-form';
import { Icon } from '../basic/icon';
import { SideWindow } from '../window/side-window';
import { WindowHistory } from '../window/window-history';
import { WindowTab } from '../window/window-head';
import { EntryView } from './entry-view';
import { Eyes, entryAddress, viewOf } from './entry-views';
import { EntryCard } from './entry-card';

const same = (a: EntryRef, b: EntryRef) => a.kind === b.kind && a.id === b.id;

/**
 * An entry in the window at the side, to read and to edit without leaving the page. Its tabs: the text, what
 * the entry is linked to and, in a session, the round and the note. A click on a link changes the window to that
 * entry, the arrows lead back and forward. From here the only way on is to the entry itself, which closes the window.
 */
@Component({
  selector: 'app-entry-peek',
  imports: [SideWindow, Icon, EntryView, EntryForm, EntryCard],
  template: `
    @if (store.peek(); as shown) {
      <app-side-window
        [title]="view()?.title ?? 'Eintrag'"
        [kind]="editing() ? 'Bearbeiten' : (view()?.kicker ?? '')"
        [tone]="'kind--' + (view()?.tone ?? shown.kind)"
        [wide]="editing()"
        [tabs]="editing() ? [] : tabs()"
        [(tab)]="tab"
        [canBack]="history.canBack()"
        [canForward]="history.canForward()"
        (back)="store.peek.set(history.back())"
        (forward)="store.peek.set(history.forward())"
        (closed)="close()"
      >
        @if (editing()) {
          <app-entry-form [entry]="shown" (saved)="editing.set(false)" (closed)="close()" />
        } @else {
          @switch (tab()) {
            @case ('links') {
              @if (session() && linkCount()) {
                <div class="row">
                  <button type="button" class="btn btn--small" (click)="layAll(shown)"><app-icon name="plus" [size]="16" /> Alles auf den Tisch</button>
                </div>
              }
              @for (group of view()?.links ?? []; track group.label) {
                <div class="field">
                  <span class="label">{{ group.label }}</span>
                  <div class="stack">
                    @for (item of group.items; track item.kind + item.id) {
                      <app-entry-card [ref]="item" />
                    }
                  </div>
                </div>
              } @empty {
                <p class="soft">Dieser Eintrag ist noch mit nichts verknüpft.</p>
              }
            }
            @case ('round') {
              <ng-content select="[entryRound]" />
            }
            @case ('note') {
              <ng-content select="[entryNote]" />
            }
            @default {
              <app-entry-view [entry]="shown" [eyes]="eyes()" (eye)="eye.emit($event)" (step)="step.emit($event)" />
            }
          }
        }
        @if (editable()) {
          <button windowFoot type="button" class="btn btn--small" [attr.aria-pressed]="editing()" (click)="editing.set(!editing())">
            <app-icon [name]="editing() ? 'eye' : 'edit'" [size]="16" /> {{ editing() ? 'Lesen' : 'Bearbeiten' }}
          </button>
        }
        <button windowFoot type="button" class="btn btn--small btn--primary" (click)="toEntry(shown)">
          <app-icon name="expand" [size]="16" /> Zum Eintrag
        </button>
      </app-side-window>
    }
  `,
})
export class EntryPeek {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);
  /** There is a session only while a round is played. */
  private readonly round = inject(SessionStore, { optional: true });

  /** Whether the entry can be edited here. A session switches that off: it never changes the world. */
  readonly editable = input(true);
  /** Whether a session is open: then the window has the tabs of the round and of the note. */
  readonly session = input(false);
  /** Instead of going to the page of the entry, tell the page; a session uses it, because it has its own places. */
  readonly jump = input(false);
  readonly jumped = output<EntryRef>();
  /** What the players see of the entry, when a session decides it; handed on to the reading view. */
  readonly eyes = input<Eyes | null>(null);
  readonly eye = output<string>();
  readonly step = output<number>();

  protected readonly history = new WindowHistory<EntryRef>(same);
  protected readonly tab = signal('read');
  /** Every newly opened entry starts in the reading view, unless it was asked for with its form. */
  protected readonly editing = linkedSignal({ source: this.store.peek, computation: (shown) => !!shown?.edit && this.editable() });
  protected readonly view = computed(() => {
    const shown = this.store.peek();
    return shown ? viewOf(this.store, shown, null) : null;
  });
  protected readonly linkCount = computed(() => (this.view()?.links ?? []).reduce((sum, group) => sum + group.items.length, 0));
  protected readonly tabs = computed<WindowTab[]>(() => {
    const tabs: WindowTab[] = [{ id: 'read', label: 'Lesen' }, { id: 'links', label: 'Verbindungen', count: this.linkCount() }];
    return this.session() ? [...tabs, { id: 'round', label: 'Runde' }, { id: 'note', label: 'Notiz' }] : tabs;
  });

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

  /** Ask into which group of the table the entry and everything connected to it shall be laid. */
  protected layAll(ref: EntryRef): void {
    this.round?.tableWish.set({ kind: ref.kind, id: ref.id });
  }

  /** Close the window and go to the place where the entry lives. */
  protected toEntry(ref: EntryRef): void {
    this.close();
    if (this.jump()) {
      this.jumped.emit(ref);
      return;
    }
    const address = entryAddress(this.store, ref);
    void this.router.navigate(address.commands, { queryParams: address.queryParams });
  }

  /** Keep the history in step with what the window shows; every new entry starts on its first tab. */
  private follow(shown: EntryRef | null): void {
    if (!shown) {
      this.history.clear();
      return;
    }
    const before = this.history.current();
    this.history.open({ kind: shown.kind, id: shown.id });
    if (!before || !same(before, shown)) {
      this.tab.set('read');
    }
  }
}
