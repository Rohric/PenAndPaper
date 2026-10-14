import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { readError } from '../../core/api-error';
import { Chapter } from '../../core/models';
import { EntryWall } from '../../components/entry/entry-wall';
import { categoryFacet, chapterTiles } from '../../components/entry/wall-tiles';
import { NameDialog } from '../../components/form/name-dialog';
import { NavService } from '../../global/frame/nav.service';
import { ToastService } from '../../global/toast/toast.service';
import { Tools } from '../../global/tool-bar/tools.service';
import { WorldStore } from '../../core/world-store';

/**
 * The chapters of a world as a wall of tiles by their number, in groups by category. A click opens the popup of a
 * chapter, and "Zum Eintrag" opens the chapter; "Neu" in the bar, or the search of the wall, starts a new one.
 */
@Component({
  selector: 'app-chapter-list',
  imports: [EntryWall, NameDialog],
  template: `
    <app-entry-wall
      id="chapters"
      placeholder="Kapitel durchsuchen …"
      [items]="tiles()"
      [offers]="offers()"
      [creatable]="true"
      empty="Noch kein Kapitel."
      emptyHint="Mit „Neu“ unten in der Leiste legst du das erste an."
      (create)="create($event)"
    />

    @if (creating()) {
      <app-name-dialog title="Neues Kapitel" label="Name des Kapitels" hint="Das Kapitel öffnet sich danach." [error]="error()" (create)="create($event)" (closed)="creating.set(false)" />
    }
  `,
})
export class ChapterList {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly creating = signal(false);
  protected readonly error = signal('');
  protected readonly tiles = computed(() => chapterTiles(this.store));
  protected readonly offers = computed(() => [categoryFacet(this.store.chapters())]);

  constructor() {
    const nav = inject(NavService);
    nav.crumbs.provide(signal([{ label: 'Kapitel' }]));
    nav.topic.provide(signal(['chapters']));
    inject(Tools).provide('view', signal([{ id: 'new', word: 'Neu', title: 'Neues Kapitel', icon: 'plus', click: () => this.creating.set(true) }]));
  }

  /** Create a chapter from the typed name and open it. */
  protected create(name: string): void {
    this.store.add<Chapter>('chapters', { name }).subscribe({
      next: (chapter) => void this.router.navigate(['/gm/worlds', this.store.worldId(), 'chapters', chapter.id]),
      error: (e: unknown) => (this.creating() ? this.error.set(readError(e)) : this.toast.show(readError(e), 'danger')),
    });
  }
}
