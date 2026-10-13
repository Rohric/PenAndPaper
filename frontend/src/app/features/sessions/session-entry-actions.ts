import { Component, computed, effect, inject, input, signal } from '@angular/core';

import { EntryRef, EntryTexts, Npc, Quest } from '../../core/models';
import { QuestChanges, QuestStep } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { LinkPicker } from '../../shared/link-picker';
import { CharacterService } from '../characters/character.service';
import { WorldStore } from '../worlds/world-store';
import { QuestLogView } from './quest-log';
import { SESSION_KINDS, SessionStore } from './session-store';

/** Stands in while no quest is looked up, so the form has something to show. */
const NO_QUEST = { name: '', goal: '', giver: null, location: null, scene: null };

/** A part of an entry that can be shown to the players by itself. */
interface Part {
  key: string;
  label: string;
  /** What the players would read. */
  text: string;
  shown: boolean;
}

const DESCRIPTION = { key: 'description', label: 'Beschreibung' };
/** The parts that can be shown one by one, by the kind of the entry. */
const PARTS: Record<string, { key: string; label: string }[]> = {
  quest: [DESCRIPTION, { key: 'goal', label: 'Ziel' }, { key: 'giver', label: 'Questgeber' }, { key: 'location', label: 'Startgebiet' }],
  event: [DESCRIPTION, { key: 'trigger', label: 'Auslöser' }, { key: 'happening', label: 'Was passiert' }],
};

/**
 * What a session can do with the entry that is looked up: mark it as done, accept a quest, pin it,
 * and decide piece by piece what the players see of it. Every part has its own eye: the description,
 * the goal, the giver, every single point of a checklist. The players see exactly what is switched on.
 * A quest also shows the log the group keeps, and can be changed for this session only.
 */
@Component({
  selector: 'app-session-entry-actions',
  imports: [Icon, LinkPicker, QuestLogView],
  template: `
    @if (kind(); as sessionKind) {
      <div class="panel">
        <span class="kicker">In dieser Runde</span>
        <div class="row">
          @if (sessionKind === 'quest') {
            <button type="button" class="pill" [attr.aria-pressed]="!!state()?.started" (click)="session.toggle('quest', entry().id, 'started')">
              <app-icon name="flag" [size]="16" /> Angenommen
            </button>
          }
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.done" (click)="session.toggle(sessionKind, entry().id, 'done')">
            <app-icon name="check" [size]="16" /> {{ sessionKind === 'quest' ? 'Beendet' : 'Erledigt' }}
          </button>
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.pinned" (click)="session.toggle(sessionKind, entry().id, 'pinned')">
            <app-icon name="pin" [size]="16" /> Stecknadel
          </button>
        </div>
      </div>

      <div class="panel">
        <h3 class="section-title"><app-icon name="eye" /> Das sehen die Spieler</h3>
        <label class="check">
          <input type="checkbox" [checked]="!!state()?.revealed" (change)="session.toggle(sessionKind, entry().id, 'revealed')" />
          {{ sessionKind === 'quest' ? 'Diese Quest ist mit den Spielern geteilt' : 'Dieser Eintrag steht im Glossar der Spieler' }}
        </label>
        <p class="soft">
          {{ state()?.revealed ? 'Die Spieler sehen den Namen und alles, was unten auf „sichtbar“ steht.' : 'Im Moment nichts. Du kannst unten schon wählen, was sie sehen, sobald du den Haken setzt.' }}
        </p>

        @for (part of parts(); track part.key) {
          <div class="part">
            <button
              type="button"
              class="btn btn--small part__eye"
              [attr.aria-pressed]="part.shown"
              [attr.aria-label]="part.label + (part.shown ? ' verbergen' : ' zeigen')"
              (click)="session.toggleShown(sessionKind, entry().id, part.key)"
            >
              <app-icon [name]="part.shown ? 'eye' : 'lock'" [size]="16" /> {{ part.shown ? 'sichtbar' : 'verborgen' }}
            </button>
            <span class="part__text">
              <strong>{{ part.label }}</strong>
              <span class="soft clamp">{{ part.text || 'Hier steht noch nichts.' }}</span>
            </span>
          </div>
        }

        @if (steps().length) {
          <div class="field">
            <span class="label">Checkliste: jeden Punkt einzeln zeigen und abhaken</span>
            @for (step of steps(); track step.position) {
              <div class="part">
                <button
                  type="button"
                  class="btn btn--small part__eye"
                  [attr.aria-pressed]="step.shown"
                  [attr.aria-label]="step.text + (step.shown ? ' verbergen' : ' zeigen')"
                  (click)="session.toggleShown('quest', entry().id, 'step:' + step.position)"
                >
                  <app-icon [name]="step.shown ? 'eye' : 'lock'" [size]="16" /> {{ step.shown ? 'sichtbar' : 'verborgen' }}
                </button>
                <label class="check part__text">
                  <input type="checkbox" [checked]="step.done" (change)="session.toggleIn('quest', entry().id, 'steps', step.position)" />
                  {{ step.text }}
                </label>
              </div>
            }
          </div>
        }

        @if (knowledge().length) {
          <div class="field">
            <span class="label">Wissen für Spieler: hake an, was sie herausgefunden haben</span>
            @for (piece of knowledge(); track $index) {
              <label class="check">
                <input type="checkbox" [checked]="state()?.known?.includes($index)" (change)="session.toggleIn(sessionKind, entry().id, 'known', $index)" />
                {{ piece.title ? piece.title + ': ' : '' }}{{ piece.text }}
              </label>
            }
          </div>
        }

        <div class="row">
          <button type="button" class="btn btn--small" (click)="showAll(true)"><app-icon name="eye" [size]="16" /> Alles zeigen</button>
          <button type="button" class="btn btn--small" (click)="showAll(false)"><app-icon name="lock" [size]="16" /> Alles verbergen</button>
        </div>
        @if (state()?.revealed && onlyName()) {
          <p class="notice">Die Spieler sehen im Moment nur den Namen.</p>
        }
        <p class="soft">
          <app-icon name="lock" [size]="14" />
          „Wissen nur für dich“ ({{ texts()?.gm_knowledge?.length ?? 0 }} Stücke) sehen die Spieler nie.
        </p>
      </div>

      @if (quest(); as found) {
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
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    // One part of the entry: its eye on the left, what the players would read beside it.
    .part {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .part__eye {
      flex: 0 0 auto;
      min-width: 118px;
    }

    .part__text {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
    }

    label.part__text {
      flex-direction: row;
    }
  `,
})
export class SessionEntryActions {
  protected readonly session = inject(SessionStore);
  protected readonly world = inject(WorldStore);
  private readonly characters = inject(CharacterService);

