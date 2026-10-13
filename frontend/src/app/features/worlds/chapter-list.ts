import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { Chapter } from '../../core/models';
import { Icon } from '../../shared/icon';
import { TutorialButton } from '../../shared/tutorial-button';
import { WorldStore } from './world-store';

/** The chapters of a world as tiles, with a form to start a new one. */
@Component({
  selector: 'app-chapter-list',
  imports: [FormsModule, RouterLink, Icon, TutorialButton],
  template: `
    <div class="stack">
      <div class="row row--between">
        <h2 class="section-title kind--chapters"><app-icon name="book" /> Kapitel</h2>
        <app-tutorial-button topic="chapters" />
      </div>

      <form class="list-row" (ngSubmit)="create()">
        <input class="input" name="newName" aria-label="Name des neuen Kapitels" placeholder="Name des neuen Kapitels" [(ngModel)]="newName" />
        <button type="submit" class="btn btn--primary" [disabled]="!newName().trim()"><app-icon name="plus" [size]="16" /> Kapitel anlegen</button>
      </form>

      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }

      <div class="tiles tiles--wide">
        @for (chapter of store.chapters(); track chapter.id) {
          <a class="tile tile--link kind--chapters" [routerLink]="[chapter.id]">
            <span class="kicker">Kapitel {{ chapter.number }}</span>
            <span class="tile__title">{{ chapter.name }}</span>
            @if (chapter.text) {
              <span class="soft clamp">{{ chapter.text }}</span>
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
          <p>Noch kein Kapitel. Gib oben einen Namen ein und leg das erste an.</p>
        </div>
      }
    </div>
  `,
})
export class ChapterList {
  protected readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  protected readonly newName = signal('');
  protected readonly error = signal('');

  /** Create a chapter from the typed name and open it. */
  protected create(): void {
    this.store.add<Chapter>('chapters', { name: this.newName().trim() }).subscribe({
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
