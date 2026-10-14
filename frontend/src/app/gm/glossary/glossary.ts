import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { Router } from '@angular/router';

import { Folds } from '../../core/folds';
import { EntryKind, EntryRef } from '../../core/models';
import { foldScope, foldTools } from '../../components/basic/fold';
import { Portrait } from '../../components/basic/portrait';
import { Crumb, NavService } from '../../global/frame/nav.service';
import { Tool, Tools } from '../../global/tool-bar/tools.service';
import { EntryForm } from './entry-form';
import { EntryView } from '../../components/entry/entry-view';
import { viewOf } from '../../components/entry/entry-views';
import { GLOSSARY_SECTIONS, GlossarySection, GlossaryTiles, SectionId } from './glossary-tiles';
import { LoreEditor } from '../worlds/lore-editor';
import { WorldStore } from '../../core/world-store';

/** The kind of entry a part of the glossary shows on a whole page. */
const PAGE_KINDS: Record<SectionId, EntryKind> = {
  locations: 'locations',
  npcs: 'npcs',
  quests: 'quests',
  events: 'events',
  items: 'trivia',
  trivia: 'trivia',
};

/** Which tutorial explains a part of the glossary. */
const TOPICS: Record<SectionId, string> = {
  locations: 'locations',
  npcs: 'npcs',
  quests: 'quests',
  events: 'events',
  items: 'trivia',
  trivia: 'trivia',
};

/**
 * The glossary of a world: everything that exists in it. Every part is a wall of tiles; a click opens the popup of
 * an entry, and from there its whole page. The whole page of an entry and the lore are read here and edited with
 * "Bearbeiten" in the bar at the bottom; the page itself has no buttons.
 */
@Component({
  selector: 'app-glossary',
  imports: [Portrait, EntryForm, EntryView, GlossaryTiles, LoreEditor],
  templateUrl: './glossary.html',
})
export class Glossary {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);
  private readonly folds = inject(Folds);

  /** Both come from the URL: .../glossary/:section?entry=id */
  readonly section = input('lore');
  readonly entry = input<string>();

  /** The opened part; the lore of the world is none of the lists. */
  protected readonly current = computed<GlossarySection | null>(() => GLOSSARY_SECTIONS.find((s) => s.id === this.section()) ?? null);
  private readonly entryId = computed(() => Number(this.entry()) || null);
  /** The entry that fills the whole page, when the address names one. */
  protected readonly opened = computed<EntryRef | null>(() => {
    const section = this.current();
    const id = this.entryId();
    return section && id !== null ? { kind: PAGE_KINDS[section.id], id } : null;
  });
  /** The lore is explained in the general tutorial of the glossary. */
  private readonly topic = computed(() => {
    const section = this.current();
    return [section ? TOPICS[section.id] : 'glossary'];
  });
  /** The part of the glossary and, on its whole page, the entry. */
  private readonly crumbs = computed<Crumb[]>(() => {
    const page = this.opened();
    const part: Crumb = { label: this.current()?.label ?? 'Lore', path: this.linkTo(this.section()) };
    return page ? [part, { label: viewOf(this.store, page, null)?.title ?? 'Eintrag' }] : [part];
  });
  /** Every page starts in the reading view. */
  protected readonly editing = linkedSignal({ source: () => `${this.section()}:${this.entry()}`, computation: () => false });
  /** "Bearbeiten" and the folding for the whole page of an entry, "Bearbeiten" for the lore; a wall reports its own. */
  private readonly pageTools = computed<Tool[]>(() => {
    const editing = this.editing();
    if (this.current() && !this.opened()) {
      return [];
    }
    const what = this.opened() ? 'Eintrag' : 'Lore';
    const edit: Tool = {
      id: 'edit', word: editing ? 'Lesen' : 'Bearbeiten', title: editing ? 'Zurück zum Lesen' : `${what} bearbeiten`,
      icon: editing ? 'eye' : 'edit', pressed: editing, click: () => this.editing.set(!editing),
    };
    return this.opened() ? [edit, ...foldTools(this.folds, foldScope(this.store))] : [edit];
  });

  constructor() {
    const nav = inject(NavService);
    nav.crumbs.provide(this.crumbs);
    nav.topic.provide(this.topic);
    inject(Tools).provide('view', this.pageTools);
  }

  /** Address of a part of the glossary. */
  protected linkTo(section: string): unknown[] {
    return ['/gm/worlds', this.store.worldId(), 'glossary', section];
  }

  /** Leave the whole page of an entry and show the tiles again. */
  protected close(): void {
    void this.router.navigate([], { queryParams: {} });
  }
}
