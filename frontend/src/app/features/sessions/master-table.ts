import { Component, TemplateRef, computed, inject, model, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EntryKind, EntryRef } from '../../core/models';
import { SessionEntryKind } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { isItem } from '../worlds/entry-views';
import { WorldStore } from '../worlds/world-store';
import { CockpitTools, Tool } from './cockpit-tools';
import { CharacterPanel } from './character-tile';
import { SessionCard } from './session-card';
import { SessionGroup } from './session-group';
import { SESSION_KINDS, SessionStore } from './session-store';

/** The name of the group for what lies on the table without a group of its own. */
const NO_GROUP = '';
const MAX_FOUND = 12;

/** A group of the table with the entries in it. */
interface TableGroup {
  name: string;
  entries: { ref: EntryRef; kind: SessionEntryKind }[];
}

/**
 * The master mode of a session, "the table": the opened scene on top in one narrow line, below it small
 * cards for everything that belongs to the scene and to its place, then the groups of the game master
 * with what he laid on the table, and the characters of the group. An entry is laid on the table with
 * "Auf den Tisch" in the bar, sorted into a group by name, moved to another group by a choice, or taken off again.
 * All of it is stored with the entries of the session; nothing here changes the world.
 */
@Component({
  selector: 'app-master-table',
  imports: [FormsModule, Icon, SessionCard, SessionGroup],
  template: `
    <ng-template #addList>
      <div class="field">
        <label for="table-search">Was soll auf den Tisch?</label>
        <input id="table-search" class="input" placeholder="Name eines Eintrags der Welt" [ngModel]="query()" (ngModelChange)="query.set($event)" />
      </div>
      <div class="field">
        <label for="table-target">In die Gruppe</label>
        <select id="table-target" class="input" [ngModel]="target()" (ngModelChange)="target.set($event)">
          @for (name of groupNames(); track name) {
            <option [value]="name">{{ label(name) }}</option>
          }
        </select>
      </div>
      <ul class="plain-list found">
        @for (found of results(); track found.kind + found.id) {
          <li>
            <button type="button" class="chip chip--link" (click)="lay(found.ref, target())">
              <app-icon name="plus" [size]="12" /> {{ found.name }} <span class="soft">· {{ found.kicker }}</span>
            </button>
          </li>
        } @empty {
          <li class="soft">{{ query().trim() ? 'Nichts gefunden.' : 'Tippe einen Namen.' }}</li>
        }
      </ul>
    </ng-template>

    <ng-template #newGroup>
      <form class="list-row" (ngSubmit)="createGroup()">
        <input class="input" name="group" aria-label="Name der Gruppe" placeholder="Name der neuen Gruppe" [ngModel]="draft()" (ngModelChange)="draft.set($event)" />
        <button type="submit" class="btn btn--small" [disabled]="!draft().trim()"><app-icon name="plus" [size]="16" /> Anlegen</button>
      </form>
      <p class="soft">Eine Gruppe bleibt, sobald ein Eintrag darin liegt.</p>
    </ng-template>

    <ng-template #sceneList>
      <ul class="plain-list found">
        @for (scene of scenes(); track scene.id) {
          <li>
            <button type="button" class="chip chip--link kind--scenes" [attr.aria-pressed]="scene.id === sceneId()" (click)="sceneId.set(scene.id)">
              {{ scene.name }}
            </button>
          </li>
        } @empty {
          <li class="soft">Das Kapitel hat noch keine Szene.</li>
        }
      </ul>
    </ng-template>

    <section class="stack">
      @if (scene(); as shown) {
        <details class="panel kind--scenes">
          <summary class="row row--between">
            <span>
              <span class="kicker kicker--kind">Szene</span>
              <strong class="subtitle">{{ shown.name }}</strong>
              @if (placeName()) {
                <span class="soft"> · {{ placeName() }}</span>
              }
            </span>
            <span class="soft">Vorlesen</span>
          </summary>
          @if (shown.to_read) {
            <div class="read-aloud"><p class="prose">{{ shown.to_read }}</p></div>
          } @else {
            <p class="soft">Zu dieser Szene ist nichts zum Vorlesen geschrieben.</p>
          }
        </details>
      } @else {
        <div class="empty"><p>Wähle mit „Szene wechseln“ eine Szene, dann siehst du hier, was dazugehört.</p></div>
      }

      <h2 class="section-title"><app-icon name="pin" /> Hier am Ort</h2>
      <div class="cards">
        @for (ref of here(); track ref.kind + ref.id) {
          <app-session-card [ref]="ref" />
        } @empty {
          <p class="soft">Zu dieser Szene und diesem Ort gehört nichts, was noch offen ist.</p>
        }
      </div>

      <h2 class="section-title"><app-icon name="flag" /> Meine Gruppen</h2>
      @for (group of groups(); track group.name) {
        <div class="panel">
          <span class="kicker">{{ label(group.name) }}</span>
          <div class="cards">
            @for (item of group.entries; track item.ref.kind + item.ref.id) {
              <div class="placed">
                <app-session-card [ref]="item.ref" />
                <div class="row">
                  <select class="input input--small" [attr.aria-label]="'Gruppe wechseln'" [ngModel]="group.name" (ngModelChange)="move(item, $event)">
                    @for (name of groupNames(); track name) {
                      <option [value]="name">{{ label(name) }}</option>
                    }
                  </select>
                  <button type="button" class="btn btn--small" (click)="take(item)"><app-icon name="close" [size]="14" /> Vom Tisch</button>
                </div>
              </div>
            } @empty {
              <p class="soft">Noch nichts in dieser Gruppe. Lege mit „Auf den Tisch“ etwas hinein.</p>
            }
          </div>
        </div>
      } @empty {
        <p class="soft">Der Tisch ist leer. Mit „Auf den Tisch“ in der Leiste legst du Einträge dazu und sortierst sie in eigene Gruppen.</p>
      }

      <h2 class="section-title kind--npcs"><app-icon name="group" /> Charaktere</h2>
      <app-session-group (open)="open.emit($event)" />
    </section>
  `,
  styles: `
    summary {
      cursor: pointer;
    }

    .found {
      list-style: none;
      padding: 0;
    }

    .placed {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .input--small {
      min-height: 32px;
      padding: 2px 8px;
    }
  `,
})
export class MasterTable {
  private readonly store = inject(SessionStore);
  private readonly world = inject(WorldStore);

