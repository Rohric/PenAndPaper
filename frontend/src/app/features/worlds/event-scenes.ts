import { Component, computed, inject, input, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { Option, Scene } from '../../core/models';
import { LinkPicker } from '../../shared/link-picker';
import { sceneLinks } from './entry-views';
import { WorldStore } from './world-store';

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
    />
    @if (error()) {
      <p class="notice notice--error" role="alert">{{ error() }}</p>
    }
  `,
})
export class EventScenes {
  private readonly store = inject(WorldStore);

  readonly eventId = input.required<number>();
  /** Offer only the scenes of this chapter; without it all scenes of the world are offered. */
  readonly chapterId = input<number | null>(null);

  protected readonly error = signal('');
  private readonly scenes = computed(() => {
    const chapter = this.chapterId();
    return chapter === null ? this.store.scenes() : this.store.scenesOf(chapter);
  });
  /** Inside a chapter the name is enough, across the world the chapter number is added. */
  protected readonly options = computed<Option[]>(() =>
    this.chapterId() === null
      ? sceneLinks(this.store, this.scenes()).map((link) => ({ id: link.id, label: link.label }))
      : this.scenes().map((scene) => ({ id: scene.id, label: scene.name })),
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
      next: () => this.error.set(''),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }
}
