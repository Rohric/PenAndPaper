import { Component, computed, input } from '@angular/core';

import { SYMBOLS, Shape } from './symbols';

/** The line symbols of the user interface, each drawn from one or more paths on a 24 by 24 grid. */
const ICONS = {
  back: ['M15 18l-6-6 6-6'],
  down: ['M6 9l6 6 6-6'],
  right: ['M9 6l6 6-6 6'],
  eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  'eye-off': ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M3 3l18 18'],
  sword: ['M14.5 17.5L3 6V3h3l11.5 11.5', 'M13 19l6-6', 'M16 16l4 4', 'M19 21l2-2'],
  note: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  archive: ['M21 8v13H3V8', 'M1 3h22v5H1z', 'M10 12h4'],
  flag: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
  pin: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  dice: [
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'M8.5 8.5h.01', 'M15.5 15.5h.01', 'M12 12h.01', 'M15.5 8.5h.01', 'M8.5 15.5h.01',
  ],
  heart: ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
  mail: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M22 6l-10 7L2 6'],
  gift: ['M20 12v10H4V12', 'M2 7h20v5H2z', 'M12 22V7', 'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z', 'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'],
  sheet: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0'],
  group: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  quest: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  check: ['M20 6L9 17l-5-5'],
  plus: ['M12 5v14', 'M5 12h14'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  undo: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
  edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z'],
  search: ['M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'M21 21l-4.35-4.35'],
  expand: ['M15 3h6v6', 'M9 21H3v-6', 'M21 3l-7 7', 'M3 21l7-7'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v6', 'M14 11v6'],
  speech: ['M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'],
  clock: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 6v6l4 2'],
  image: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M7 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M21 15l-5-5L5 21'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;

/**
 * One line symbol. "name" picks a symbol of the user interface. "symbol" names one of the symbols
 * an entry or a character carries; when it is set and known it is drawn instead, and "name" is
 * only the fallback. The symbol is decoration: the button around it carries the text or the label.
 */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size()"
      [attr.height]="size()"
    >
      @for (shape of shapes(); track $index) {
        @switch (shape[0]) {
          @case ('path') {
            <path [attr.d]="shape[1]['d']" [attr.fill]="shape[1]['fill']" />
          }
          @case ('circle') {
            <circle [attr.cx]="shape[1]['cx']" [attr.cy]="shape[1]['cy']" [attr.r]="shape[1]['r']" [attr.fill]="shape[1]['fill']" />
          }
          @case ('line') {
            <line [attr.x1]="shape[1]['x1']" [attr.y1]="shape[1]['y1']" [attr.x2]="shape[1]['x2']" [attr.y2]="shape[1]['y2']" />
          }
          @case ('rect') {
            <rect
              [attr.x]="shape[1]['x']"
              [attr.y]="shape[1]['y']"
              [attr.width]="shape[1]['width']"
              [attr.height]="shape[1]['height']"
              [attr.rx]="shape[1]['rx']"
              [attr.ry]="shape[1]['ry']"
            />
          }
          @case ('ellipse') {
            <ellipse [attr.cx]="shape[1]['cx']" [attr.cy]="shape[1]['cy']" [attr.rx]="shape[1]['rx']" [attr.ry]="shape[1]['ry']" />
          }
          @case ('polyline') {
            <polyline [attr.points]="shape[1]['points']" />
          }
          @case ('polygon') {
            <polygon [attr.points]="shape[1]['points']" />
          }
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  /** Key of a symbol an entry or a character carries; empty or unknown draws "name". */
  readonly symbol = input('');
  /** Width and height in pixels. */
  readonly size = input(18);

  protected readonly shapes = computed<Shape[]>(() => SYMBOLS[this.symbol()] ?? ICONS[this.name()].map((d): Shape => ['path', { d }]));
}