  /** The opened scene; "Szene wechseln" changes it for the whole cockpit. */
  readonly sceneId = model<number | null>(null);
  /** Asks the cockpit to open the sheet, the messages or the item form of a character. */
  readonly open = output<{ kind: CharacterPanel; characterId: number }>();

  protected readonly query = signal('');
  protected readonly target = signal(NO_GROUP);
  protected readonly draft = signal('');
  /** Groups that were made but hold nothing yet; they are only kept until the page is left. */
  private readonly empty = signal<string[]>([]);

  private readonly addList = viewChild<TemplateRef<unknown>>('addList');
  private readonly newGroup = viewChild<TemplateRef<unknown>>('newGroup');
  private readonly sceneList = viewChild<TemplateRef<unknown>>('sceneList');

  protected readonly scene = computed(() => this.world.scenes().find((scene) => scene.id === this.sceneId()) ?? null);
  protected readonly scenes = computed(() => this.world.scenesOf(this.store.session()?.chapter ?? this.world.chapters()[0]?.id ?? 0));
  protected readonly placeName = computed(() => this.world.locations().find((place) => place.id === this.scene()?.location)?.name ?? '');

  /** Everything that belongs to the scene, to its place and to the characters in them, that is not done. */
  protected readonly here = computed<EntryRef[]>(() => {
    const scene = this.scene();
    if (!scene) {
      return [];
    }
    const place = scene.location;
    const people = new Set([...scene.npcs, ...this.world.npcs().filter((link) => place !== null && link.location === place).map((link) => link.npc)]);
    const open = (kind: SessionEntryKind, id: number) => !this.store.state(kind, id)?.done;
    const quests = this.world.quests().filter((quest) => {
      const now = this.world.questNow(quest);
      return open('quest', quest.id) && (scene.quests.includes(quest.id) || now.scene === scene.id || (place !== null && now.location === place));
    });
    const events = this.world.events().filter(
      (event) => open('event', event.id) && (scene.events.includes(event.id) || (place !== null && event.location === place)),
    );
    const trivia = this.world.trivia().filter(
      (entry) =>
        scene.trivia.includes(entry.id) ||
        (place !== null && entry.locations.includes(place)) ||
        entry.npcs.some((npc) => people.has(npc)) ||
        entry.quests.some((quest) => scene.quests.includes(quest)),
    );
    return [
      ...[...people].map((id): EntryRef => ({ kind: 'npcs', id })),
      ...quests.map((quest): EntryRef => ({ kind: 'quests', id: quest.id })),
      ...events.map((event): EntryRef => ({ kind: 'events', id: event.id })),
      ...trivia.map((entry): EntryRef => ({ kind: 'trivia', id: entry.id })),
    ];
  });

