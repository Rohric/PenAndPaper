import { Component, TemplateRef, computed, effect, inject, input, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { IconName } from '../../components/basic/icon';
import { EntryPopup } from '../../components/entry/entry-popup';
import { EntryPeek } from '../../components/entry/entry-window';
import { WorldStore } from '../../core/world-store';
import { Crumb, NavItem, NavService } from '../../global/frame/nav.service';
import { Tool, Tools } from '../../global/tool-bar/tools.service';
import { GLOSSARY_SECTIONS } from '../glossary/glossary-tiles';
import { RecentEntries } from './recent-entries';
import { WorldSearch } from './world-search';

/**
 * The frame of one world. It loads the world once and reports what the frame of the game master shows around
 * its pages: the parts of the world as tabs on the left (the chapters, the lore and the parts of the glossary),
 * the path to the world and the search on top, and "Zuletzt" in the bar at the bottom.
 */
@Component({
  selector: 'app-world-workspace',
  imports: [RouterOutlet, EntryPeek, EntryPopup, RecentEntries, WorldSearch],
  providers: [WorldStore],
  templateUrl: './world-workspace.html',
})
export class WorldWorkspace {
  protected readonly store = inject(WorldStore);
  protected readonly tools = inject(Tools);
  private readonly nav = inject(NavService);

  /** From the URL: /gm/worlds/:worldId/... */
  readonly worldId = input.required<string>();

  private readonly searchBox = viewChild<TemplateRef<unknown>>('searchBox');
  private readonly recentPop = viewChild<TemplateRef<unknown>>('recentPop');
  private readonly base = computed(() => `/gm/worlds/${this.worldId()}`);

  /** The parts of the world as the tabs on the left. */
  private readonly tabs = computed<NavItem[]>(() => [
    this.tab('chapters', 'Kapitel', 'book', 'chapters', 'kind--chapters'),
    this.tab('lore', 'Lore', 'archive', 'glossary/lore'),
    ...GLOSSARY_SECTIONS.map((part) => this.tab(part.id, part.label, part.icon, `glossary/${part.id}`, `kind--${part.id}`)),
  ]);
  private readonly crumbs = computed<Crumb[]>(() => [
    { label: 'Welten', path: '/gm/worlds' },
    { label: this.store.world()?.name ?? 'Welt', path: `${this.base()}/chapters` },
  ]);
  private readonly extras = computed(() => [this.searchBox()].filter((extra): extra is TemplateRef<unknown> => !!extra));
  private readonly worldTools = computed<Tool[]>(() => [
    { id: 'recent', word: 'Zuletzt', icon: 'clock', popup: this.recentPop(), popupTitle: 'Zuletzt angelegt und bearbeitet', wide: true },
  ]);

  constructor() {
    effect(() => this.store.load(Number(this.worldId())));
    this.nav.here.provide(this.tabs);
    this.nav.crumbs.provide(this.crumbs);
    this.nav.extras.provide(this.extras);
    this.tools.provide('always', this.worldTools);
  }

  private tab(id: string, label: string, icon: IconName, part: string, tone?: string): NavItem {
    const path = `${this.base()}/${part}`;
    return { id, label, icon, tone, path, active: this.nav.url().startsWith(path) };
  }
}
