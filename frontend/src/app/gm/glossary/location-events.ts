import { Component, computed, inject, input } from '@angular/core';

import { readError } from '../../core/api-error';
import { WorldEvent } from '../../core/models';
import { WorldStore } from '../../core/world-store';
import { ToastService } from '../../global/toast/toast.service';
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
      [options]="options()"
      [selected]="selected()"
      (selectedChange)="change($event)"
      (create)="createNew($event)"
      (look)="store.look({ kind: 'events', id: $event })"
    />
  `,
})
export class LocationEvents {
  protected readonly store = inject(WorldStore);
  private readonly toast = inject(ToastService);

  readonly placeId = input.required<number>();

  /** The events that may move here: in a round only its own, because playing never changes the world. */
  private readonly events = computed(() => this.store.written.events().filter((event) => this.store.mayWrite({ kind: 'events', id: event.id })));
  protected readonly options = computed(() => {
    const ids = new Set(this.events().map((event) => event.id));
    return this.store.eventOptions().filter((option) => ids.has(option.id));
  });
  protected readonly selected = computed(() => this.events().filter((event) => event.location === this.placeId()).map((event) => event.id));

  /** Save every event that came to this place or left it. */
  protected change(ids: number[]): void {
    const before = this.selected();
    this.events()
      .filter((event) => ids.includes(event.id) !== before.includes(event.id))
      .forEach((event) => this.save(event.id, ids.includes(event.id) ? this.placeId() : null));
  }

  /** Create a new event with the typed name, at this place right away. */
  protected createNew(name: string): void {
    this.store.add<WorldEvent>('events', { name, location: this.placeId() }).subscribe({
      error: (e: unknown) => this.toast.show(readError(e), 'danger'),
    });
  }

  private save(eventId: number, location: number | null): void {
    this.store.save('events', eventId, { location }).subscribe({
      error: (e: unknown) => this.toast.show(readError(e), 'danger'),
    });
  }
}
