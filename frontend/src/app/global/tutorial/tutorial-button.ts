import { Component, inject, input } from '@angular/core';

import { TutorialService } from '../core/tutorial.service';

/** The help button of a page: it opens the tutorial for the part of the app the user is in. */
@Component({
  selector: 'app-tutorial-button',
  template: `<button type="button" class="btn btn--small" (click)="tutorial.open(topic(), step())">{{ label() }}</button>`,
})
export class TutorialButton {
  protected readonly tutorial = inject(TutorialService);

  /** Id of the tutorial to open. */
  readonly topic = input.required<string>();
  /** The step the tutorial opens at: a number, or the name of a step like "leveling". */
  readonly step = input<number | string>(0);
  readonly label = input('? Hilfe');
}
