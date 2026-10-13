import { Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map, switchMap } from 'rxjs';

import { readError } from '../../core/api-error';
import { Quest } from '../../core/models';
import { QUEST_STATUSES, QuestStatus, questStatus } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { QuestTile } from '../worlds/quest-tile';
import { WorldStore } from '../worlds/world-store';
import { CockpitTools, Tool } from './cockpit-tools';
import { SessionStore } from './session-store';

type Flag = 'done' | 'started' | 'revealed' | 'pinned';
type BlockId = 'main' | 'side';

/** One of the two blocks of the board: the main quests or the side quests of the world. */
interface Block {
  id: BlockId;
  label: string;
  quests: Quest[];
}

/**
 * All quests of the world as a session has them, in two blocks: main quests and side quests.
 * Each block shows one status at a time: running (accepted), open (not accepted yet) or finished.
 * Shared and pinned are marks of their own and can narrow both blocks down.
 * A new quest can be created from its title alone; that and the two narrowing switches are symbols in the bar.
 */
@Component({
  selector: 'app-quest-board',
  imports: [FormsModule, Icon, QuestTile],
  template: `
    <ng-template #newQuestForm>
      <form class="list-row" (ngSubmit)="addQuest()">
        <input
          class="input"
          name="newQuest"
          aria-label="Titel einer neuen Quest"
          placeholder="Neue Quest, der Titel genügt"
          [disabled]="!chapter()"
          [(ngModel)]="newQuest"
        />
        <button type="submit" class="btn btn--small" [disabled]="!newQuest().trim() || !chapter()"><app-icon name="plus" [size]="16" /> Quest</button>
      </form>
      <p class="soft">
        {{ chapter() ? 'Eine neue Quest kommt als Nebenquest in die Welt, hängt am Kapitel der Runde, ist angenommen und mit den Spielern geteilt.' : 'Wähle oben ein Kapitel, dann kannst du hier schnell eine Quest anlegen.' }}
      </p>
    </ng-template>

    @for (block of blocks(); track block.id) {
      <section class="stack">
        <div class="row row--between">
          <h3 class="section-title kind--quests"><app-icon name="quest" /> {{ block.label }}</h3>
          <div class="row" role="group" [attr.aria-label]="'Status der ' + block.label">
            @for (status of statuses; track status.id) {
              <button type="button" class="pill" [attr.aria-pressed]="picked()[block.id] === status.id" (click)="pick(block.id, status.id)">
                {{ status.label }} · {{ count(block, status.id) }}
              </button>
            }
          </div>
        </div>
        <div class="tiles tiles--wide">
          @for (quest of visible(block); track quest.id) {
            <app-quest-tile
              [quest]="quest"
              [done]="is(quest.id, 'done')"
              [marks]="marks(quest.id)"
              [stepsDone]="stepsDone(quest.id)"
              [eye]="is(quest.id, 'revealed')"
              (eyeToggle)="store.toggle('quest', quest.id, 'revealed')"
            >
              <div class="row">
                <button type="button" class="btn btn--small" [attr.aria-pressed]="is(quest.id, 'started')" (click)="store.toggle('quest', quest.id, 'started')">
                  <app-icon name="flag" [size]="16" /> {{ is(quest.id, 'started') ? 'Angenommen' : 'Annehmen' }}
                </button>
                <button type="button" class="btn btn--small" [attr.aria-pressed]="is(quest.id, 'done')" (click)="store.toggle('quest', quest.id, 'done')">
                  <app-icon name="check" [size]="16" /> Beendet
                </button>
                <button type="button" class="btn btn--small" [attr.aria-pressed]="is(quest.id, 'pinned')" (click)="store.toggle('quest', quest.id, 'pinned')">
                  <app-icon name="pin" [size]="16" /> Stecknadel
                </button>
              </div>
            </app-quest-tile>
          } @empty {
            <p class="soft">Keine Quest mit diesem Status.</p>
          }
        </div>
      </section>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
  `,
})
export class QuestBoard {
  protected readonly store = inject(SessionStore);
  private readonly world = inject(WorldStore);