  /** The entry that is looked up in the side panel. */
  readonly entry = input.required<EntryRef>();

  protected readonly kind = computed(() => SESSION_KINDS[this.entry().kind]);
  protected readonly state = computed(() => {
    const kind = this.kind();
    return kind ? this.session.state(kind, this.entry().id) : undefined;
  });
  /** The character itself; the world only knows name, profession and place of an NPC. */
  private readonly npc = signal<Npc | null>(null);
  private readonly npcId = computed(() => (this.entry().kind === 'npcs' ? this.entry().id : null));
  /** What is written about the entry, to say what the players can see of it. */
  protected readonly texts = computed<EntryTexts | null>(() => this.findTexts());
  protected readonly knowledge = computed(() => this.texts()?.player_knowledge ?? []);
  private readonly knownCount = computed(() => (this.state()?.known ?? []).filter((position) => position < this.knowledge().length).length);

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
  /** The parts of the entry with what the players would read, and whether they see it. */
  protected readonly parts = computed<Part[]>(() => {
    const shown = this.state()?.shown ?? [];
    const read = this.readings();
    return (PARTS[this.kind() ?? ''] ?? [DESCRIPTION]).map((part) => ({ ...part, text: read[part.key] ?? '', shown: shown.includes(part.key) }));
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
  /** Whether a revealed entry shows the players nothing but its name. */
  protected readonly onlyName = computed(() => !this.parts().some((part) => part.shown && part.text) && !this.logSteps().length && !this.knownCount());

  constructor() {
    // Load the character whenever another NPC is looked up.
    effect(() => this.loadNpc(this.npcId()));
  }

  /** Show every part and every point to the players, or hide all of them. */
  protected showAll(shown: boolean): void {
    const kind = this.kind();
    if (kind) {
      const all = [...this.parts().map((part) => part.key), ...this.steps().map((step) => `step:${step.position}`)];
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

  /** What the players would read in every part of the entry. */
  private readings(): Record<string, string> {
    const { kind, id } = this.entry();
    const event = kind === 'events' ? this.world.events().find((other) => other.id === id) : undefined;
    const now = this.now();
    return {
      description: this.texts()?.description ?? '',
      goal: now.goal,
      giver: this.world.npcs().find((link) => link.npc === now.giver)?.name ?? '',
      location: this.world.locations().find((place) => place.id === now.location)?.name ?? '',
      trigger: event?.trigger ?? '',
      happening: event?.happening ?? '',
    };
  }

  private findTexts(): EntryTexts | null {
    const { kind, id } = this.entry();
    if (kind === 'npcs') {
      return this.npc()?.id === id ? this.npc() : null;
    }
    const lists = { locations: this.world.locations(), quests: this.world.quests(), events: this.world.events(), trivia: this.world.trivia() };
    const entries: (EntryTexts & { id: number })[] = kind in lists ? lists[kind as keyof typeof lists] : [];
    return entries.find((entry) => entry.id === id) ?? null;
  }

  private loadNpc(id: number | null): void {
    this.npc.set(null);
    if (id !== null) {
      this.characters.get<Npc>('npcs', id).subscribe({ next: (npc) => this.npc.set(npc), error: () => undefined });
    }
  }
}
