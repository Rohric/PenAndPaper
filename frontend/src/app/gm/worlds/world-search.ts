import { Component, computed, inject, viewChild } from '@angular/core';

import { readError } from '../../core/api-error';
import { EntryKind, Option, isItem } from '../../core/models';
import { SessionStore } from '../../core/session-store';
import { searchText } from '../../core/wall';
import { CreateKind, LinkPicker } from '../../components/form/link-picker';
import { KIND_LABELS, openEntry } from '../../components/entry/entry-views';
import { WorldStore } from '../../core/world-store';
import { ToastService } from '../../global/toast/toast.service';
import { GLOSSARY_SECTIONS, createEntry } from '../glossary/glossary-tiles';

const KINDS: EntryKind[] = ['locations', 'npcs', 'quests', 'events', 'trivia', 'scenes', 'chapters'];
// Ids repeat between the kinds, so an option carries its kind in the millions of its id.
const SPAN = 1_000_000;

/**
 * Search the whole world by typing: names and texts of places, characters, quests, events, items, knowledge, scenes
 * and chapters. The chosen entry opens its popup. When no entry is called like the typed text, the list offers to
 * create it as one of the kinds of the glossary and opens its form; a session creates nothing.
 */
@Component({
  selector: 'app-world-search',
  imports: [LinkPicker],
  template: `
    <app-link-picker
      single
      label="In der ganzen Welt suchen"
      emptyText="Welt durchsuchen …"
      [chips]="false"
      [creatable]="!session"
      [createKinds]="kinds"
      [options]="options()"
      (valueChange)="open($event)"
      (createAs)="create($event.name, $event.kind)"
    />
  `,
  styleUrl: './world-search.scss',
})
export class WorldSearch {
  private readonly store = inject(WorldStore);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(SessionStore, { optional: true });
  private readonly picker = viewChild(LinkPicker);

  /** The kinds of the glossary a new entry can be created as. */
  protected readonly kinds: CreateKind[] = GLOSSARY_SECTIONS.map((section) => ({ id: section.id, label: `als ${section.one}`, tone: section.id }));
  protected readonly options = computed<Option[]>(() => [
    ...this.store.locations().map((place) => this.option('locations', place.id, place.name, searchText(place))),
    ...this.store.npcs().map((link) => this.option('npcs', link.npc, link.name, searchText(link))),
    ...this.store.quests().map((quest) => this.option('quests', quest.id, quest.name, searchText(quest))),
    ...this.store.events().map((event) => this.option('events', event.id, event.name, searchText(event))),
    ...this.store.trivia().map((trivia) =>
      isItem(trivia)
        ? { ...this.option('trivia', trivia.id, trivia.name, searchText(trivia), 'Gegenstand'), tone: 'items' }
        : this.option('trivia', trivia.id, trivia.name, searchText(trivia)),
    ),
    ...this.store.scenes().map((scene) => this.option('scenes', scene.id, scene.name, `${this.chapterOf(scene.chapter)} ${searchText(scene)}`)),
    ...this.store.chapters().map((chapter) => this.option('chapters', chapter.id, chapter.name, searchText(chapter), `Kapitel ${chapter.number}`)),
  ]);

  /** Put the cursor into the search field. */
  focus(): void {
    this.picker()?.focus();
  }

  /** Open the popup of the chosen entry; in a session a scene opens in its story. */
  protected open(value: number | null): void {
    if (value !== null) {
      openEntry(this.store, { kind: KINDS[Math.floor(value / SPAN)], id: value % SPAN });
    }
  }

  /** Create an entry of the chosen kind with the typed name and open its form in the window at the side. */
  protected create(name: string, kind: string): void {
    const section = GLOSSARY_SECTIONS.find((other) => other.id === kind);
    if (section) {
      createEntry(this.store, section, name).subscribe({
        next: (ref) => this.store.read(ref, true),
        error: (e: unknown) => this.toast.show(readError(e), 'danger'),
      });
    }
  }

  private option(kind: EntryKind, id: number, label: string, text: string, word: string = KIND_LABELS[kind]): Option {
    return { id: KINDS.indexOf(kind) * SPAN + id, label, hint: `${word} · ${text}`.trim(), tone: kind };
  }

  private chapterOf(chapterId: number): string {
    const chapter = this.store.chapters().find((other) => other.id === chapterId);
    return chapter ? `Kap. ${chapter.number} ·` : '';
  }
}
