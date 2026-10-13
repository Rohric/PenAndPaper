import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Scene } from '../../core/models';

/**
 * The thread of a chapter: the scenes that should happen, numbered in the order of the game master,
 * and below them the optional scenes that can be used wherever they fit.
 */
@Component({
  selector: 'app-scene-thread',
  imports: [FormsModule],
  templateUrl: './scene-thread.html',
  styleUrl: './scene-thread.scss',
})
export class SceneThread {
  /** All scenes of the chapter, in their order. */
  readonly scenes = input.required<Scene[]>();
  /** Id of the opened scene. */
  readonly selected = input<number | null>(null);
  /** Whether scenes can be added and moved; a session only reads the thread. */
  readonly editable = input(true);
  /** Ids of the scenes a session has played. */
  readonly done = input<number[]>([]);
  readonly open = output<number>();
  readonly add = output<{ name: string; optional: boolean }>();
  /** Asks to move a scene of the thread up (-1) or down (1). */
  readonly move = output<{ id: number; by: number }>();

  protected readonly thread = computed(() => this.scenes().filter((scene) => !scene.optional));
  protected readonly optional = computed(() => this.scenes().filter((scene) => scene.optional));
  /** The scenes the opened scene leads to; they are marked in both lists. */
  protected readonly next = computed(() => {
    const opened = this.scenes().find((scene) => scene.id === this.selected());
    return new Set(opened?.leads_to ?? []);
  });
  protected readonly newOnThread = signal('');
  protected readonly newOptional = signal('');

  /** Ask for a new scene with the typed name, on the thread or optional. */
  protected create(optional: boolean): void {
    const name = optional ? this.newOptional : this.newOnThread;
    this.add.emit({ name: name().trim(), optional });
    name.set('');
  }
}
