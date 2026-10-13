import { Component, ElementRef, computed, effect, inject, signal } from '@angular/core';

import { AuthService } from '../core/auth.service';
import { TutorialService } from '../core/tutorial.service';
import { TUTORIAL_GROUPS, TutorialGroup } from './tutorial-content';

/** A step in the vertical line beside the text. */
interface RailItem {
  index: number;
  title: string;
  /** The heading of a chapter that begins with this step. */
  chapter?: string;
  house: boolean;
}

/**
 * The tutorial window: a popup with text only. A vertical line of steps stands on the left (numbers and titles
 * with the chapter headings between them; on the phone only the numbers), the text on the right. A menu leads to every
 * tutorial in three points: the rules, the players, the game masters. A way back leads to where the user came from.
 */
@Component({
  selector: 'app-tutorial-window',
  templateUrl: './tutorial-window.html',
  styleUrl: './tutorial-window.scss',
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class TutorialWindow {
  protected readonly tutorial = inject(TutorialService);
  private readonly auth = inject(AuthService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly menuOpen = signal(false);
  /** The point of the menu that is unfolded. */
  protected readonly unfolded = signal<TutorialGroup | null>(null);
  /** The points of the menu; the game master tutorials only for a game master. */
  protected readonly groups = computed(() =>
    TUTORIAL_GROUPS.filter((group) => group.id !== 'gm' || this.auth.isGameMaster()).map((group) => ({
      ...group,
      tutorials: this.tutorial.tutorials.filter((other) => other.group === group.id),
    })),
  );
  /** The chapters of the rules with the step each begins at. */
  protected readonly ruleChapters = computed(() =>
    (this.tutorial.tutorials.find((other) => other.id === 'rules')?.steps ?? [])
      .map((step, index) => ({ title: step.chapter ?? '', index }))
      .filter((chapter) => chapter.title),
  );
  protected readonly rail = computed<RailItem[]>(() =>
    (this.tutorial.current()?.steps ?? []).map((step, index) => ({ index, title: step.title, chapter: step.chapter, house: !!step.house })),
  );
  protected readonly shown = computed(() => this.tutorial.current()?.steps[this.tutorial.step()] ?? null);
  protected readonly isLast = computed(() => this.tutorial.step() >= (this.tutorial.current()?.steps.length ?? 1) - 1);

  constructor() {
    // Keep the open step in view in the line, which scrolls when it is long.
    effect(() => {
      this.tutorial.step();
      this.tutorial.current();
      setTimeout(() => this.host.nativeElement.querySelector('.rail__item.is-active')?.scrollIntoView({ block: 'nearest' }));
    });
  }

  /** Close the window with the escape key, when it is open. */
  protected onEscape(): void {
    if (this.tutorial.current()) {
      this.tutorial.close();
    }
  }

  /** Open another tutorial from the menu or from a step that leads to it; "id#step" names a step of it. */
  protected switchTo(target: string, step: number | string = 0): void {
    const [id, named] = target.split('#');
    this.tutorial.open(id, named ?? step);
    this.menuOpen.set(false);
  }

  /** Fold a point of the menu open, or shut when it is open already. */
  protected unfold(group: TutorialGroup): void {
    this.unfolded.set(this.unfolded() === group ? null : group);
  }

  /** Title of another tutorial, for the button that jumps to it. */
  protected titleOf(target: string): string {
    return this.tutorial.tutorials.find((other) => other.id === target.split('#')[0])?.title ?? '';
  }
}
