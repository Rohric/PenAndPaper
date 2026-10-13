import { Component, input } from '@angular/core';

import { ROLL_RESULTS, Roll } from '../../core/session-models';
import { Icon } from '../basic/icon';

/** The latest rolls of a session, newest first: checks with their result, free dice with their sum. */
@Component({
  selector: 'app-session-rolls',
  imports: [Icon],
  template: `
    @for (roll of rolls(); track $index) {
      <div class="row row--between">
        <span>
          @if (roll.secret) {
            <app-icon name="lock" [size]="14" />
          }
          <strong>{{ roll.who }}</strong> · {{ roll.label }}{{ roll.result ? ' ' + roll.value : '' }}
        </span>
        @if (roll.result; as result) {
          <span class="chip" [class.chip--accent]="result === 'critical'" [class.chip--danger]="result === 'fumble'">
            {{ roll.rolled }} · {{ labels[result] }}
          </span>
        } @else {
          <span class="chip">{{ roll.dice?.join(' + ') }}{{ (roll.dice?.length ?? 0) > 1 ? ' = ' + roll.total : '' }}</span>
        }
      </div>
    } @empty {
      <p class="soft">Noch kein Wurf.</p>
    }
  `,
  styleUrl: './session-rolls.scss',
})
export class SessionRolls {
  readonly rolls = input.required<Roll[]>();
  protected readonly labels = ROLL_RESULTS;
}
