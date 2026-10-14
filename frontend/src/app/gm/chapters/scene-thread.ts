import { Component, computed, input, output } from '@angular/core';

import { Scene } from '../../core/models';
import { Fold } from '../../components/basic/fold';
import { ROUND_MARK } from '../../components/entry/entry-views';

/**
 * The thread of a chapter: the scenes that should happen, numbered in the order of the game master,
 * and below them the optional scenes that can be used wherever they fit. Both groups fold at their title.
 */
@Component({
  selector: 'app-scene-thread',
  imports: [Fold],
  templateUrl: './scene-thread.html',
  styleUrl: './scene-thread.scss',
})
export class SceneThread {
  /** All scenes of the chapter, in their order. */
  readonly scenes = input.required<Scene[]>();
  /** Id of the opened scene. */
  readonly selected = input<number | null>(null);
  /** Ids of the scenes a session has played. */
  readonly done = input<number[]>([]);
  readonly open = output<number>();

  /** The mark of a scene that only this round has; the world never loads one. */
  protected readonly mark = ROUND_MARK;

  protected readonly thread = computed(() => this.scenes().filter((scene) => !scene.optional));
  protected readonly optional = computed(() => this.scenes().filter((scene) => scene.optional));
  /** The scenes the opened scene leads to; they are marked in both lists. */
  protected readonly next = computed(() => {
    const opened = this.scenes().find((scene) => scene.id === this.selected());
    return new Set(opened?.leads_to ?? []);
  });
}
