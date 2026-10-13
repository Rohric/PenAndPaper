import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import { Icon } from '../../components/basic/icon';
import { Popup } from '../../components/window/popup';
import { Tools, Tool } from './tools.service';

/**
 * The bar of tools at the bottom of every game master page, in three parts: what is always there, what belongs to the
 * view, and what is always there again on the right. Every symbol has its word and a number like the bar of
 * the players. A symbol either does something at once or opens a popup above itself; only one is open.
 */
@Component({
  selector: 'app-gm-tool-bar',
  imports: [NgTemplateOutlet, Icon, Popup],
  template: `
    <nav class="tools" aria-label="Werkzeuge">
      @for (part of parts; track part.id) {
        @if (part.tools().length) {
          <div class="tools__part" [class.tools__part--right]="part.id === 'right'">
            @for (tool of part.tools(); track tool.id) {
              <button
                type="button"
                class="tool"
                [class.is-active]="tool.pressed || openId() === tool.id"
                [disabled]="tool.disabled"
                [attr.aria-pressed]="tool.pressed ?? null"
                [attr.aria-expanded]="tool.popup ? openId() === tool.id : null"
                [attr.title]="tool.title ?? tool.word"
                [attr.aria-label]="(tool.title ?? tool.word) + (tool.count ? ', ' + tool.count : '')"
                (click)="use(tool)"
              >
                <app-icon [class]="tool.tone ?? ''" [name]="tool.icon" [size]="20" />
                <span class="tool__word">{{ tool.word }}</span>
                @if (tool.count) {
                  <span class="tool__badge">{{ tool.count }}</span>
                } @else if (tool.alert) {
                  <span class="tool__dot"></span>
                }
              </button>
            }
          </div>
        }
      }
    </nav>

    @if (open(); as tool) {
      <app-popup [title]="tool.popupTitle ?? tool.word" [size]="tool.wide ? 880 : 520" (closed)="openId.set(null)">
        <ng-container *ngTemplateOutlet="tool.popup!; context: { $implicit: tool }" />
      </app-popup>
    }
  `,
  styleUrl: './gm-tool-bar.scss',
})
export class GmToolBar {
  private readonly tools = inject(Tools);

  protected readonly parts = [
    { id: 'always', tools: this.tools.of('always') },
    { id: 'view', tools: this.tools.of('view') },
    { id: 'right', tools: this.tools.of('right') },
  ];
  protected readonly openId = signal<string | null>(null);
  /** The tool whose popup is open; gone as soon as the view takes the tool away. */
  protected readonly open = computed<Tool | null>(() => {
    const id = this.openId();
    return this.parts.flatMap((part) => part.tools()).find((tool) => tool.id === id && tool.popup) ?? null;
  });

  constructor() {
    effect(() => {
      this.tools.dismissed();
      untracked(() => this.openId.set(null));
    });
  }

  /** A click on a symbol: open its popup or close it again, or do what the symbol does. */
  protected use(tool: Tool): void {
    if (tool.popup) {
      this.openId.set(this.openId() === tool.id ? null : tool.id);
      return;
    }
    this.openId.set(null);
    tool.click?.();
  }
}
