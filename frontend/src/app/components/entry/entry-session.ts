import { Component, computed, inject, input } from '@angular/core';

import { EntryRef, Quest } from '../../core/models';
import { QuestChanges, QuestStep } from '../../core/session-models';
import { Icon } from '../basic/icon';
import { LinkPicker } from '../form/link-picker';
import { WorldStore } from '../../core/world-store';
import { QuestLogView } from '../play/quest-log';
import { SESSION_KINDS, SessionStore } from '../../core/session-store';

/** Stands in while no quest is looked up, so the form has something to show. */
const NO_QUEST = { name: '', goal: '', giver: null, location: null, scene: null };

/** The parts of an entry that can be shown one by one, by the kind of the entry. */
const PARTS: Record<string, string[]> = {
  quest: ['description', 'goal', 'giver', 'location'],
  event: ['description', 'trigger', 'happening'],
};

/**
 * What a session can do with the entry that is looked up: mark it as done, accept a quest, pin it,
 * and show or hide all of it at once. The eyes for single parts sit in the reading view itself.
 * A quest also shows the log the group keeps, and can be changed for this session only.
 */
@Component({
  selector: 'app-session-entry-actions',
  imports: [Icon, LinkPicker, QuestLogView],
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

        @if (!readonly()) {
        <div class="panel">
          <h3 class="section-title"><app-icon name="edit" /> In dieser Runde ändern</h3>
          <p class="soft">Gilt nur für diese Runde. Die Welt bleibt, wie sie ist.</p>
          <div class="field">
            <label for="change-name">Name</label>
            <input id="change-name" class="input" [value]="now().name" (change)="change('name', $any($event.target).value.trim())" />
          </div>
          <div class="field">
            <label for="change-goal">Ziel</label>
            <textarea id="change-goal" class="input" rows="2" [value]="now().goal" (change)="change('goal', $any($event.target).value.trim())"></textarea>
          </div>
          <div class="field">
            <label for="change-giver">Questgeber</label>
            <app-link-picker
              single
              inputId="change-giver"
              label="Questgeber in dieser Runde"
              emptyText="Kein Questgeber"
              [options]="world.npcOptions()"
              [value]="now().giver"
              (valueChange)="change('giver', $event)"
            />
          </div>
          <div class="field">
            <label for="change-location">Startgebiet</label>
            <app-link-picker
              single
              inputId="change-location"
              label="Startgebiet in dieser Runde"
              emptyText="Kein Startgebiet"
              [options]="world.locationOptions()"
              [value]="now().location"
              (valueChange)="change('location', $event)"
            />
          </div>
          <div class="field">
            <label for="change-scene">Entsteht in Szene</label>
            <app-link-picker
              single
              inputId="change-scene"
              label="Szene, in der die Quest in dieser Runde entsteht"
              emptyText="Keine Szene"
              [options]="world.sceneOptions()"
              [value]="now().scene"
              (valueChange)="change('scene', $event)"
            />
          </div>
          @if (changed()) {
            <div class="row">
              <button type="button" class="btn btn--small" (click)="session.setChanges('quest', found.id, {})">
                <app-icon name="undo" [size]="16" /> Wieder wie in der Welt
              </button>
            </div>
          }
        </div>
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
  /** Only look and use: the box to change the quest for this session is left out. */
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
  /** The quest as this session has it. */
  protected readonly now = computed(() => {
    const quest = this.quest();
    return quest ? this.world.questNow(quest) : NO_QUEST;
  });
  protected readonly changed = computed(() => Object.keys(this.state()?.changes ?? {}).length > 0);
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

  /** Change one thing about the quest for this session; what equals the world again is no change anymore. */
  protected change<K extends keyof QuestChanges>(key: K, value: QuestChanges[K]): void {
    const quest = this.quest();
    if (!quest) {
      return;
    }
    const changes: QuestChanges = { ...this.state()?.changes, [key]: value };
    if (value === quest[key] || (key === 'name' && !value)) {
      delete changes[key];
    }
    this.session.setChanges('quest', quest.id, changes);
  }
}
