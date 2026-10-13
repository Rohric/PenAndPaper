import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { EntryKind, EntryRef } from '../../core/models';
import { Icon } from '../../shared/icon';
import { TutorialButton } from '../../shared/tutorial-button';
import { EntryForm } from './entry-form';
import { EntryView } from './entry-view';
import { GLOSSARY_SECTIONS, GlossarySection, GlossaryTiles, SectionId } from './glossary-tiles';
import { LoreEditor } from './lore-editor';
import { WorldStore } from './world-store';

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
 * The glossary of a world: everything that exists in it. Every part is a wall of tiles; a click
 * looks an entry up at the side, and from there its whole page can be opened to read and edit.
 */
@Component({
  selector: 'app-glossary',
  imports: [RouterLink, RouterLinkActive, Icon, TutorialButton, EntryForm, EntryView, GlossaryTiles, LoreEditor],
  templateUrl: './glossary.html',
  styles: `
    .tabs app-tutorial-button {
      align-self: center;
      margin-left: auto;
    }
  `,
})
export class Glossary {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  /** Both come from the URL: .../glossary/:section?entry=id */
  readonly section = input('lore');
  readonly entry = input<string>();

  protected readonly sections = GLOSSARY_SECTIONS;
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
  protected readonly topic = computed(() => {
    const section = this.current();
    return section ? TOPICS[section.id] : 'glossary';
  });
  /** Every page starts in the reading view. */
  protected readonly editing = linkedSignal({ source: () => `${this.section()}:${this.entry()}`, computation: () => false });

  /** Address of a part of the glossary. */
  protected linkTo(section: string): unknown[] {
    return ['/gm/worlds', this.store.worldId(), 'glossary', section];
  }

  /** Leave the whole page of an entry and show the tiles again. */
  protected close(): void {
    void this.router.navigate([], { queryParams: {} });
  }
}
