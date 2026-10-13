import { Component, computed, inject, input, output } from '@angular/core';

import { WorldEvent } from '../../core/models';
import { EyeToggle } from '../../shared/eye-toggle';
import { Portrait } from '../../shared/portrait';
import { summaryOf } from './entry-views';
import { WorldStore } from './world-store';

/**
 * An event as a tile: its name in large letters, what sets it off, and what happens then.
 * A click looks the event up at the side. Whoever shows the tile puts its buttons inside.
 */
@Component({
  selector: 'app-event-tile',
  imports: [Portrait, EyeToggle],
  template: `
    <article class="tile kind--events">
      <button type="button" class="tile__body" (click)="store.peek.set({ kind: 'events', id: event().id })">
        <span class="tile__head">
          <app-portrait fallback="flag" [symbol]="event().symbol" [size]="36" />
          <span class="tile__names">
            <span class="kicker">Ereignis{{ marks() }}</span>
            <span class="tile__title">{{ event().name }}</span>
          </span>
        </span>
        @if (event().trigger) {
          <span class="soft"><strong>Auslöser:</strong> {{ event().trigger }}</span>
        }
        @if (text()) {
          <span [class.clamp]="!whole()" [class.prose]="whole()">{{ text() }}</span>
        }
      </button>
      @if (eye() !== null) {
        <app-eye class="tile__eye" [shown]="eye() === true" label="Für Spieler sichtbar" (toggle)="eyeToggle.emit()" />
      }
      <ng-content />
    </article>
  `,
})
export class EventTile {
  protected readonly store = inject(WorldStore);

  readonly event = input.required<WorldEvent>();
  /** Show all of what happens instead of how it begins. */
  readonly whole = input(false);
  /** More words behind the kind, like " · hängt an einer Szene". */
  readonly marks = input('');
  /** Whether the players see the event, when a session decides it; null shows no eye. */
  readonly eye = input<boolean | null>(null);
  readonly eyeToggle = output<void>();

  /** What happens; an event without that text shows how its description begins. */
  protected readonly text = computed(() => this.event().happening || summaryOf(this.event()));
}
