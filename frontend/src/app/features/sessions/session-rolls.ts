import { Component, input } from '@angular/core';

import { ROLL_RESULTS, Roll } from '../../core/session-models';

/** The latest checks rolled in a session, newest first. */
@Component({
  selector: 'app-session-rolls',
  template: `
    @for (roll of rolls(); track $index) {
      <div class="row row--between">
        <span><strong>{{ roll.who }}</strong> · {{ roll.label }} {{ roll.value }}</span>
        <span class="chip" [class.chip--accent]="roll.result === 'critical'" [class.chip--danger]="roll.result === 'fumble'">
          {{ roll.rolled }} · {{ labels[roll.result] }}
        </span>
      </div>
    } @empty {
      <p class="soft">Noch kein Wurf.</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
  `,
})
export class SessionRolls {
  readonly rolls = input.required<Roll[]>();
  protected readonly labels = ROLL_RESULTS;
}
