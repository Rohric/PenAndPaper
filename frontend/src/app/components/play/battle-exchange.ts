import { Component, computed, input } from '@angular/core';

import { Exchange } from '../../core/session-models';
import { DiceRoll } from './dice-roll';

/**
 * What is open in a battle and does not count yet: an attack with its rolls for attack, parry and
 * damage, or another action with or without a check. Every roll is shown as a die with its result.
 * Whoever shows it puts the buttons for the next decision below.
 */
@Component({
  selector: 'app-battle-exchange',
  imports: [DiceRoll],
  template: `
    @if (exchange().kind === 'action') {
      <span class="kicker">Offen · Aktion von {{ exchange().attacker_name }}</span>
      <p class="read-aloud">{{ exchange().label }}</p>
      @if (exchange().attack; as rolled) {
        <app-dice-roll label="Probe" [check]="rolled" />
      } @else {
        <p class="soft">Ohne Wurf.</p>
      }
    } @else {
      <span class="kicker">Offen · {{ exchange().attacker_name }} greift {{ exchange().defender_name }} an</span>
      @if (exchange().attack; as hit) {
        <app-dice-roll label="Angriff" [check]="hit" />
      }
      @if (exchange().parry; as parry) {
        <app-dice-roll label="Parade" [check]="parry" />
      }
      @if (exchange().stage === 'close') {
        @if (exchange().damage; as damage) {
          <app-dice-roll label="Schaden" [dice]="damage.dice" [total]="damage.total" [note]="damageNote()" />
        } @else {
          <p class="soft">Kein Schaden.</p>
        }
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  `,
})
export class BattleExchange {
  readonly exchange = input.required<Exchange>();

  /** A word about the sum of the damage: a critical hit counts its dice twice. */
  protected readonly damageNote = computed(() => (this.exchange().attack?.result === 'critical' ? 'kritisch, Würfel zählen doppelt' : ''));
}
