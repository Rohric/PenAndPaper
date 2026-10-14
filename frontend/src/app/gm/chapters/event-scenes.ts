import { Component, computed, inject, input } from '@angular/core';

import { readError } from '../../core/api-error';
import { Option, Scene } from '../../core/models';
import { LinkPicker } from '../../components/form/link-picker';
import { sceneLinks } from '../../components/entry/entry-views';
import { WorldStore } from '../../core/world-store';
import { ToastService } from '../../global/toast/toast.service';

/**
 * Hang an event on scenes. It is optional, and it is saved right away,
 * because the link is stored at the scene and not at the event.
 */
@Component({
  selector: 'app-event-scenes',
  imports: [LinkPicker],
  template: `
    <app-link-picker
      label="Szenen"
      emptyText="Hängt an keiner Szene."
      [options]="options()"
      [selected]="selected()"
      (selectedChange)="change($event)"
      (look)="store.look({ kind: 'scenes', id: $event })"
    />
  `,
})
export class EventScenes {
  protected readonly store = inject(WorldStore);
  private readonly toast = inject(ToastService);

  readonly eventId = input.required<number>();

  /** The scenes that may take the event: in a round only its own, because playing never changes the world. */
  private readonly scenes = computed(() => this.store.written.scenes().filter((scene) => this.store.mayWrite({ kind: 'scenes', id: scene.id })));
  /** Every scene that may take the event, with the number of its chapter. */
  protected readonly options = computed<Option[]>(() =>
    sceneLinks(this.store, this.scenes()).map((link) => ({ id: link.id, label: link.label, tone: 'scenes' })),
  );
  protected readonly selected = computed(() =>
    this.scenes()
      .filter((scene) => scene.events.includes(this.eventId()))
      .map((scene) => scene.id),
  );

  /** Save every scene the event was hung on or taken off. */
  protected change(ids: number[]): void {
    const before = this.selected();
    this.scenes()
      .filter((scene) => ids.includes(scene.id) !== before.includes(scene.id))
      .forEach((scene) => this.save(scene, ids.includes(scene.id)));
  }

  private save(scene: Scene, attach: boolean): void {
    const id = this.eventId();
    const events = attach ? [...scene.events, id] : scene.events.filter((other) => other !== id);
    this.store.save('scenes', scene.id, { events }).subscribe({
      error: (e: unknown) => this.toast.show(readError(e), 'danger'),
    });
  }
}
