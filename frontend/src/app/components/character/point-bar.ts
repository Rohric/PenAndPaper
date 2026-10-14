import { Component, computed, input } from '@angular/core';

/** How full a bar is, in percent of its maximum; never below 0 or above 100. */
export function barPercent(value: number, max: number): number {
  return max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
}

/**
 * One bar of a character, like the life points or the second bar a world names: its name, the points and
 * how full it is. The one building block for both, so they always look alike.
 */
@Component({
  selector: 'app-point-bar',
  template: `
    <span class="point-bar__text">{{ label() }} {{ value() }} von {{ max() }}</span>
    <span class="meter" role="meter" aria-valuemin="0" [attr.aria-label]="label()" [attr.aria-valuenow]="value()" [attr.aria-valuemax]="max()">
      <span class="meter__fill" [class]="'meter__fill meter__fill--' + tone()" [style.width.%]="percent()"></span>
    </span>
  `,
  styleUrl: './point-bar.scss',
})
export class PointBar {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly tone = input<'life' | 'second'>('life');

  protected readonly percent = computed(() => barPercent(this.value(), this.max()));
}