  /** The chapter the group is in; a quest created here hangs on it. */
  readonly chapterId = input<number | null>(null);

  protected readonly statuses = QUEST_STATUSES;
  /** The status each block shows. */
  protected readonly picked = signal<Record<BlockId, QuestStatus>>({ main: 'running', side: 'running' });
  protected readonly onlyShared = signal(false);
  protected readonly onlyPinned = signal(false);
  protected readonly newQuest = signal('');
  private readonly newQuestForm = viewChild<TemplateRef<unknown>>('newQuestForm');
  protected readonly tools = computed<Tool[]>(() => [
    { id: 'quests-new', word: 'Neu', title: 'Neue Quest', icon: 'plus', tone: 'kind--quests', popup: this.newQuestForm(), popupTitle: 'Neue Quest' },
    { id: 'quests-shared', word: 'Geteilte', title: 'Nur geteilte', icon: 'eye', pressed: this.onlyShared(), click: () => this.onlyShared.set(!this.onlyShared()) },
    { id: 'quests-pinned', word: 'Angepinnt', title: 'Nur angepinnte', icon: 'pin', pressed: this.onlyPinned(), click: () => this.onlyPinned.set(!this.onlyPinned()) },
  ]);
  protected readonly chapter = computed(() => this.world.chapters().find((chapter) => chapter.id === this.chapterId()) ?? null);
  /** Main quests in the order of their number, side quests in the order of the alphabet. */
  protected readonly blocks = computed<Block[]>(() => {
    const quests = this.world.quests();
    const main = quests.filter((quest) => quest.kind === 'main').sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity));
    return [
      { id: 'main', label: 'Hauptquests', quests: main },
      { id: 'side', label: 'Nebenquests', quests: quests.filter((quest) => quest.kind === 'side') },
    ];
  });

  constructor() {
    inject(CockpitTools).provide('view', this.tools);
  }

  /** Whether the session set one of the marks of a quest. */
  protected is(id: number, flag: Flag): boolean {
    return !!this.store.state('quest', id)?.[flag];
  }

  /** The words behind the kind of a quest: whether it is pinned. */
  protected marks(id: number): string {
    return this.is(id, 'pinned') ? ' · angepinnt' : '';
  }

  /** How many points of a quest the session has checked. */
  protected stepsDone(id: number): number {
    return this.store.state('quest', id)?.steps.length ?? 0;
  }

  /** Show another status in one of the blocks. */
  protected pick(block: BlockId, status: QuestStatus): void {
    this.picked.update((picked) => ({ ...picked, [block]: status }));
  }

  /** The quests of a block with the status it shows. */
  protected visible(block: Block): Quest[] {
    return this.withStatus(block, this.picked()[block.id]);
  }

  /** How many quests of a block have a status. */
  protected count(block: Block, status: QuestStatus): number {
    return this.withStatus(block, status).length;
  }

  /**
   * Create a quest from its title alone while playing. It becomes a side quest of the world, hangs on
   * the chapter the group is in, counts as accepted and is shared with the players right away.
   */
  protected addQuest(): void {
    const chapter = this.chapter();
    const name = this.newQuest().trim();
    if (!chapter || !name) {
      return;
    }
    this.newQuest.set('');
    const created = this.world.add<Quest>('quests', { name });
    const linked = created.pipe(switchMap((quest) => this.world.save('chapters', chapter.id, { quests: [...chapter.quests, quest.id] }).pipe(map(() => quest))));
    linked.subscribe({
      next: (quest) => this.store.patch('quest', quest.id, { revealed: true, started: true }),
      error: (e: unknown) => this.store.error.set(readError(e)),
    });
  }

  private withStatus(block: Block, status: QuestStatus): Quest[] {
    return block.quests.filter((quest) => {
      const state = this.store.state('quest', quest.id);
      const narrowed = (!this.onlyShared() || !!state?.revealed) && (!this.onlyPinned() || !!state?.pinned);
      return questStatus(state) === status && narrowed;
    });
  }
}
