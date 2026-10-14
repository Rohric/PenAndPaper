import { Component, computed, inject } from '@angular/core';

import { EntryRef } from '../../core/models';
import { Icon, IconName } from '../../components/basic/icon';
import { timeAgo } from '../../components/basic/time-ago';
import { EntryCard } from '../../components/entry/entry-card';
import { WorldStore } from '../../core/world-store';

const SHOWN = 8;
// An entry counts as changed when it was saved again later than a moment after it was written.
const MOMENT_MS = 2000;

/** One entry of the world with the times it was written and changed. */
interface Stamped {
  ref: EntryRef;
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
 * What was written and what was changed last in a world, across all kinds of entries, chapters and scenes, as the
 * same tiles as everywhere, with how long ago in the line above the name. A click opens the popup of the entry;
 * the frame of the world then closes the popup of the symbol around this list.
 */
@Component({
  selector: 'app-recent-entries',
  imports: [Icon, EntryCard],
  template: `
    @for (list of lists(); track list.label) {
      <section class="stack">
        <h3 class="section-title"><app-icon [name]="list.icon" /> {{ list.label }}</h3>
        <div class="tiles">
          @for (entry of list.entries; track entry.ref.kind + entry.ref.id) {
            <app-entry-card [ref]="entry.ref" [marks]="' · ' + ago(entry.at)" />
          } @empty {
            <p class="soft">{{ list.empty }}</p>
          }
        </div>
      </section>
    }
  `,
  styleUrl: './recent-entries.scss',
})
export class RecentEntries {
  private readonly store = inject(WorldStore);

  protected readonly ago = timeAgo;
  private readonly all = computed<Stamped[]>(() => {
    const store = this.store;
    return [
      ...store.locations().map((e) => stamped({ kind: 'locations', id: e.id }, e)),
      ...store.npcs().map((e) => stamped({ kind: 'npcs', id: e.npc }, e)),
      ...store.quests().map((e) => stamped({ kind: 'quests', id: e.id }, e)),
      ...store.events().map((e) => stamped({ kind: 'events', id: e.id }, e)),
      ...store.trivia().map((e) => stamped({ kind: 'trivia', id: e.id }, e)),
      ...store.chapters().map((e) => stamped({ kind: 'chapters', id: e.id }, e)),
      ...store.scenes().map((e) => stamped({ kind: 'scenes', id: e.id }, e)),
    ];
  });
  protected readonly lists = computed<RecentList[]>(() => {
    const changed = this.all().filter((entry) => new Date(entry.updated).getTime() - new Date(entry.created).getTime() > MOMENT_MS);
    return [
      { label: 'Zuletzt hinzugefügt', icon: 'plus', empty: 'Noch nichts angelegt.', entries: newest(this.all(), 'created') },
      { label: 'Zuletzt bearbeitet', icon: 'edit', empty: 'Seit dem Anlegen wurde noch nichts geändert.', entries: newest(changed, 'updated') },
    ];
  });
}

function stamped(ref: EntryRef, entry: { created_at: string; updated_at: string }): Stamped {
  return { ref, created: entry.created_at, updated: entry.updated_at };
}

/** The newest entries by one of the two times, each with the time it is sorted by. */
function newest(entries: Stamped[], by: 'created' | 'updated'): (Stamped & { at: string })[] {
  return [...entries]
    .sort((a, b) => b[by].localeCompare(a[by]))
    .slice(0, SHOWN)
    .map((entry) => ({ ...entry, at: entry[by] }));
}
