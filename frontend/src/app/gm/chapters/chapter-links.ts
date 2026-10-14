import { Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';

import { readError } from '../../core/api-error';
import { Chapter, Quest, WorldEvent } from '../../core/models';
import { Facet } from '../../core/wall';
import { EntryWall } from '../../components/entry/entry-wall';
import { QUEST_KIND_FACET, categoryFacet, eventTiles, questTiles } from '../../components/entry/wall-tiles';
import { LinkPicker } from '../../components/form/link-picker';
import { NameDialog } from '../../components/form/name-dialog';
import { ToastService } from '../../global/toast/toast.service';
import { Tool, Tools } from '../../global/tool-bar/tools.service';
import { WorldStore } from '../../core/world-store';

/** The words of the two kinds a chapter collects. */
const WORDS = {
  quests: {
    all: 'Quests', new: 'Neue Quest in diesem Kapitel', mine: 'Quests dieses Kapitels', empty: 'Dieses Kapitel hat noch keine Quest.',
    hint: 'Mit „Neu“ unten in der Leiste legst du eine an, mit „Zuordnen“ nimmst du Quests aus der Welt dazu.',
  },
  events: {
    all: 'Ereignisse', new: 'Neues Ereignis in diesem Kapitel', mine: 'Ereignisse dieses Kapitels', empty: 'Dieses Kapitel hat noch kein Ereignis.',
    hint: 'Mit „Neu“ unten in der Leiste legst du eines an, mit „Zuordnen“ nimmst du Ereignisse aus der Welt dazu.',
  },
};

/**
 * The quests or the events of one chapter as a wall of tiles: what carries the tag of the chapter and what hangs on
 * one of its scenes. The tiles have no buttons. "Neu" creates an entry with the tag of the chapter, "Zuordnen" in the
 * bar at the bottom takes entries of the world in or out; editing goes through the popup and the window at the side.
 */
@Component({
  selector: 'app-chapter-links',
  imports: [EntryWall, LinkPicker, NameDialog],
  template: `
    <app-entry-wall
      [id]="'chapter-' + kind()"
      [items]="tiles()"
      [offers]="offers()"
      [placeholder]="words().all + ' durchsuchen …'"
      [creatable]="true"
      [empty]="words().empty"
      [emptyHint]="words().hint"
      (create)="createNew($event)"
    />

    <ng-template #assign>
      <p class="soft">Was hier steht, trägt den Tag des Kapitels. Tippen sucht in der ganzen Welt, das Kreuz nimmt etwas aus dem Kapitel; es bleibt im Glossar.</p>
      <app-link-picker
        [label]="words().mine"
        [emptyText]="kind() === 'quests' ? 'Quest suchen oder neu anlegen …' : 'Ereignis suchen oder neu anlegen …'"
        [creatable]="true"
        [options]="kind() === 'quests' ? store.questOptions() : store.eventOptions()"
        [selected]="ids()"
        (selectedChange)="save($event)"
        (create)="createNew($event)"
        (look)="store.look({ kind: kind(), id: $event })"
      />
    </ng-template>

    @if (creating()) {
      <app-name-dialog
        [title]="words().new"
        hint="Der Eintrag öffnet sich danach im Seitenfenster, wo du den Rest schreibst."
        [error]="error()"
        (create)="createNew($event)"
        (closed)="creating.set(false)"
      />
    }
  `,
})
export class ChapterLinks {
  protected readonly store = inject(WorldStore);
  private readonly toast = inject(ToastService);

  readonly chapter = input.required<Chapter>();
  readonly kind = input.required<'quests' | 'events'>();

  protected readonly creating = signal(false);
  protected readonly error = signal('');
  protected readonly words = computed(() => WORDS[this.kind()]);
  /** What the chapter itself names; scenes can add more. */
  protected readonly ids = computed(() => this.chapter()[this.kind()]);
  private readonly scenes = computed(() => this.store.scenesOf(this.chapter().id));
  /** The quests of the chapter, of its scenes, and those that come up in one of its scenes. */
  private readonly quests = computed<Quest[]>(() => {
    const scenes = this.scenes();
    const onScenes = scenes.flatMap((scene) => scene.quests);
    const here = (quest: Quest) => this.ids().includes(quest.id) || onScenes.includes(quest.id) || scenes.some((scene) => scene.id === quest.scene);
    return this.store.quests().filter(here);
  });
  /** The events of the chapter together with the events that hang on one of its scenes. */
  private readonly events = computed<WorldEvent[]>(() => {
    const onScenes = this.scenes().flatMap((scene) => scene.events);
    return this.store.events().filter((event) => this.ids().includes(event.id) || onScenes.includes(event.id));
  });
  protected readonly tiles = computed(() => (this.kind() === 'quests' ? questTiles(this.store, this.quests()) : eventTiles(this.store, this.events())));
  protected readonly offers = computed<Facet[]>(() =>
    this.kind() === 'quests' ? [categoryFacet(this.quests()), QUEST_KIND_FACET] : [categoryFacet(this.events())],
  );

  private readonly assign = viewChild<TemplateRef<unknown>>('assign');
  private readonly tools = computed<Tool[]>(() => [
    { id: 'chapter-new', word: 'Neu', title: this.words().new, icon: 'plus', click: () => this.creating.set(true) },
    { id: 'chapter-assign', word: 'Zuordnen', title: this.words().mine, icon: 'book', popup: this.assign(), popupTitle: this.words().mine },
  ]);

  constructor() {
    inject(Tools).provide('view', this.tools);
  }

  /** Save which entries carry the tag of the chapter. */
  protected save(ids: number[]): void {
    this.store.save('chapters', this.chapter().id, { [this.kind()]: ids }).subscribe({ error: (e: unknown) => this.fail(e) });
  }

  /** Create a new entry in the world, put it into the chapter and open its form in the window at the side. */
  protected createNew(name: string): void {
    const kind = this.kind();
    this.store.add<{ id: number }>(kind, { name }).subscribe({
      next: (created) => {
        this.creating.set(false);
        this.error.set('');
        this.save([...this.ids(), created.id]);
        this.store.read({ kind, id: created.id }, true);
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  /** In the dialog the reason stands in the dialog, elsewhere in a short message on top. */
  private fail(error: unknown): void {
    if (this.creating()) {
      this.error.set(readError(error));
    } else {
      this.toast.show(readError(error), 'danger');
    }
  }
}
