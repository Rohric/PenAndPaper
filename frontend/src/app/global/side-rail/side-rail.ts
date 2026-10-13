import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

import { Icon } from '../../components/basic/icon';
import { AuthService } from '../../core/auth.service';
import { AREA_LABELS, NavService } from '../frame/nav.service';

/**
 * The tabs on the left. For the game master it is a rail of symbols that can be drawn out to show the names;
 * for the players it is a menu that slides in from the left over the page. Both show the same two groups,
 * what is always there and what belongs to the place the user is at, and the account at the foot.
 */
@Component({
  selector: 'app-side-rail',
  imports: [NgTemplateOutlet, Icon],
  templateUrl: './side-rail.html',
  styleUrl: './side-rail.scss',
  host: { '(document:keydown.escape)': 'nav.menuOpen.set(false)' },
})
export class SideRail {
  protected readonly nav = inject(NavService);
  protected readonly auth = inject(AuthService);

  /** A rail that stays (game master) or a menu that slides in (players). */
  readonly mode = input<'rail' | 'menu'>('rail');

  /** Whether the names stand beside the symbols. */
  protected readonly wide = computed(() => this.mode() === 'menu' || this.nav.railOpen());
  protected readonly shown = computed(() => this.mode() === 'rail' || this.nav.menuOpen());
  protected readonly areaLabel = computed(() => AREA_LABELS[this.nav.area()]);
  protected readonly otherLabel = computed(() => `Zum ${AREA_LABELS[this.nav.area() === 'gm' ? 'player' : 'gm']}`);
}
