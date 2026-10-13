import { Injectable, TemplateRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { IconName } from '../../components/basic/icon';
import { AuthService } from '../../core/auth.service';
import { Slot } from '../../core/slot';
import { TutorialService } from '../../core/tutorial.service';

/** The two areas of the app: the players on the phone, the game master on the desktop. */
export type Area = 'player' | 'gm';

/** One tab of the rail on the left, or one link of the view in the bar on top. */
export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  /** The colour class of a kind of entry, like "kind--quests". */
  tone?: string;
  /** A number on the tab, like new notes; nothing is shown for 0 or null. */
  count?: number | null;
  active?: boolean;
  /** Where the tab leads; a tab without a path calls click. */
  path?: string | unknown[];
  click?: () => void;
}

/** One step of the path in the bar on top: where the user is. */
export interface Crumb {
  label: string;
  path?: string | unknown[];
}

const RAIL_KEY = 'pnp.rail.open';
const HOMES: Record<Area, string> = { player: '/player/characters', gm: '/gm' };
export const AREA_LABELS: Record<Area, string> = { player: 'Spieler', gm: 'Spielleiter' };

/**
 * What the frame shows around a page: the area, the tabs on the left that are always there, and what the open
 * page reports while it is on the screen: its own tabs, the path to it, the links of its view and extras like a search.
 */
@Injectable({ providedIn: 'root' })
export class NavService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly tutorial = inject(TutorialService);
  /** The address of the open page, so tabs can mark themselves. */
  readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly area = computed<Area>(() => (this.url().startsWith('/gm') ? 'gm' : 'player'));
  readonly canSwitch = this.auth.isGameMaster;
  /** The tabs of the area that are there on every page. */
  readonly always = computed<NavItem[]>(() => (this.area() === 'gm' ? this.gameMasterTabs() : this.playerTabs()));
  /** The tabs of the place the user is at, reported by the open page. */
  readonly here = new Slot<NavItem>();
  /** The path to the open page, reported from the outermost page inwards. */
  readonly crumbs = new Slot<Crumb>();
  /** The links that only belong to the open view. */
  readonly links = new Slot<NavItem>();
  /** Small things a page puts into the bar on top, like its search or a choice. */
  readonly extras = new Slot<TemplateRef<unknown>>();
  /** The tutorial that explains the open page; the last one reported counts. */
  readonly topic = new Slot<string>();

  /** Whether the rail of the game master is drawn out, with names beside the symbols. */
  readonly railOpen = signal(localStorage.getItem(RAIL_KEY) === '1');
  /** Whether the menu of the players is drawn out from the left. */
  readonly menuOpen = signal(false);

  /** Draw the rail of the game master out or in, and remember it. */
  toggleRail(): void {
    this.railOpen.update((open) => !open);
    localStorage.setItem(RAIL_KEY, this.railOpen() ? '1' : '0');
  }

  /** Follow a tab or a link: go to its path, or do what it does. */
  go(item: NavItem): void {
    this.menuOpen.set(false);
    if (item.path === undefined) {
      item.click?.();
    } else {
      void (typeof item.path === 'string' ? this.router.navigateByUrl(item.path) : this.router.navigate(item.path));
    }
  }

  /** Open the start page of the other area. */
  switchArea(): void {
    this.menuOpen.set(false);
    void this.router.navigateByUrl(HOMES[this.area() === 'gm' ? 'player' : 'gm']);
  }

  /** Open the tutorial of the open page, or the one that introduces the area. */
  help(): void {
    this.menuOpen.set(false);
    this.tutorial.open(this.topic.items().at(-1) ?? (this.area() === 'gm' ? 'start' : 'start-player'));
  }

  private gameMasterTabs(): NavItem[] {
    const url = this.url();
    return [
      { id: 'worlds', label: 'Welten', icon: 'world', path: '/gm/worlds', active: url.startsWith('/gm/worlds') },
      { id: 'sessions', label: 'Runden', icon: 'flag', path: '/gm/sessions', active: url.startsWith('/gm/sessions') },
      { id: 'characters', label: 'Figuren', icon: 'group', path: '/gm/characters', active: url.startsWith('/gm/characters') },
    ];
  }

  private playerTabs(): NavItem[] {
    const url = this.url();
    return [
      { id: 'characters', label: 'Charaktere', icon: 'group', path: '/player/characters', active: url.startsWith('/player/characters') },
      { id: 'sessions', label: 'Runden', icon: 'flag', path: '/player/sessions', active: url.startsWith('/player/sessions') },
      { id: 'rules', label: 'Regeln', icon: 'book', click: () => this.tutorial.open('rules') },
    ];
  }
}
