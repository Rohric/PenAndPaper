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
  styles: `
    .roll {
      display: flex;
      gap: 14px;
      align-items: center;
      padding: 10px 14px;
      border: 1px solid var(--line-2);
      border-left-width: 4px;
      border-radius: var(--radius-sm);
      background: var(--surface-2);
    }

    // The face of the die with the rolled number.
    .roll__die {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border: 2px solid currentColor;
      border-radius: 14px;
      font-family: var(--font-display);
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
    }

    .roll__die.is-spinning {
      animation: tumble 0.3s linear infinite;
    }

    .roll__text {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .roll__result {
      font-size: 18px;
    }

    // The colour says how the roll turned out; the word beside it says the same.
    .roll--critical {
      border-left-color: var(--accent);
    }

    .roll--critical .roll__die,
    .roll--critical .roll__result {
      color: var(--accent);
    }

    .roll--success {
      border-left-color: var(--ok);
    }

    .roll--success .roll__die,
    .roll--success .roll__result {
      color: var(--ok);
    }

    .roll--failure {
      border-left-color: var(--soft);
    }

    .roll--fumble {
      border-left-color: var(--danger);
    }

    .roll--fumble .roll__die,
    .roll--fumble .roll__result {
      color: var(--danger);
    }

    // The W100 from 1 to 100 in its four zones, with a mark where the roll landed.
    .scale {
      position: relative;
      display: flex;
      height: 8px;
      margin-top: 6px;
      border-radius: 999px;
      background: var(--bg);
    }

    .scale__zone--critical {
      border-radius: 999px 0 0 999px;
      background: var(--accent);
    }

    .scale__zone--success {
      background: var(--ok);
    }

    .scale__zone--failure {
      background: var(--line-2);
    }

    .scale__zone--fumble {
      border-radius: 0 999px 999px 0;
      background: var(--danger);
    }

    .scale__mark {
      position: absolute;
      top: -5px;
      width: 4px;
      height: 18px;
      margin-left: -2px;
      border-radius: 2px;
      background: var(--text);
      box-shadow: 0 0 0 2px var(--surface-2);
    }

    @keyframes tumble {
      0% {
        transform: rotate(-8deg);
      }
      50% {
        transform: rotate(8deg);
      }
      100% {
        transform: rotate(-8deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .roll__die.is-spinning {
        animation: none;
      }
    }
  `,
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
