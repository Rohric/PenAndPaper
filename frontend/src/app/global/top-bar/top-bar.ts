import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../components/basic/icon';
import { NavService } from '../frame/nav.service';

/**
 * The bar on top of the game master pages. It only says where the user is, as a path, shows the links that
 * belong to the open view and holds what the page puts there, like its search. The main menu is the rail on the left.
 */
@Component({
  selector: 'app-top-bar',
  imports: [NgTemplateOutlet, RouterLink, Icon],
  template: `
    <header class="top">
      <nav class="top__path" aria-label="Wo du bist">
        @for (crumb of nav.crumbs.items(); track $index) {
          @if (!$first) {
            <span class="top__sep" aria-hidden="true">›</span>
          }
          @if (crumb.path && !$last) {
            <a class="top__crumb" [routerLink]="crumb.path">{{ crumb.label }}</a>
          } @else {
            <span class="top__crumb" [class.top__crumb--here]="$last">{{ crumb.label }}</span>
          }
        }
      </nav>

      @if (nav.links.items().length) {
        <nav class="top__links" aria-label="Links dieser Ansicht">
          @for (item of nav.links.items(); track item.id) {
            <button type="button" class="pill" [attr.aria-pressed]="!!item.active" (click)="nav.go(item)">
              <app-icon [class]="item.tone ?? ''" [name]="item.icon" [size]="16" />
              {{ item.label }}
              @if (item.count) {
                <span class="chip chip--accent">{{ item.count }}</span>
              }
            </button>
          }
        </nav>
      }

      <div class="top__extras">
        @for (extra of nav.extras.items(); track $index) {
          <ng-container *ngTemplateOutlet="extra" />
        }
      </div>
    </header>
  `,
  styleUrl: './top-bar.scss',
})
export class TopBar {
  protected readonly nav = inject(NavService);
}
