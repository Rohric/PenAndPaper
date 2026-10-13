import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EntryRef } from '../../core/models';
import { SESSION_KINDS, SessionStore } from '../../core/session-store';
import { WorldStore } from '../../core/world-store';
import { Popup } from '../window/popup';
import { faceOf } from './entry-face';
import { connectionsOf } from './entry-links';

const NO_GROUP = '';
const MAX_GROUP_NAME = 60;

/**
 * The question behind "Alles auf den Tisch": an entry and everything connected to it are laid on the table of
 * the game master, either into a new group, whose suggested name can be kept or changed, or into a group that
 * exists already. It opens whenever a session is asked for it and closes when the answer is given.
 */
@Component({
  selector: 'app-table-ask',
  imports: [FormsModule, Popup],
  template: `
    @if (session.tableWish(); as wish) {
      <app-popup kind="Alles auf den Tisch" [title]="name()" [size]="440" (closed)="close()">
        <p class="soft">{{ refs().length }} {{ refs().length === 1 ? 'Eintrag kommt' : 'Einträge kommen' }} auf den Tisch: dieser und alles, was mit ihm verbunden ist.</p>
        <div class="row" role="group" aria-label="Wohin die Einträge kommen">
          <button type="button" class="pill" [attr.aria-pressed]="fresh()" (click)="fresh.set(true)">Neue Gruppe</button>
          <button type="button" class="pill" [attr.aria-pressed]="!fresh()" (click)="fresh.set(false)">Bestehende Gruppe</button>
        </div>
        @if (fresh()) {
          <div class="field">
            <label for="table-ask-name">Name der neuen Gruppe</label>
            <input id="table-ask-name" class="input" [attr.maxlength]="maxName" [ngModel]="draft()" (ngModelChange)="draft.set($event)" />
          </div>
        } @else {
          <div class="field">
            <label for="table-ask-group">Gruppe</label>
            <select id="table-ask-group" class="input" [ngModel]="group()" (ngModelChange)="group.set($event)">
              @for (other of groups(); track other) {
                <option [value]="other">{{ other || 'Ohne Gruppe' }}</option>
              }
            </select>
          </div>
        }
        <button windowFoot type="button" class="btn btn--small" (click)="close()">Abbrechen</button>
        <button windowFoot type="button" class="btn btn--small btn--primary" [disabled]="fresh() && !draft().trim()" (click)="lay(wish)">Auf den Tisch</button>
      </app-popup>
    }
  `,
})
export class TableAsk {
  protected readonly session = inject(SessionStore);
  private readonly world = inject(WorldStore);

  protected readonly maxName = MAX_GROUP_NAME;
  /** Whether the entries get a group of their own. */
  protected readonly fresh = signal(true);
  /** The name of the new group; it starts as the name of the entry. */
  protected readonly draft = signal('');
  /** The existing group that was chosen. */
  protected readonly group = signal(NO_GROUP);

  protected readonly name = computed(() => {
    const wish = this.session.tableWish();
    return (wish && faceOf(this.world, wish)?.name) || 'Eintrag';
  });
  /** The entry and everything connected to it, each only once. */
  protected readonly refs = computed<EntryRef[]>(() => {
    const wish = this.session.tableWish();
    const all = wish ? [wish, ...connectionsOf(this.world, wish).flatMap((group) => group.refs)] : [];
    return all.filter((ref, index) => all.findIndex((other) => other.kind === ref.kind && other.id === ref.id) === index);
  });
  /** The groups the table has already; what has no group comes first. */
  protected readonly groups = computed(() => {
    const names = new Set([NO_GROUP, ...this.session.entries().filter((entry) => entry.on_table).map((entry) => entry.table_group)]);
    return [...names].sort((a, b) => Number(!!a) - Number(!!b) || a.localeCompare(b));
  });

  constructor() {
    // Every new question starts with a new group named like the entry.
    effect(() => {
      const name = this.session.tableWish() ? this.name() : '';
      untracked(() => {
        this.fresh.set(true);
        this.draft.set(name.slice(0, MAX_GROUP_NAME));
        this.group.set(NO_GROUP);
      });
    });
  }

  /** Lay the entries into the chosen group and close the question. */
  protected lay(wish: EntryRef): void {
    const group = this.fresh() ? this.draft().trim().slice(0, MAX_GROUP_NAME) : this.group();
    for (const ref of this.refs()) {
      const kind = SESSION_KINDS[ref.kind];
      if (kind) {
        this.session.patch(kind, ref.id, { on_table: true, table_group: group });
      }
    }
    this.close();
  }

  protected close(): void {
    this.session.tableWish.set(null);
  }
}
