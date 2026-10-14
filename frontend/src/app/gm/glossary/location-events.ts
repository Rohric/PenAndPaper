import { Component, computed, inject, input, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { WorldEvent } from '../../core/models';
import { WorldStore } from '../../core/world-store';
import { LinkPicker } from '../../components/form/link-picker';

/**
 * The events that happen at a place. An event has one place, and the link is stored at the event,
 * so every change here is saved right away: an event added here moves to this place, one taken off has no place.
 */
@Component({
  selector: 'app-location-events',
  imports: [LinkPicker],
  template: `
    <app-link-picker
      inputId="location-events"
      label="Ereignisse an diesem Ort"
      emptyText="Ereignis suchen oder neu anlegen …"
      [creatable]="true"
      [options]="store.eventOptions()"
      [selected]="selected()"
      (selectedChange)="change($event)"
      (create)="createNew($event)"
      (look)="store.look({ kind: 'events', id: $event })"
    />
    @if (error()) {
      <p class="notice notice--error" role="alert">{{ error() }}</p>
    }
  `,
})
export class LocationEvents {
  protected readonly store = inject(WorldStore);

  readonly placeId = input.required<number>();

  protected readonly error = signal('');
  protected readonly selected = computed(() => this.store.events().filter((event) => event.location === this.placeId()).map((event) => event.id));

  /** Save every event that came to this place or left it. */
  protected change(ids: number[]): void {
    const before = this.selected();
    this.store
      .events()
      .filter((event) => ids.includes(event.id) !== before.includes(event.id))
      .forEach((event) => this.save(event.id, ids.includes(event.id) ? this.placeId() : null));
  }

  /** Create a new event with the typed name, at this place right away. */
  protected createNew(name: string): void {
    this.store.add<WorldEvent>('events', { name, location: this.placeId() }).subscribe({
      next: () => this.error.set(''),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  private save(eventId: number, location: number | null): void {
    this.store.save('events', eventId, { location }).subscribe({
      next: () => this.error.set(''),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }
}
