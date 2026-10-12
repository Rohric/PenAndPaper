import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { readError } from '../../core/api-error';
import { QUEST_KINDS } from '../../core/models';
import { MasterDetail } from '../../shared/master-detail';
import { ChapterEditor } from './chapter-editor';
import { EventEditor } from './event-editor';
import { LocationEditor } from './location-editor';
import { LoreEditor } from './lore-editor';
import { QuestEditor } from './quest-editor';
import { TimelineEditor } from './timeline-editor';
import { WorldNpcEditor } from './world-npc-editor';
import { Kind, WorldStore } from './world-store';

interface Section {
  id: string;
  label: string;
  /** List of the world this section shows; the lore section has none. */
  kind?: Kind;
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
  { id: 'timeline', label: 'Zeitleiste', kind: 'timeline', newLabel: 'Titel des neuen Eintrags', empty: 'Die Zeitleiste ist noch leer.' },
  { id: 'chapters', label: 'Kapitel', kind: 'chapters', newLabel: 'Name des neuen Kapitels', empty: 'Noch kein Kapitel.' },
];

/** The writing tool for one world: its sections, the list of the current section and the opened entry. */
@Component({
  selector: 'app-world-workspace',
  imports: [
    FormsModule, RouterLink, RouterLinkActive, MasterDetail, LoreEditor, LocationEditor,
    WorldNpcEditor, QuestEditor, EventEditor, TimelineEditor, ChapterEditor,
  ],
  providers: [WorldStore],
  templateUrl: './world-workspace.html',
  styleUrl: './world-workspace.scss',
})
export class WorldWorkspace {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  /** All three come from the URL: /gm/worlds/:worldId/:section?entry=id */
  readonly worldId = input.required<string>();
  readonly section = input('lore');
  readonly entry = input<string>();

  protected readonly sections = SECTIONS;
  protected readonly current = computed(() => SECTIONS.find((s) => s.id === this.section()) ?? SECTIONS[0]);
  protected readonly entryId = computed(() => Number(this.entry()) || null);
  protected readonly newName = signal('');
  protected readonly error = signal('');
  protected readonly items = computed(() => this.listItems());

  protected readonly location = computed(() => this.find(this.store.locations()));
  protected readonly npc = computed(() => this.find(this.store.npcs()));
  protected readonly quest = computed(() => this.find(this.store.quests()));
  protected readonly event = computed(() => this.find(this.store.events()));
  protected readonly timelineEntry = computed(() => this.find(this.store.timeline()));
  protected readonly chapter = computed(() => this.find(this.store.chapters()));
  protected readonly hasOpenEntry = computed(() => this.items().some((item) => item.id === this.entryId()));

  constructor() {
    effect(() => this.store.load(Number(this.worldId())));
  }

  /** Create an entry in the current section from the typed name and open it. */
  protected create(): void {
    const kind = this.current().kind;
    if (!kind) {
      return;
    }
    const name = this.newName().trim();
    this.store.add<{ id: number }>(kind, kind === 'timeline' ? { title: name } : { name }).subscribe({
      next: (created) => this.created(created.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Close the opened entry and show the list again. */
  protected close(): void {
    void this.router.navigate([], { queryParams: {} });
  }

  private created(id: number): void {
    this.newName.set('');
    this.error.set('');
    void this.router.navigate([], { queryParams: { entry: id } });
  }

  private find<T extends { id: number }>(entries: T[]): T | null {
    return entries.find((entry) => entry.id === this.entryId()) ?? null;
  }

  private listItems(): ListItem[] {
    const flat = (id: number, title: string, sub = ''): ListItem => ({ id, title, sub, depth: 0 });
    switch (this.current().kind) {
      case 'locations':
        return this.locationTree(null, 0, new Set());
      case 'world-npcs':
        return this.store.npcs().map((n) => flat(n.id, n.name, n.profession));
      case 'quests':
        return this.store.quests().map((q) => flat(q.id, q.name, QUEST_KINDS.find((k) => k.id === q.kind)?.label));
      case 'events':
        return this.store.events().map((e) => flat(e.id, e.name));
      case 'timeline':
        return this.store.timeline().map((t) => flat(t.id, t.title, `Tag ${t.day}`));
      case 'chapters':
        return this.store.chapters().map((c) => flat(c.id, c.name, `Kapitel ${c.number}`));
      default:
        return [];
    }
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
