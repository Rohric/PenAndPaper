import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import { Icon } from '../../shared/icon';
import { Popup } from '../../shared/popup';
import { CockpitTools, Tool } from './cockpit-tools';

/**
 * The bar of tools at the bottom of the cockpit, in three parts: what is always there, what belongs to the
 * view, and what is always there again on the right. Every symbol has its word and a number like the bar of
 * the players. A symbol either does something at once or opens a popup above itself; only one is open.
 */
@Component({
  selector: 'app-tool-bar',
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
                [attr.aria-label]="tool.word + (tool.count ? ', ' + tool.count : '')"
                (click)="use(tool, $event)"
              >
                <app-icon [class]="tool.tone ?? ''" [name]="tool.icon" [size]="20" />
                <span class="tool__word">{{ tool.word }}</span>
                @if (tool.count) {
                  <span class="tool__badge">{{ tool.count }}</span>
                }
              </button>
            }
          </div>
        }
      }
    </nav>

    @if (open(); as tool) {
      <app-popup [title]="tool.popupTitle ?? tool.word" [anchor]="anchor()" [size]="tool.wide ? 880 : 520" (closed)="openId.set(null)">
        <ng-container *ngTemplateOutlet="tool.popup!; context: { $implicit: tool }" />
      </app-popup>
    }
  `,
  styleUrl: './tool-bar.scss',
})
export class ToolBar {
  private readonly tools = inject(CockpitTools);

  protected readonly parts = [
    { id: 'always', tools: this.tools.of('always') },
    { id: 'view', tools: this.tools.of('view') },
    { id: 'right', tools: this.tools.of('right') },
  ];
  protected readonly openId = signal<string | null>(null);
  protected readonly anchor = signal<HTMLElement | null>(null);
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
  protected use(tool: Tool, event: MouseEvent): void {
    if (tool.popup) {
      this.anchor.set(event.currentTarget as HTMLElement);
      this.openId.set(this.openId() === tool.id ? null : tool.id);
      return;
    }
    this.openId.set(null);
    tool.click?.();
  }
}
