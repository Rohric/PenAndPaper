import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { Chapter } from '../../core/models';
import { TutorialButton } from '../../shared/tutorial-button';
import { WorldStore } from './world-store';

/** The chapters of a world as cards, with a form to start a new one. */
@Component({
  selector: 'app-chapter-list',
  imports: [FormsModule, RouterLink, TutorialButton],
  template: `
    <div class="stack">
      <div class="row row--between">
        <p class="soft">Hier schreibst du die Geschichte, Kapitel für Kapitel.</p>
        <app-tutorial-button topic="chapters" />
      </div>

      <form class="list-row" (ngSubmit)="create()">
        <input class="input" name="newName" aria-label="Name des neuen Kapitels" placeholder="Name des neuen Kapitels" [(ngModel)]="newName" />
        <button type="submit" class="btn btn--primary" [disabled]="!newName().trim()">Kapitel anlegen</button>
      </form>

      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }

      <div class="cards">
        @for (chapter of store.chapters(); track chapter.id) {
          <a class="card" [routerLink]="[chapter.id]">
            <span class="kicker">Kapitel {{ chapter.number }}</span>
            <span class="card__title">{{ chapter.name }}</span>
            <span class="soft">{{ summary(chapter) }}</span>
            @if (chapter.text) {
              <span class="soft clamp">{{ chapter.text }}</span>
            }
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

  /** How much is written in a chapter, as one line for its card. */
  protected summary(chapter: Chapter): string {
    const scenes = this.store.scenesOf(chapter.id).length;
    return `${scenes} Szenen · ${chapter.quests.length} Quests · ${chapter.events.length} Ereignisse`;
  }
}
