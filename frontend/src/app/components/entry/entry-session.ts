import { Component, computed, inject, input } from '@angular/core';

import { EntryRef, Quest } from '../../core/models';
import { QuestStep } from '../../core/session-models';
import { Icon } from '../basic/icon';
import { WorldStore } from '../../core/world-store';
import { QuestLogView } from '../play/quest-log';
import { SESSION_KINDS, SessionStore } from '../../core/session-store';
import { RoundChanges } from './round-changes';

/** The parts of an entry that can be shown one by one, by the kind of the entry. */
const PARTS: Record<string, string[]> = {
  quest: ['description', 'goal', 'giver', 'location'],
  event: ['description', 'trigger', 'happening'],
};

/**
 * What a session can do with the entry that is looked up: mark it as done, accept a quest, pin it,
 * and show or hide all of it at once. The eyes for single parts sit in the reading view itself.
 * A quest also shows the log the group keeps. An entry of the world can be changed for this session only; an entry the
 * session made up is edited with "Bearbeiten" instead.
 */
@Component({
  selector: 'app-session-entry-actions',
  imports: [Icon, QuestLogView, RoundChanges],
  template: `
    @if (kind(); as sessionKind) {
      @if (part() !== 'note') {
      <div class="panel">
        <span class="kicker">In dieser Runde</span>
        <div class="row">
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.revealed" (click)="session.toggle(sessionKind, entry().id, 'revealed')">
            <app-icon [name]="state()?.revealed ? 'eye' : 'eye-off'" [size]="16" /> {{ state()?.revealed ? 'Spieler sehen es' : 'Verborgen' }}
          </button>
          @if (sessionKind === 'quest') {
            <button type="button" class="pill" [attr.aria-pressed]="!!state()?.started" (click)="session.toggle('quest', entry().id, 'started')">
              <app-icon name="play" [size]="16" /> Angenommen
            </button>
          }
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.done" (click)="session.toggle(sessionKind, entry().id, 'done')">
            <app-icon name="check" [size]="16" /> {{ sessionKind === 'quest' ? 'Beendet' : 'Erledigt' }}
          </button>
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.pinned" (click)="session.toggle(sessionKind, entry().id, 'pinned')">
            <app-icon name="pin" [size]="16" /> Stecknadel
          </button>
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.on_table" (click)="session.toggle(sessionKind, entry().id, 'on_table')">
            <app-icon name="plus" [size]="16" /> Auf den Tisch
          </button>
          <button type="button" class="pill" (click)="layAll()"><app-icon name="plus" [size]="16" /> Alles auf den Tisch</button>
        </div>
        @if (part() !== 'short') {
        <div class="row">
          <button type="button" class="btn btn--small" (click)="showAll(true)"><app-icon name="eye" [size]="16" /> Alles zeigen</button>
          <button type="button" class="btn btn--small" (click)="showAll(false)"><app-icon name="eye-off" [size]="16" /> Alles verbergen</button>
        </div>
        }
        @if (part() === 'short') {
        <div class="field">
          <label for="entry-note">Notiz (nur für dich)</label>
          <textarea id="entry-note" class="input" rows="2" [value]="state()?.gm_note ?? ''" (change)="session.setNote(sessionKind, entry().id, $any($event.target).value)"></textarea>
        </div>
        }
      </div>
      }

      @if (part() === 'note') {
        <div class="field">
          <label for="entry-note-long">Notiz zu diesem Eintrag (nur für dich, nur in dieser Runde)</label>
          <textarea id="entry-note-long" class="input" rows="8" [value]="state()?.gm_note ?? ''" (change)="session.setNote(sessionKind, entry().id, $any($event.target).value)"></textarea>
        </div>
      }

      @if (part() === 'round' && quest(); as found) {
        <div class="panel">
          <h3 class="section-title kind--quests"><app-icon name="quest" /> Questlog der Gruppe</h3>
          <p class="soft">So führen die Spieler die Quest: nur die gezeigten Punkte, dazu ihre eigenen. Du kannst mitschreiben.</p>
          <app-quest-log
            [steps]="logSteps()"
            [log]="state()?.log"
            (logChange)="session.setLog('quest', found.id, $event)"
            (stepToggle)="session.toggleIn('quest', found.id, 'steps', $event)"
          />
        </div>
      }

      @if (part() === 'round') {
        @if (world.ofRound(entry())) {
          <p class="soft">Dieser Eintrag gehört nur dieser Runde. Du änderst ihn mit „Bearbeiten“ unten im Fenster.</p>
        } @else if (!readonly()) {
          <app-round-changes [entry]="entry()" />
        }
      }
    }
  `,
  styleUrl: './entry-session.scss',
})
export class SessionEntryActions {
  protected readonly session = inject(SessionStore);
  protected readonly world = inject(WorldStore);

  /** The entry that is looked up in the side panel. */
  readonly entry = input.required<EntryRef>();
  /** Which part is shown: the switches and the note for the short look, the whole round, or only the note. */
  readonly part = input<'short' | 'round' | 'note'>('round');
  /** Only look and use: the box to change the entry for this session is left out. */
  readonly readonly = input(false);

  protected readonly kind = computed(() => SESSION_KINDS[this.entry().kind]);
  protected readonly state = computed(() => {
    const kind = this.kind();
    return kind ? this.session.state(kind, this.entry().id) : undefined;
  });
  protected readonly quest = computed<Quest | null>(() => {
    const { kind, id } = this.entry();
    return kind === 'quests' ? (this.world.quests().find((quest) => quest.id === id) ?? null) : null;
  });
  /** Every point of the quest's checklist: whether the players see it and whether it is checked. */
  protected readonly steps = computed(() => {
    const state = this.state();
    return (this.quest()?.checklist ?? []).map((text, position) => ({
      position, text, done: !!state?.steps.includes(position), shown: !!state?.shown.includes(`step:${position}`),
    }));
  });
  /** The points the group has in its log: only those that are shown. */
  protected readonly logSteps = computed<QuestStep[]>(() => this.steps().filter((step) => step.shown));

  /** Ask into which group the entry and everything connected to it shall be laid; the popup of the entry closes. */
  protected layAll(): void {
    this.world.popup.set(null);
    this.session.tableWish.set(this.entry());
  }

  /** Show every part and every point to the players, or hide all of them. */
  protected showAll(shown: boolean): void {
    const kind = this.kind();
    if (kind) {
      const all = [...(PARTS[kind] ?? ['description']), ...this.steps().map((step) => `step:${step.position}`)];
      this.session.patch(kind, this.entry().id, { shown: shown ? all : [] });
    }
  }
}
