import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { Chapter } from '../../core/models';
import { NameDialog } from '../../components/form/name-dialog';
import { NavService } from '../../global/frame/nav.service';
import { Tools } from '../../global/tool-bar/tools.service';
import { RecentEntries } from '../worlds/recent-entries';
import { WorldStore } from '../../core/world-store';

/** The chapters of a world as tiles, and below what was written and changed last; "Neu" in the bar starts a chapter. */
@Component({
  selector: 'app-chapter-list',
  imports: [RouterLink, RecentEntries, NameDialog],
  template: `
    <div class="stack">
      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }

      <div class="tiles tiles--wide">
        @for (chapter of store.chapters(); track chapter.id) {
          <a class="tile tile--link kind--chapters" [routerLink]="[chapter.id]">
            <span class="kicker">Kapitel {{ chapter.number }}</span>
            <span class="tile__title">{{ chapter.name }}</span>
            @if (chapter.description) {
              <span class="soft clamp">{{ chapter.description }}</span>
            }
            <span class="row">
              @for (count of counts(chapter); track count) {
                <span class="chip">{{ count }}</span>
              }
            </span>
          </a>
        }
      </div>

      @if (!store.chapters().length) {
        <div class="empty">
          <p>Noch kein Kapitel. Mit „Neu“ unten in der Leiste legst du das erste an.</p>
        </div>
      }

      <app-recent-entries />
    </div>

    @if (creating()) {
      <app-name-dialog title="Neues Kapitel" label="Name des Kapitels" [error]="error()" (create)="create($event)" (closed)="creating.set(false)" />
    }
  `,
})
export class ChapterList {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  protected readonly creating = signal(false);
  protected readonly error = signal('');

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
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** How much is written in a chapter, as small labels for its tile. */
  protected counts(chapter: Chapter): string[] {
    const scenes = this.store.scenesOf(chapter.id).length;
    return [`${scenes} Szenen`, `${chapter.quests.length} Quests`, `${chapter.events.length} Ereignisse`];
  }
}
