import { Component, computed, inject, input, output } from '@angular/core';

import { EntryKind, EntryLink, Scene } from '../../core/models';
import { npcLinks, summaryOf } from './entry-views';
import { LinkRow } from './link-row';
import { WorldStore } from './world-store';

interface Named {
  id: number;
  name: string;
}

/** Read one scene: where it plays, who appears, what is read aloud, what happens and what it points to. */
@Component({
  selector: 'app-scene-view',
  imports: [LinkRow],
  template: `
    <article class="panel">
      <header class="row row--between">
        <div>
          <span class="kicker">{{ scene().optional ? 'Optionale Szene' : 'Szene am roten Faden' }}</span>
          <h2 class="subtitle">{{ scene().name }}</h2>
        </div>
        @if (editable()) {
          <button type="button" class="btn btn--small" (click)="edit.emit()">Bearbeiten</button>
        } @else {
          <ng-content />
        }
      </header>

      <app-link-row label="Ort" [items]="place()" />
      <app-link-row label="Figuren" [items]="npcs()" />

      @if (scene().to_read) {
        <div class="read-aloud">
          <span class="kicker">Vorlesen</span>
          <p class="prose">{{ scene().to_read }}</p>
        </div>
      }
      @if (scene().text) {
        <p class="prose">{{ scene().text }}</p>
      }

      @if (showEvents() && events().length) {
        <div class="field">
          <span class="label">Ereignisse in dieser Szene</span>
          <div class="tiles tiles--wide">
            @for (event of events(); track event.id) {
              <button type="button" class="tile" (click)="lookUp(event.id)">
                <span class="kicker">Ereignis</span>
                <span class="tile__title">{{ event.name }}</span>
                @if (summary(event); as text) {
                  <span class="prose soft">{{ text }}</span>
                }
              </button>
            }
          </div>
        </div>
      }

      <app-link-row label="Führt zu" [items]="leadsTo()" />
      <app-link-row label="Kommt von" [items]="comesFrom()" />
      <app-link-row label="Quests" [items]="quests()" />
      <app-link-row label="Wissen" [items]="trivia()" />

      @if (!scene().to_read && !scene().text) {
        <p class="soft">Zu dieser Szene ist noch nichts geschrieben.</p>
      }
    </article>
  `,
})
export class SceneView {
  private readonly store = inject(WorldStore);

  readonly scene = input.required<Scene>();
  /** Whether the edit button is shown; a session puts its own buttons there. */
  readonly editable = input(true);
  /** Whether the events of the scene are listed; a session shows them itself to check them off. */
  readonly showEvents = input(true);
  readonly edit = output<void>();

  protected readonly place = computed(() => this.links('locations', this.store.locations(), [this.scene().location]));
  protected readonly npcs = computed(() => npcLinks(this.store, this.scene().npcs));
  protected readonly leadsTo = computed(() => this.links('scenes', this.store.scenes(), this.scene().leads_to));
  protected readonly comesFrom = computed(() => {
    const sources = this.store.scenes().filter((other) => other.leads_to.includes(this.scene().id));
    return this.links('scenes', sources, sources.map((source) => source.id));
  });
  protected readonly quests = computed(() => this.links('quests', this.store.quests(), this.scene().quests));
  /** The events that hang on this scene, shown with their text so they can be read in place. */
  protected readonly events = computed(() => this.store.events().filter((event) => this.scene().events.includes(event.id)));
  protected readonly trivia = computed(() => this.links('trivia', this.store.trivia(), this.scene().trivia));

  /** What an event is about, to read it right in the scene. */
  protected readonly summary = summaryOf;

  /** Look an event up in the side panel. */
  protected lookUp(id: number): void {
    this.store.peek.set({ kind: 'events', id });
  }

  private links(kind: EntryKind, entries: Named[], ids: (number | null)[]): EntryLink[] {
    return entries.filter((entry) => ids.includes(entry.id)).map((entry) => ({ kind, id: entry.id, label: entry.name }));
  }
}
