import { Component, computed, input } from '@angular/core';

import { Icon, IconName } from './icon';

/** What a portrait can say about its owner by its colour. */
export type PortraitState = 'plain' | 'turn' | 'out' | 'frozen' | 'poisoned' | 'burning' | 'marked';

/**
 * The face of an entry or a character: its symbol in a round frame, or its picture when it has one
 * and wants it shown. The frame takes the colour of the kind of its owner, or of a state like
 * "on turn" or "frozen".
 */
@Component({
  selector: 'app-portrait',
  imports: [Icon],
  template: `
    <span class="portrait" [class]="'portrait portrait--' + state()" [style.width.px]="size()" [style.height.px]="size()">
      @if (image()) {
        <img class="portrait__image" alt="" loading="lazy" decoding="async" [src]="source()" />
      } @else {
        <app-icon [name]="fallback()" [symbol]="symbol()" [size]="iconSize()" />
      }
    </span>
  `,
  styleUrl: './portrait.scss',
})
export class Portrait {
  /** Key of the symbol the owner carries; empty draws the fallback. */
  readonly symbol = input('');
  /** The symbol of the user interface that stands for this kind of owner. */
  readonly fallback = input<IconName>('sheet');
  /** Address of the picture; without one the symbol is drawn. */
  readonly image = input<string | null>(null);
  readonly state = input<PortraitState>('plain');
  /** Width and height in pixels. */
  readonly size = input(44);

  /** The picture by its path only: the address from the server names a host that a phone cannot reach. */
  protected readonly source = computed(() => (this.image() ?? '').replace(/^https?:\/\/[^/]+/, ''));
  protected readonly iconSize = computed(() => Math.round(this.size() * 0.55));
}
