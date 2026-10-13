import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { TutorialService } from '../../core/tutorial.service';
import { Icon } from '../../shared/icon';
import { Popup } from '../../shared/popup';
import { Tool } from '../sessions/cockpit-tools';
import { PlayerTools } from './player-tools';

/**
 * The bar at the bottom of every player page, built for the phone. Two rows: the symbols of the open page on top,
 * the main symbols below. Outside a session the main row leads to characters and sessions, the rules and the account.
 * A symbol either does something at once or opens a popup above itself. A page that needs the bottom for itself covers the bar.
 */
@Component({
  selector: 'app-player-bar',
  imports: [NgTemplateOutlet, Icon, Popup],
  template: `
    @if (!tools.covered()) {
      <nav class="bar" aria-label="Seiten">
        @if (tools.of('view')().length) {
          <div class="bar__row bar__row--small">
            @for (tool of tools.of('view')(); track tool.id) {
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
      <div class="bar__space"></div>
    }

    <ng-template #item let-tool>
      <button
        type="button"
        class="symbol"
        [class.is-active]="tool.pressed || openId() === tool.id"
        [disabled]="tool.disabled"
        [attr.aria-pressed]="tool.pressed ?? null"
        [attr.aria-label]="(tool.title ?? tool.word) + (tool.count ? ', ' + tool.count : '')"
        (click)="use(tool, $event)"
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

    <ng-template #account>
      <p class="soft">{{ auth.account()?.username }}</p>
      <button type="button" class="btn" (click)="tutorial.open('start-player'); closePopup()">Hilfe zur App</button>
      @if (auth.isGameMaster()) {
        <button type="button" class="btn" (click)="toGameMaster()">Zum Spielleiter</button>
      }
      <button type="button" class="btn" (click)="auth.logout()">Abmelden</button>
    </ng-template>

    @if (open(); as shown) {
      <app-popup [title]="shown.popupTitle ?? shown.word" [anchor]="anchor()" [size]="360" (closed)="openId.set(null)">
        <ng-container *ngTemplateOutlet="shown.popup!; context: { $implicit: shown }" />
      </app-popup>
    }
  `,
  styleUrl: './player-bar.scss',
})
export class PlayerBar {
  protected readonly tools = inject(PlayerTools);
  protected readonly auth = inject(AuthService);
  protected readonly tutorial = inject(TutorialService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url },
  );
  private readonly account = viewChild<TemplateRef<unknown>>('account');
  protected readonly openId = signal<string | null>(null);
  protected readonly anchor = signal<HTMLElement | null>(null);
  /** The main row: the symbols of the page when it has some, otherwise the usual way around the app. */
  protected readonly main = computed<Tool[]>(() => {
    const own = this.tools.of('always')();
    return own.length ? own : this.standard();
  });
  /** The tool whose popup is open; gone as soon as the page takes the tool away. */
  protected readonly open = computed<Tool | null>(() => {
    const id = this.openId();
    return [...this.tools.of('always')(), ...this.tools.of('view')(), ...this.standard()].find((tool) => tool.id === id && tool.popup) ?? null;
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

  protected closePopup(): void {
    this.openId.set(null);
  }

  /** Leave the player pages for the game master pages. */
  protected toGameMaster(): void {
    this.closePopup();
    void this.router.navigate(['/gm']);
  }

  private standard(): Tool[] {
    const url = this.url();
    return [
      { id: 'nav-characters', word: 'Charaktere', icon: 'group', pressed: url.startsWith('/player/characters'), click: () => void this.router.navigate(['/player/characters']) },
      { id: 'nav-sessions', word: 'Runden', icon: 'flag', pressed: url.startsWith('/player/sessions'), click: () => void this.router.navigate(['/player/sessions']) },
      { id: 'nav-rules', word: 'Regeln', icon: 'book', click: () => this.tutorial.open('rules') },
      { id: 'nav-account', word: 'Konto', icon: 'sheet', popup: this.account(), popupTitle: 'Konto' },
    ];
  }
}
