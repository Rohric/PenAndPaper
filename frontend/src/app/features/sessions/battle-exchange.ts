import { Component, input } from '@angular/core';

import { Exchange, ROLL_RESULTS } from '../../core/session-models';

/**
 * The attack that is open in a battle: the rolls so far and the damage it would do.
 * Whoever shows it puts the buttons for the next decision below.
 */
@Component({
  selector: 'app-battle-exchange',
  template: `
    <div class="read-aloud" role="status">
      <span class="kicker">Offener Wurf · {{ exchange().attacker_name }} greift {{ exchange().defender_name }} an</span>
      <p>Angriff: {{ exchange().attack.rolled }} gegen {{ exchange().attack.value }} · {{ results[exchange().attack.result] }}</p>
      @if (exchange().parry; as parry) {
        <p>Parade: {{ parry.rolled }} gegen {{ parry.value }} · {{ results[parry.result] }}</p>
      }
      @if (exchange().stage === 'close') {
        @if (exchange().damage; as damage) {
          <p>
            Schaden: {{ damage.dice.join(' + ') }} → <strong>{{ damage.total }}</strong>
          </p>
        } @else {
          <p>Kein Schaden.</p>
        }
      }
    </div>
  `,
})
export class BattleExchange {
  readonly exchange = input.required<Exchange>();

  protected readonly results = ROLL_RESULTS;
}
