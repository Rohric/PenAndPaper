import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import { Icon } from '../../components/basic/icon';
import { Popup } from '../../components/window/popup';
import { NavItem, NavService } from '../frame/nav.service';
import { PlayerTools } from './player-tools';
import { Tool } from './tools.service';

/**
 * The bar at the bottom of every player page, built for the phone. Two rows: the symbols of the open page on top,
 * the main symbols below. The main row always starts with the menu; behind it stand the symbols of the page when
 * it reports some, otherwise the tabs that are always there. A symbol either does something at once or opens a
 * popup. A page that needs the bottom for itself covers the bar.
 */
@Component({
  selector: 'app-player-tool-bar',
  imports: [NgTemplateOutlet, Icon, Popup],
  template: `
    @if (!tools.covered()) {
      <nav class="bar" aria-label="Seiten">
        @if (view().length) {
          <div class="bar__row bar__row--small">
            @for (tool of view(); track tool.id) {
              <ng-container *ngTemplateOutlet="item; context: { $implicit: tool }" />
            }
          </div>
        }
        <div class="bar__row">
          @for (tool of main(); track tool.id) {
            <ng-container *ngTemplateOutlet="item; context: { $implicit: tool }" />
          }
        </div>
      </nav>
      <div class="bar__space" [class.bar__space--two]="view().length"></div>
    }

    <ng-template #item let-tool>
      <button
        type="button"
        class="symbol"
        [class.is-active]="tool.pressed || openId() === tool.id"
        [disabled]="tool.disabled"
        [attr.aria-pressed]="tool.pressed ?? null"
        [attr.aria-label]="(tool.title ?? tool.word) + (tool.count ? ', ' + tool.count : '')"
        (click)="use(tool)"
      >
        <app-icon [name]="tool.icon" [size]="22" />
        {{ tool.word }}
        @if (tool.count) {
          <span class="symbol__badge">{{ tool.count }}</span>
        } @else if (tool.alert) {
          <span class="symbol__dot"></span>
        }
      </button>
    </ng-template>

    @if (open(); as shown) {
      <app-popup [title]="shown.popupTitle ?? shown.word" [size]="360" (closed)="openId.set(null)">
        <ng-container *ngTemplateOutlet="shown.popup!; context: { $implicit: shown }" />
      </app-popup>
    }
  `,
  styleUrl: './player-tool-bar.scss',
})
export class PlayerToolBar {
  protected readonly tools = inject(PlayerTools);
  private readonly nav = inject(NavService);

  protected readonly view = this.tools.of('view');
  protected readonly openId = signal<string | null>(null);
  /** The main row: the menu, then the symbols of the page when it has some, otherwise the tabs that are always there. */
  protected readonly main = computed<Tool[]>(() => {
    const own = this.tools.of('always')();
    const menu: Tool = { id: 'menu', word: 'Menü', icon: 'menu', pressed: this.nav.menuOpen(), click: () => this.nav.menuOpen.set(true) };
    return [menu, ...(own.length ? own : this.nav.always().map((tab) => this.asTool(tab)))];
  });
  /** The tool whose popup is open; gone as soon as the page takes the tool away. */
  protected readonly open = computed<Tool | null>(() => {
    const id = this.openId();
    return [...this.main(), ...this.view()].find((tool) => tool.id === id && tool.popup) ?? null;
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

  private asTool(tab: NavItem): Tool {
    return { id: `nav-${tab.id}`, word: tab.label, icon: tab.icon, pressed: !!tab.active, click: () => this.nav.go(tab) };
  }
}
