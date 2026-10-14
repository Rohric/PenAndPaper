import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';

import { EntryLink, EntryRef } from '../../core/models';
import { WorldStore } from '../../core/world-store';
import { Icon } from '../basic/icon';
import { Popup } from '../window/popup';
import { WindowHistory } from '../window/window-history';
import { WindowTab } from '../window/window-head';
import { chaptersOf } from './entry-face';
import { entryAddress, viewOf } from './entry-views';
import { LinkRow } from './link-row';

const same = (a: EntryRef, b: EntryRef) => a.kind === b.kind && a.id === b.id;
/** How many parts of the text the short look shows. */
const SHORT_BLOCKS = 2;

/**
 * The short look at an entry of any kind: every click on a tile or a link opens it first. It shows the beginning of
 * the text, the note of the game master and, in a session, the switches of the round; its second tab lists what the
 * entry is linked to, and a click there changes the popup to that entry. From here the way leads into the window at
 * the side (to read, or with "Bearbeiten" right into the form) or to the entry itself.
 */
@Component({
  selector: 'app-entry-popup',
  imports: [Icon, Popup, LinkRow],
  template: `
    @if (store.popup(); as shown) {
      <app-popup
        [title]="view()?.title ?? 'Eintrag'"
        [kind]="view()?.kicker ?? ''"
        [tone]="'kind--' + (view()?.tone ?? shown.kind)"
        [size]="480"
        [tabs]="tabs()"
        [(tab)]="tab"
        [canBack]="history.canBack()"
        [canForward]="history.canForward()"
        (back)="store.popup.set(history.back())"
        (forward)="store.popup.set(history.forward())"
        (closed)="store.popup.set(null)"
      >
        @if (view(); as entry) {
          @if (tab() === 'links') {
            @for (group of entry.links; track group.label) {
              <app-link-row [label]="group.label" [items]="group.items" />
            } @empty {
              <p class="soft">Dieser Eintrag ist noch mit nichts verknüpft.</p>
            }
          } @else {
            @if (entry.sub) {
              <span class="soft">{{ entry.sub }}</span>
            }
            @for (block of short(); track block.label) {
              <div class="field">
                <span class="label">{{ block.label }}</span>
                <p class="prose clamp" [class.read-aloud]="block.readAloud">{{ block.text }}</p>
              </div>
            } @empty {
              <p class="soft">Zu diesem Eintrag steht noch kein Text.</p>
            }
            <app-link-row label="Kapitel" [items]="chapters()" />
            @if (entry.note) {
              <div class="knowledge knowledge--gm">
                <span class="kicker"><app-icon name="lock" [size]="12" /> Notiz (nur für dich)</span>
                <p class="prose clamp">{{ entry.note }}</p>
              </div>
            }
            <ng-content />
          }
        } @else {
          <p class="soft">Diesen Eintrag gibt es nicht mehr.</p>
        }
        @if (editable()) {
          <button windowFoot type="button" class="btn btn--small" (click)="store.read(shown, true)"><app-icon name="edit" [size]="16" /> Bearbeiten</button>
        }
        <button windowFoot type="button" class="btn btn--small" (click)="store.read(shown)"><app-icon name="sheet" [size]="16" /> Seitenfenster</button>
        @if (hasHome(shown)) {
          <button windowFoot type="button" class="btn btn--small btn--primary" (click)="toEntry(shown)">
            <app-icon name="expand" [size]="16" /> Zum Eintrag
          </button>
        }
      </app-popup>
    }
  `,
})
export class EntryPopup {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  /** Whether "Bearbeiten" opens the form at once; a session switches that off, it never changes the world. */
  readonly editable = input(true);
  /** Instead of going to the page of the entry, tell the page; a session uses it, because it has its own places. */
  readonly jump = input(false);
  readonly jumped = output<EntryRef>();

  protected readonly history = new WindowHistory<EntryRef>(same);
  protected readonly tab = signal('short');
  protected readonly view = computed(() => {
    const shown = this.store.popup();
    return shown ? viewOf(this.store, shown, null) : null;
  });
  /** The chapters the entry is tagged with, as tags. */
  protected readonly chapters = computed<EntryLink[]>(() => {
    const shown = this.store.popup();
    return shown ? chaptersOf(this.store, shown).map((chapter) => ({ kind: 'chapters', id: chapter.id, label: `Kap. ${chapter.number}` })) : [];
  });
  /** The first parts of the text that have something written in them. */
  protected readonly short = computed(() => (this.view()?.blocks ?? []).filter((block) => block.text).slice(0, SHORT_BLOCKS));
  private readonly linkCount = computed(() => (this.view()?.links ?? []).reduce((sum, group) => sum + group.items.length, 0));
  protected readonly tabs = computed<WindowTab[]>(() => [
    { id: 'short', label: 'Kurz' },
    { id: 'links', label: 'Verbindungen', count: this.linkCount() },
  ]);

  constructor() {
    effect(() => {
      const shown = this.store.popup();
      untracked(() => this.follow(shown));
    });
  }

  /** Whether the entry has a place to go to; in a session a chapter has none. */
  protected hasHome(ref: EntryRef): boolean {
    return !(this.jump() && ref.kind === 'chapters');
  }

  /** Close the popup and go to the place where the entry lives. */
  protected toEntry(ref: EntryRef): void {
    this.store.popup.set(null);
    if (this.jump()) {
      this.jumped.emit(ref);
      return;
    }
    const address = entryAddress(this.store, ref);
    void this.router.navigate(address.commands, { queryParams: address.queryParams });
  }

  /** Keep the history in step with what the popup shows; every new entry starts on its first tab. */
  private follow(shown: EntryRef | null): void {
    if (!shown) {
      this.history.clear();
      return;
    }
    this.history.open({ kind: shown.kind, id: shown.id });
    this.tab.set('short');
  }
}
