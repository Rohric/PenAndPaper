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
        <img class="portrait__image" alt="" [src]="image()" />
      } @else {
        <app-icon [name]="fallback()" [symbol]="symbol()" [size]="iconSize()" />
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
    }

    .portrait {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 2px solid var(--kind, var(--line-2));
      border-radius: 50%;
      background: var(--surface-2);
      color: var(--kind, var(--soft));
    }

    .portrait__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    // The states: whose turn it is, who is out, and the statuses a game master gives.
    .portrait--turn {
      border-color: var(--accent);
      color: var(--accent);
      box-shadow: 0 0 0 3px rgb(227 166 92 / 30%);
    }

    .portrait--out {
      border-style: dashed;
      border-color: var(--danger);
      color: var(--muted);
      filter: grayscale(1);
      opacity: 0.6;
    }

    .portrait--frozen {
      border-color: var(--info);
      background: #17303a;
      color: var(--info);
    }

    .portrait--poisoned {
      border-color: var(--ok);
      background: #1f2f1a;
      color: var(--ok);
    }

    .portrait--burning {
      border-color: var(--danger);
      background: #3a211b;
      color: var(--danger);
    }

    .portrait--marked {
      border-color: var(--soft);
      color: var(--text);
    }
  `,
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

  protected readonly iconSize = computed(() => Math.round(this.size() * 0.55));
}