  /** The groups of the table, in the order of their names; what has no group comes first. */
  protected readonly groups = computed<TableGroup[]>(() => {
    const onTable = this.store.entries().filter((entry) => entry.on_table);
    return this.groupNames().map((name) => ({
      name,
      entries: onTable
        .filter((entry) => entry.table_group === name)
        .map((entry) => ({ ref: { kind: worldKind(entry.kind), id: entry.entry_id }, kind: entry.kind })),
    })).filter((group) => group.entries.length || this.empty().includes(group.name));
  });
  protected readonly groupNames = computed(() => {
    const names = new Set<string>([NO_GROUP, ...this.empty(), ...this.store.entries().filter((entry) => entry.on_table).map((entry) => entry.table_group)]);
    return [...names].sort((a, b) => Number(!!a) - Number(!!b) || a.localeCompare(b));
  });
  /** Entries of the world whose name contains the typed text. */
  protected readonly results = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return [];
    }
    const all: { ref: EntryRef; name: string; kicker: string }[] = [
      ...this.world.npcs().map((link) => ({ ref: { kind: 'npcs', id: link.npc } as EntryRef, name: link.name, kicker: 'Figur' })),
      ...this.world.locations().map((place) => ({ ref: { kind: 'locations', id: place.id } as EntryRef, name: place.name, kicker: 'Ort' })),
      ...this.world.quests().map((quest) => ({ ref: { kind: 'quests', id: quest.id } as EntryRef, name: quest.name, kicker: 'Quest' })),
      ...this.world.events().map((event) => ({ ref: { kind: 'events', id: event.id } as EntryRef, name: event.name, kicker: 'Ereignis' })),
      ...this.world.trivia().map((entry) => ({ ref: { kind: 'trivia', id: entry.id } as EntryRef, name: entry.name, kicker: isItem(entry) ? 'Gegenstand' : 'Wissen' })),
      ...this.world.scenes().map((scene) => ({ ref: { kind: 'scenes', id: scene.id } as EntryRef, name: scene.name, kicker: 'Szene' })),
    ];
    return all.filter((found) => found.name.toLowerCase().includes(query)).slice(0, MAX_FOUND).map((found) => ({ ...found, ...found.ref }));
  });

  protected readonly tools = computed<Tool[]>(() => [
    { id: 'table-add', word: 'Auf den Tisch', icon: 'plus', popup: this.addList(), popupTitle: 'Auf den Tisch legen' },
    { id: 'table-group', word: 'Gruppe anlegen', icon: 'flag', popup: this.newGroup(), popupTitle: 'Neue Gruppe' },
    { id: 'table-scene', word: 'Szene wechseln', icon: 'book', tone: 'kind--scenes', popup: this.sceneList(), popupTitle: 'Szene wechseln' },
  ]);

  constructor() {
    inject(CockpitTools).provide('view', this.tools);
  }

  /** The name of a group as it is shown. */
  protected label(name: string): string {
    return name || 'Ohne Gruppe';
  }

  /** Lay an entry of the world on the table, in a group. */
  protected lay(ref: EntryRef, group: string): void {
    const kind = SESSION_KINDS[ref.kind];
    if (kind) {
      this.store.patch(kind, ref.id, { on_table: true, table_group: group });
    }
  }

  /** Put an entry of the table into another group. */
  protected move(item: { kind: SessionEntryKind; ref: EntryRef }, group: string): void {
    this.store.patch(item.kind, item.ref.id, { table_group: group });
  }

  /** Take an entry off the table. */
  protected take(item: { kind: SessionEntryKind; ref: EntryRef }): void {
    this.store.patch(item.kind, item.ref.id, { on_table: false, table_group: NO_GROUP });
  }

  /** Make a group by its name and aim the next entry at it. */
  protected createGroup(): void {
    const name = this.draft().trim();
    if (name) {
      this.empty.update((names) => (names.includes(name) ? names : [...names, name]));
      this.target.set(name);
      this.draft.set('');
    }
  }
}

/** The kind of a world entry for a kind of the session. */
function worldKind(kind: SessionEntryKind): EntryKind {
  const kinds: Record<SessionEntryKind, EntryKind> = {
    scene: 'scenes', quest: 'quests', event: 'events', location: 'locations', npc: 'npcs', trivia: 'trivia',
  };
  return kinds[kind];
}
