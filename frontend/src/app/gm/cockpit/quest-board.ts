import { Component, computed, inject, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { Quest } from '../../core/models';
import { QUEST_STATUSES, QuestStatus, questStatus } from '../../core/session-models';
import { Icon } from '../../components/basic/icon';
import { EntryCard } from '../../components/entry/entry-card';
import { NameDialog } from '../../components/form/name-dialog';
import { WorldStore } from '../../core/world-store';
import { Tools, Tool } from '../../global/tool-bar/tools.service';
import { SessionStore } from '../../core/session-store';

type Flag = 'done' | 'started' | 'revealed' | 'pinned';
type BlockId = 'main' | 'side';

/** One of the two blocks of the board: the main quests or the side quests. */
interface Block {
  id: BlockId;
  label: string;
  quests: Quest[];
}

/**
 * All quests of the world and of the session as the session has them, in two blocks: main quests and side quests.
 * Each block shows one status at a time: running (accepted), open (not accepted yet) or finished.
 * Shared and pinned are marks of their own and can narrow both blocks down.
 * "Neu" makes up a quest of this session from its name; that and the two narrowing switches are symbols in the bar.
 */
@Component({
  selector: 'app-quest-board',
  imports: [Icon, EntryCard, NameDialog],
  template: `
    @if (creating()) {
      <app-name-dialog
        title="Neue Quest"
        label="Name der Quest"
        hint="Die Quest gehört nur dieser Runde: eine Nebenquest, sofort angenommen und mit den Spielern geteilt. Sie öffnet sich danach im Seitenfenster, wo du den Rest schreibst."
        [error]="error()"
        (create)="addQuest($event)"
        (closed)="creating.set(false)"
      />
    }

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
            <app-entry-card size="card" [ref]="{ kind: 'quests', id: quest.id }" [marks]="marks(quest.id)" />
          } @empty {
            <p class="soft">Keine Quest mit diesem Status.</p>
          }
        </div>
      </section>
    }
  `,
  styleUrl: './quest-board.scss',
})
export class QuestBoard {
  protected readonly store = inject(SessionStore);
  private readonly world = inject(WorldStore);

  protected readonly statuses = QUEST_STATUSES;
  /** The status each block shows. */
  protected readonly picked = signal<Record<BlockId, QuestStatus>>({ main: 'running', side: 'running' });
  protected readonly onlyShared = signal(false);
  protected readonly onlyPinned = signal(false);
  /** Whether the dialog for a new quest is open, and why creating it failed. */
  protected readonly creating = signal(false);
  protected readonly error = signal('');
  protected readonly tools = computed<Tool[]>(() => [
    { id: 'quests-new', word: 'Neu', title: 'Neue Quest in dieser Runde', icon: 'plus', tone: 'kind--quests', click: () => this.creating.set(true) },
    { id: 'quests-shared', word: 'Geteilte', title: 'Nur geteilte', icon: 'eye', pressed: this.onlyShared(), click: () => this.onlyShared.set(!this.onlyShared()) },
    { id: 'quests-pinned', word: 'Angepinnt', title: 'Nur angepinnte', icon: 'pin', pressed: this.onlyPinned(), click: () => this.onlyPinned.set(!this.onlyPinned()) },
  ]);
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
    inject(Tools).provide('view', this.tools);
  }

  /** Whether the session set one of the marks of a quest. */
  protected is(id: number, flag: Flag): boolean {
    return !!this.store.state('quest', id)?.[flag];
  }

  /** The words behind the kind of a quest: whether it is pinned. */
  protected marks(id: number): string {
    return this.is(id, 'pinned') ? ' · angepinnt' : '';
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
   * Make up a quest from its name while playing. It belongs to this round only: a side quest that counts as accepted
   * and is shared with the players right away. It opens in the window at the side to write the rest.
   */
  protected addQuest(name: string): void {
    this.world.add<Quest>('quests', { name, kind: 'side' }).subscribe({
      next: (quest) => {
        this.creating.set(false);
        this.error.set('');
        this.store.patch('quest', quest.id, { revealed: true, started: true });
        this.world.read({ kind: 'quests', id: quest.id }, true);
      },
      error: (e: unknown) => this.error.set(readError(e)),
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
