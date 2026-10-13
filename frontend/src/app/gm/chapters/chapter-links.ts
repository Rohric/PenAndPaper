import { Component, computed, inject, input, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { Chapter, Quest, WorldEvent } from '../../core/models';
import { Icon } from '../../shared/icon';
import { LinkPicker } from '../../shared/link-picker';
import { EventScenes } from './event-scenes';
import { EventTile } from './event-tile';
import { QuestTile } from './quest-tile';
import { WorldStore } from './world-store';

/** An event that plays a part in the chapter. */
interface ChapterEvent {
  event: WorldEvent;
  /** False for an event that is only here because it hangs on a scene of the chapter. */
  inChapter: boolean;
}

/**
 * The quests or the events of one chapter as tiles, with adding, editing and removing.
 * What hangs on a scene of the chapter is listed here as well.
 */
@Component({
  selector: 'app-chapter-links',
  imports: [Icon, LinkPicker, EventScenes, EventTile, QuestTile],
  template: `
    <div class="stack">
      <app-link-picker
        [chips]="false"
        [creatable]="true"
        [label]="kind() === 'quests' ? 'Quest zum Kapitel hinzufügen' : 'Ereignis zum Kapitel hinzufügen'"
        [emptyText]="kind() === 'quests' ? 'Quest suchen oder neu anlegen …' : 'Ereignis suchen oder neu anlegen …'"
        [options]="kind() === 'quests' ? store.questOptions() : store.eventOptions()"
        [selected]="ids()"
        (selectedChange)="save($event)"
        (create)="createNew($event)"
      />

      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }

      <div class="tiles tiles--wide">
        @if (kind() === 'quests') {
          @for (quest of quests(); track quest.id) {
            <app-quest-tile [quest]="quest">
              <div class="row">
                <button type="button" class="btn btn--small" (click)="edit(quest.id)"><app-icon name="edit" [size]="16" /> Bearbeiten</button>
                @if (ids().includes(quest.id)) {
                  <button type="button" class="btn btn--small" (click)="unlink(quest.id)">
                    <app-icon name="close" [size]="16" /> Aus dem Kapitel nehmen
                  </button>
                }
              </div>
            </app-quest-tile>
          }
        } @else {
          @for (item of events(); track item.event.id) {
            <app-event-tile [event]="item.event">
              <div class="field">
                <span class="label">Hängt an Szenen (freiwillig)</span>
                <app-event-scenes [eventId]="item.event.id" [chapterId]="chapter().id" />
              </div>
              <div class="row">
                <button type="button" class="btn btn--small" (click)="edit(item.event.id)"><app-icon name="edit" [size]="16" /> Bearbeiten</button>
                @if (item.inChapter) {
                  <button type="button" class="btn btn--small" (click)="unlink(item.event.id)">
                    <app-icon name="close" [size]="16" /> Aus dem Kapitel nehmen
                  </button>
                }
              </div>
            </app-event-tile>
          }
        }
      </div>

      @if (isEmpty()) {
        <div class="empty">
          <p>{{ kind() === 'quests' ? 'Dieses Kapitel hat noch keine Quest.' : 'Dieses Kapitel hat noch kein Ereignis.' }}</p>
        </div>
      }
    </div>
  `,
})
export class ChapterLinks {
  protected readonly store = inject(WorldStore);

  readonly chapter = input.required<Chapter>();
  readonly kind = input.required<'quests' | 'events'>();

  protected readonly error = signal('');
  /** What the chapter itself names; scenes can add more. */
  protected readonly ids = computed(() => this.chapter()[this.kind()]);
  private readonly scenes = computed(() => this.store.scenesOf(this.chapter().id));
  /** The quests of the chapter, of its scenes, and those that come up in one of its scenes. */
  protected readonly quests = computed<Quest[]>(() => {
    const scenes = this.scenes();
    const onScenes = scenes.flatMap((scene) => scene.quests);
    const here = (quest: Quest) => this.ids().includes(quest.id) || onScenes.includes(quest.id) || scenes.some((scene) => scene.id === quest.scene);
    return this.store.quests().filter(here);
  });
  /** The events of the chapter together with the events that hang on one of its scenes. */
  protected readonly events = computed<ChapterEvent[]>(() => {
    const onScenes = this.scenes().flatMap((scene) => scene.events);
    return this.store
      .events()
      .filter((event) => this.ids().includes(event.id) || onScenes.includes(event.id))
      .map((event) => ({ event, inChapter: this.ids().includes(event.id) }));
  });
  protected readonly isEmpty = computed(() => (this.kind() === 'quests' ? !this.quests().length : !this.events().length));

  /** Open the form of the entry in the window at the side. */
  protected edit(id: number): void {
    this.store.peek.set({ kind: this.kind(), id, edit: true });
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
}
