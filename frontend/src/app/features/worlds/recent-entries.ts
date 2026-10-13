import { Component, computed, inject, output } from '@angular/core';
import { Router } from '@angular/router';

import { EntryRef, isItem } from '../../core/models';
import { Icon, IconName } from '../../shared/icon';
import { timeAgo } from '../../shared/time-ago';
import { KIND_LABELS, openEntry } from './entry-views';
import { WorldStore } from './world-store';

const SHOWN = 8;
// An entry counts as changed when it was saved again later than a moment after it was written.
const MOMENT_MS = 2000;

/** One entry of the world with the times it was written and changed. */
interface Stamped {
  ref: EntryRef;
  label: string;
  kicker: string;
  /** The kind whose colour the tile shows. */
  tone: string;
  created: string;
  updated: string;
}

/** One of the two lists, with the entries newest first. */
interface RecentList {
  label: string;
  icon: IconName;
  empty: string;
  entries: (Stamped & { at: string })[];
}

/**
 * What was written and what was changed last in a world, across all kinds of entries, chapters
 * and scenes. A click looks an entry up at the side, or goes to the chapter or the scene.
 */
@Component({
  selector: 'app-recent-entries',
  imports: [Icon],
  template: `
    @for (list of lists(); track list.label) {
      <section class="stack">
        <h3 class="section-title"><app-icon [name]="list.icon" /> {{ list.label }}</h3>
        <div class="tiles">
          @for (entry of list.entries; track entry.ref.kind + entry.ref.id) {
            <button type="button" [class]="'tile kind--' + entry.tone" (click)="open(entry.ref)">
              <span class="kicker">{{ entry.kicker }} · {{ ago(entry.at) }}</span>
              <span class="tile__title">{{ entry.label }}</span>
            </button>
          } @empty {
            <p class="soft">{{ list.empty }}</p>
          }
        </div>
      </section>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
  `,
})
export class RecentEntries {
  private readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  /** Fired after an entry was opened, so a window around this list can close. */
  readonly opened = output<void>();

  protected readonly ago = timeAgo;
  private readonly all = computed<Stamped[]>(() => {
    const store = this.store;
    const chapter = (id: number) => store.chapters().find((other) => other.id === id)?.number ?? '?';
    return [
      ...store.locations().map((e) => stamped({ kind: 'locations', id: e.id }, e.name, KIND_LABELS.locations, 'locations', e)),
      ...store.npcs().map((e) => stamped({ kind: 'npcs', id: e.npc }, e.name, KIND_LABELS.npcs, 'npcs', e)),
      ...store.quests().map((e) => stamped({ kind: 'quests', id: e.id }, e.name, KIND_LABELS.quests, 'quests', e)),
      ...store.events().map((e) => stamped({ kind: 'events', id: e.id }, e.name, KIND_LABELS.events, 'events', e)),
      ...store.trivia().map((e) => stamped({ kind: 'trivia', id: e.id }, e.name, e.category || KIND_LABELS.trivia, isItem(e) ? 'items' : 'trivia', e)),
      ...store.chapters().map((e) => stamped({ kind: 'chapters', id: e.id }, e.name, `Kapitel ${e.number}`, 'chapters', e)),
      ...store.scenes().map((e) => stamped({ kind: 'scenes', id: e.id }, e.name, `Szene · Kapitel ${chapter(e.chapter)}`, 'scenes', e)),
    ];
  });
  protected readonly lists = computed<RecentList[]>(() => {
    const changed = this.all().filter((entry) => new Date(entry.updated).getTime() - new Date(entry.created).getTime() > MOMENT_MS);
    return [
      { label: 'Zuletzt hinzugefügt', icon: 'plus', empty: 'Noch nichts angelegt.', entries: newest(this.all(), 'created') },
      { label: 'Zuletzt bearbeitet', icon: 'edit', empty: 'Seit dem Anlegen wurde noch nichts geändert.', entries: newest(changed, 'updated') },
    ];
  });

  /** Look the entry up at the side, or go to the chapter or the scene. */
  protected open(ref: EntryRef): void {
    openEntry(this.store, this.router, ref);
    this.opened.emit();
  }
}

function stamped(ref: EntryRef, label: string, kicker: string, tone: string, entry: { created_at: string; updated_at: string }): Stamped {
  return { ref, label, kicker, tone, created: entry.created_at, updated: entry.updated_at };
}

/** The newest entries by one of the two times, each with the time it is sorted by. */
function newest(entries: Stamped[], by: 'created' | 'updated'): (Stamped & { at: string })[] {
  return [...entries]
    .sort((a, b) => b[by].localeCompare(a[by]))
    .slice(0, SHOWN)
    .map((entry) => ({ ...entry, at: entry[by] }));
}
