import { Component, computed, inject, signal } from '@angular/core';

import { TutorialService } from '../core/tutorial.service';

/**
 * The tutorial window: a popup with text only. A menu on top leads to every tutorial,
 * the numbered line jumps between the steps, the buttons below go back, on, or skip.
 */
@Component({
  selector: 'app-tutorial-window',
  templateUrl: './tutorial-window.html',
  styleUrl: './tutorial-window.scss',
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class TutorialWindow {
  protected readonly tutorial = inject(TutorialService);

  protected readonly menuOpen = signal(false);
  protected readonly shown = computed(() => this.tutorial.current()?.steps[this.tutorial.step()] ?? null);
  protected readonly isLast = computed(() => this.tutorial.step() >= (this.tutorial.current()?.steps.length ?? 1) - 1);

  /** Close the window with the escape key, when it is open. */
  protected onEscape(): void {
    if (this.tutorial.current()) {
      this.tutorial.close();
    }
  }

  /** Open another tutorial from the menu or from a step that leads to it. */
  protected switchTo(id: string): void {
    this.tutorial.open(id);
    this.menuOpen.set(false);
  }

  /** Title of another tutorial, for the button that jumps to it. */
  protected titleOf(id: string): string {
    return this.tutorial.tutorials.find((tutorial) => tutorial.id === id)?.title ?? '';
  }
}
