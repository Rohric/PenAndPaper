import { Component, computed, effect, input, signal, untracked } from '@angular/core';

import { Check, ROLL_RESULTS } from '../../core/session-models';

const TICK_MS = 55;
const SPIN_TICKS = 12;
const W100 = 100;

/**
 * One roll made visible: the die tumbles for a moment and then shows its number. A check also shows
 * where the number lies between critical success, success, failure and fumble; free dice and
 * damage show every die and the sum. Whoever has motion switched off sees the result at once.
 */
@Component({
  selector: 'app-dice-roll',
  template: `
    <div class="roll" [class]="'roll roll--' + tone()" role="status">
      <span class="roll__die" [class.is-spinning]="!settled()">{{ face() }}</span>
      <div class="roll__text">
        @if (label()) {
          <span class="kicker">{{ label() }}</span>
        }
        @if (check(); as rolled) {
          <strong class="roll__result">{{ settled() ? results[rolled.result] : 'würfelt …' }}</strong>
          <span class="soft">gegen {{ rolled.value }}</span>
          <div class="scale" aria-hidden="true">
            <span class="scale__zone scale__zone--critical" [style.width.%]="zones().critical"></span>
            <span class="scale__zone scale__zone--success" [style.width.%]="zones().success"></span>
            <span class="scale__zone scale__zone--failure" [style.width.%]="zones().failure"></span>
            <span class="scale__zone scale__zone--fumble" [style.width.%]="zones().fumble"></span>
            @if (settled()) {
              <span class="scale__mark" [style.left.%]="rolled.rolled"></span>
            }
          </div>
        } @else if (dice(); as rolled) {
          <strong class="roll__result">{{ settled() ? 'Summe ' + total() : 'würfelt …' }}</strong>
          <span class="soft">{{ rolled.length > 1 ? rolled.join(' + ') : 'ein Würfel' }}{{ note() ? ' · ' + note() : '' }}</span>
        }
      </div>
    </div>
  `,
  styleUrl: './dice-roll.scss',
})
export class DiceRoll {
  /** What was rolled on, like "Angriff" or "Schwertkampf". */
  readonly label = input('');
  /** A check: the value it was rolled against, the roll and how it turned out. */
  readonly check = input<Check | null>(null);
  /** Free dice or damage: every die, their sum, and a word about the sum if needed. */
  readonly dice = input<number[] | null>(null);
  readonly total = input<number | null>(null);
  readonly note = input('');

  protected readonly results = ROLL_RESULTS;
  /** The number on the die: random while it tumbles, then the roll. */
  protected readonly face = signal<number | string>('');
  protected readonly settled = signal(false);
  private readonly final = computed(() => this.check()?.rolled ?? this.total());
  /** Only another result lets the die tumble again, not every reload of the same one. */
  private readonly key = computed(() => JSON.stringify([this.label(), this.check(), this.dice(), this.total()]));
  protected readonly tone = computed(() => (this.settled() ? (this.check()?.result ?? 'plain') : 'plain'));
  /** How wide the four zones of a check are, in percent of the W100. */
  protected readonly zones = computed(() => {
    const value = Math.min(W100, this.check()?.value ?? 0);
    const critical = Math.max(1, Math.floor(value / 10));
    const fumble = Math.max(1, Math.floor((W100 - value) / 10));
    const success = Math.max(0, value - critical);
    return { critical, success, fumble, failure: Math.max(0, W100 - critical - success - fumble) };
  });
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    effect((onCleanup) => {
      this.key();
      untracked(() => this.tumble());
      onCleanup(() => clearInterval(this.timer));
    });
  }

  /** Show random numbers for a moment, then the roll. */
  private tumble(): void {
    const final = this.final();
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (final === null || still) {
      this.face.set(final ?? '');
      this.settled.set(true);
      return;
    }
    let ticks = SPIN_TICKS;
    this.settled.set(false);
    this.timer = setInterval(() => {
      ticks -= 1;
      this.face.set(ticks > 0 ? 1 + Math.floor(Math.random() * Math.max(10, final)) : final);
      if (ticks <= 0) {
        clearInterval(this.timer);
        this.settled.set(true);
      }
    }, TICK_MS);
  }
}
