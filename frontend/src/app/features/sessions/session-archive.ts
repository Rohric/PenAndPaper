import { Component, computed, inject } from '@angular/core';

import { SessionEntryKind } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { WorldStore } from '../worlds/world-store';
import { SessionStore } from './session-store';

interface Row {
  id: number;
  name: string;
}

/** The archive of a session: the quests and events it is done with, each with a way back. */
@Component({
  selector: 'app-session-archive',
  imports: [Icon],
  template: `
    @for (group of groups(); track group.label) {
      <div class="panel">
        <h3 class="section-title">{{ group.label }}</h3>
        @for (entry of group.rows; track entry.id) {
          <div class="row row--between">
            <button type="button" class="chip chip--link" (click)="world.peek.set({ kind: group.list, id: entry.id })">{{ entry.name }}</button>
            <button type="button" class="btn btn--small" (click)="store.toggle(group.kind, entry.id, 'done')">
              <app-icon name="undo" [size]="16" /> Zurückholen
            </button>
          </div>
        } @empty {
          <p class="soft">Noch nichts erledigt.</p>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `,
})
export class SessionArchive {
  protected readonly store = inject(SessionStore);
  protected readonly world = inject(WorldStore);

  protected readonly groups = computed(() => [
    { label: 'Erledigte Quests', kind: 'quest' as const, list: 'quests' as const, rows: this.done('quest', this.world.quests()) },
    { label: 'Erledigte Ereignisse', kind: 'event' as const, list: 'events' as const, rows: this.done('event', this.world.events()) },
  ]);

  private done(kind: SessionEntryKind, entries: Row[]): Row[] {
    return entries.filter((entry) => this.store.state(kind, entry.id)?.done);
  }
}
