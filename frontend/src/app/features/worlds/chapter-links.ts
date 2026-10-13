import { Component, computed, inject, input, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { Chapter, questLabel } from '../../core/models';
import { LinkPicker } from '../../shared/link-picker';
import { summaryOf } from './entry-views';
import { EventScenes } from './event-scenes';
import { WorldStore } from './world-store';

interface Card {
  id: number;
  name: string;
  kicker: string;
  text: string;
  /** False for an event that is only here because it hangs on a scene of the chapter. */
  inChapter: boolean;
}

/**
 * The quests or the events of one chapter as cards to read, with adding and removing.
 * An event can also hang on scenes of the chapter; then it is listed here as well.
 */
@Component({
  selector: 'app-chapter-links',
  imports: [LinkPicker, EventScenes],
  template: `
    <div class="stack">
      @for (card of cards(); track card.id) {
        <article class="card">
          <div class="row row--between">
            <div>
              @if (card.kicker) {
                <span class="kicker">{{ card.kicker }}</span>
              }
              <h3 class="card__title">{{ card.name }}</h3>
            </div>
            <div class="row">
              <button type="button" class="btn btn--small" (click)="open(card.id)">Öffnen</button>
              @if (card.inChapter) {
                <button type="button" class="btn btn--small" (click)="unlink(card.id)">Aus dem Kapitel nehmen</button>
              }
            </div>
          </div>
          @if (card.text) {
            <p class="prose soft clamp">{{ card.text }}</p>
          }
          @if (kind() === 'events') {
            <div class="field">
              <span class="label">Hängt an Szenen (freiwillig)</span>
              <app-event-scenes [eventId]="card.id" [chapterId]="chapter().id" />
            </div>
          }
        </article>
      } @empty {
        <div class="empty">
          <p>{{ kind() === 'quests' ? 'Dieses Kapitel hat noch keine Quest.' : 'Dieses Kapitel hat noch kein Ereignis.' }}</p>
        </div>
      }

      <app-link-picker
        [chips]="false"
        [creatable]="true"
        [label]="kind() === 'quests' ? 'Quests' : 'Ereignisse'"
        [options]="kind() === 'quests' ? store.questOptions() : store.eventOptions()"
        [selected]="ids()"
        (selectedChange)="save($event)"
        (create)="createNew($event)"
      />

      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }
    </div>
  `,
})
export class ChapterLinks {
  protected readonly store = inject(WorldStore);

  readonly chapter = input.required<Chapter>();
  readonly kind = input.required<'quests' | 'events'>();

  protected readonly error = signal('');
  protected readonly ids = computed(() => this.chapter()[this.kind()]);
  protected readonly cards = computed<Card[]>(() => (this.kind() === 'quests' ? this.questCards() : this.eventCards()));

  /** Look the entry up in the side panel. */
  protected open(id: number): void {
    this.store.peek.set({ kind: this.kind(), id });
  }

  /** Take the entry out of the chapter; it stays in the glossary. */
  protected unlink(id: number): void {
    this.save(this.ids().filter((other) => other !== id));
  }

  /** Save which entries belong to the chapter. */
  protected save(ids: number[]): void {
    this.store.save('chapters', this.chapter().id, { [this.kind()]: ids }).subscribe({
      next: () => this.error.set(''),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Create a new entry in the world and put it into the chapter right away. */
  protected createNew(name: string): void {
    this.store.add<{ id: number }>(this.kind(), { name }).subscribe({
      next: (created) => this.save([...this.ids(), created.id]),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  private questCards(): Card[] {
    const quests = this.store.quests().filter((quest) => this.ids().includes(quest.id));
    return quests.map((quest) => ({ id: quest.id, name: quest.name, kicker: questLabel(quest), text: summaryOf(quest), inChapter: true }));
  }

  /** The events of the chapter together with the events that hang on one of its scenes. */
  private eventCards(): Card[] {
    const onScenes = this.store.scenesOf(this.chapter().id).flatMap((scene) => scene.events);
    const events = this.store.events().filter((event) => this.ids().includes(event.id) || onScenes.includes(event.id));
    return events.map((event) => ({
      id: event.id, name: event.name, kicker: '', text: summaryOf(event), inChapter: this.ids().includes(event.id),
    }));
  }
}
