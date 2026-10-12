import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { readError } from '../../core/api-error';
import { EntryKind, EntryRef, QUEST_KINDS } from '../../core/models';
import { MasterDetail } from '../../shared/master-detail';
import { TutorialButton } from '../../shared/tutorial-button';
import { EntryView } from './entry-view';
import { SearchHit, searchGlossary } from './entry-views';
import { EventEditor } from './event-editor';
import { LocationEditor } from './location-editor';
import { LoreEditor } from './lore-editor';
import { QuestEditor } from './quest-editor';
import { TriviaEditor } from './trivia-editor';
import { WorldNpcEditor } from './world-npc-editor';
import { Kind, WorldStore } from './world-store';

interface Section {
  /** Part of the address; for the lists it is also the kind of entry. */
  id: string;
  label: string;
  /** List of the world this section shows; the lore section has none. */
  kind?: Exclude<Kind, 'chapters' | 'scenes'>;
  newLabel?: string;
  empty?: string;
}

interface ListItem {
  id: number;
  title: string;
  sub: string;
  /** Indent level, used for places that lie inside other places. */
  depth: number;
}

const SECTIONS: Section[] = [
  { id: 'lore', label: 'Lore' },
  { id: 'locations', label: 'Orte', kind: 'locations', newLabel: 'Name des neuen Ortes', empty: 'Noch kein Ort.' },
  { id: 'npcs', label: 'Figuren', kind: 'world-npcs', newLabel: 'Name der neuen Figur', empty: 'Noch keine Figur.' },
  { id: 'quests', label: 'Quests', kind: 'quests', newLabel: 'Name der neuen Quest', empty: 'Noch keine Quest.' },
  { id: 'events', label: 'Ereignisse', kind: 'events', newLabel: 'Name des neuen Ereignisses', empty: 'Noch kein Ereignis.' },
  { id: 'trivia', label: 'Wissen', kind: 'trivia', newLabel: 'Name des neuen Eintrags', empty: 'Noch kein Wissen.' },
];

/** The glossary of a world: everything that exists in it, to search, read and edit. */
@Component({
  selector: 'app-glossary',
  imports: [
    FormsModule, RouterLink, RouterLinkActive, MasterDetail, TutorialButton, EntryView,
    LoreEditor, LocationEditor, WorldNpcEditor, QuestEditor, EventEditor, TriviaEditor,
  ],
  templateUrl: './glossary.html',
})
export class Glossary {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  /** Both come from the URL: .../glossary/:section?entry=id */
  readonly section = input('lore');
  readonly entry = input<string>();

  protected readonly sections = SECTIONS;
  protected readonly current = computed(() => SECTIONS.find((s) => s.id === this.section()) ?? SECTIONS[0]);
  protected readonly entryId = computed(() => Number(this.entry()) || null);
  protected readonly items = computed(() => this.listItems());
  protected readonly opened = computed<EntryRef | null>(() => {
    const id = this.entryId();
    const isThere = this.items().some((item) => item.id === id);
    return id !== null && isThere ? { kind: this.current().id as EntryKind, id } : null;
  });
  /** Lore has its own tutorial text in the general glossary tutorial. */
  protected readonly topic = computed(() => (this.current().kind ? this.current().id : 'glossary'));

  protected readonly newName = signal('');
  protected readonly error = signal('');
  protected readonly query = signal('');
  protected readonly hits = computed(() => (this.query().trim() ? searchGlossary(this.store, this.query()) : []));

  /** A fresh entry opens as a form, every other entry opens to read. */
  private createdId: number | null = null;
  protected readonly editing = linkedSignal({
    source: () => `${this.section()}:${this.entryId()}`,
    computation: () => this.entryId() !== null && this.entryId() === this.createdId,
  });

  protected readonly location = computed(() => this.store.locations().find((l) => l.id === this.entryId()) ?? null);
  protected readonly npcLink = computed(() => this.store.npcs().find((n) => n.npc === this.entryId()) ?? null);
  protected readonly quest = computed(() => this.store.quests().find((q) => q.id === this.entryId()) ?? null);
  protected readonly event = computed(() => this.store.events().find((e) => e.id === this.entryId()) ?? null);
  protected readonly trivia = computed(() => this.store.trivia().find((t) => t.id === this.entryId()) ?? null);

  /** Address of a section of the glossary. */
  protected linkTo(section: string): unknown[] {
    return ['/gm/worlds', this.store.worldId(), 'glossary', section];
  }

  /** Create an entry in the current section from the typed name and open its form. */
  protected create(): void {
    const kind = this.current().kind;
    if (!kind) {
      return;
    }
    this.store.add<{ id: number; npc?: number }>(kind, { name: this.newName().trim() }).subscribe({
      next: (created) => this.created(created.npc ?? created.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Open a search result in its section. */
  protected openHit(hit: SearchHit): void {
    this.query.set('');
    void this.router.navigate(this.linkTo(hit.kind), { queryParams: { entry: hit.id } });
  }

  /** Go back from the form to the reading view. */
  protected stopEditing(): void {
    this.createdId = null;
    this.editing.set(false);
  }

  /** Close the opened entry and show the list again. */
  protected close(): void {
    void this.router.navigate([], { queryParams: {} });
  }

  private created(id: number): void {
    this.newName.set('');
    this.error.set('');
    this.createdId = id;
    void this.router.navigate([], { queryParams: { entry: id } });
  }

  private listItems(): ListItem[] {
    const flat = (id: number, title: string, sub = ''): ListItem => ({ id, title, sub, depth: 0 });
    switch (this.current().kind) {
      case 'locations':
        return this.locationTree(null, 0, new Set());
      case 'world-npcs':
        return this.store.npcs().map((n) => flat(n.npc, n.name, n.profession));
      case 'quests':
        return this.store.quests().map((q) => flat(q.id, q.name, QUEST_KINDS.find((k) => k.id === q.kind)?.label));
      case 'events':
        return this.store.events().map((e) => flat(e.id, e.name));
      case 'trivia':
        return this.triviaByCategory().map((t) => flat(t.id, t.name, t.category));
      default:
        return [];
    }
  }

  /** Knowledge grouped by its category; entries without one come last. */
  private triviaByCategory() {
    const rank = (category: string) => (category ? `0${category.toLowerCase()}` : '1');
    return [...this.store.trivia()].sort((a, b) => rank(a.category).localeCompare(rank(b.category)));
  }

  /** Places as a tree: every place is followed by the places that lie inside it. */
  private locationTree(parent: number | null, depth: number, seen: Set<number>): ListItem[] {
    return this.store
      .locations()
      .filter((location) => location.parent === parent && !seen.has(location.id))
      .flatMap((location) => {
        seen.add(location.id);
        const item = { id: location.id, title: location.name, sub: '', depth };
        return [item, ...this.locationTree(location.id, depth + 1, seen)];
      });
  }
}
