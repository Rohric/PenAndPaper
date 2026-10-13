import { Component, computed, effect, inject, input, signal } from '@angular/core';

import { EntryRef, EntryTexts, Npc, Quest } from '../../core/models';
import { QuestChanges } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { LinkPicker } from '../../shared/link-picker';
import { CharacterService } from '../characters/character.service';
import { WorldStore } from '../worlds/world-store';
import { SESSION_KINDS, SessionStore } from './session-store';

/** Stands in while no quest is looked up, so the form has something to show. */
const NO_QUEST = { name: '', goal: '', giver: null, location: null, scene: null };

/**
 * What a session can do with the entry that is looked up: mark it as done and pin it, decide what
 * the players see of it, change a quest for this session only, and check the steps of a quest.
 * The part "Das sehen die Spieler" says in plain words what the players have of the entry right now.
 */
@Component({
  selector: 'app-session-entry-actions',
  imports: [Icon, LinkPicker],
  template: `
    @if (kind(); as sessionKind) {
      <div class="panel">
        <span class="kicker">In dieser Runde</span>
        <div class="row">
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.done" (click)="session.toggle(sessionKind, entry().id, 'done')">
            <app-icon name="check" [size]="16" /> Erledigt
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

        @if (state()?.revealed) {
          <ul class="plain-list">
            <li>den Namen</li>
            <li>{{ texts()?.description ? 'die Beschreibung' : 'keine Beschreibung, denn es ist noch keine geschrieben' }}</li>
            @if (sessionKind === 'quest') {
              <li>Ziel, Checkliste und Questgeber</li>
            }
            <li>{{ knownCount() }} von {{ knowledge().length }} Stücken „Wissen für Spieler“</li>
          </ul>
          @if (onlyName()) {
            <p class="notice">
              Die Spieler sehen im Moment nur den Namen. Schreib eine Beschreibung in den Eintrag, oder hake unten Wissen an.
            </p>
          }
        } @else {
          <p class="soft">Im Moment nichts. Erst mit dem Haken oben erscheint der Eintrag bei den Spielern.</p>
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
        <p class="soft">
          <app-icon name="lock" [size]="14" />
          „Wissen nur für dich“ ({{ texts()?.gm_knowledge?.length ?? 0 }} Stücke) sehen die Spieler nie.
        </p>
      </div>

      @if (quest(); as found) {
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

        @if (found.checklist.length) {
          <div class="panel">
            <h3 class="section-title"><app-icon name="quest" /> Schritte der Quest</h3>
            @for (step of found.checklist; track $index) {
              <label class="check">
                <input type="checkbox" [checked]="state()?.steps?.includes($index)" (change)="session.toggleIn('quest', found.id, 'steps', $index)" />
                {{ step }}
              </label>
            }
          </div>
        }
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
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
  protected readonly knownCount = computed(() => (this.state()?.known ?? []).filter((position) => position < this.knowledge().length).length);
  /** Whether a revealed entry shows the players nothing but its name. */
  protected readonly onlyName = computed(() => this.kind() !== 'quest' && !this.texts()?.description && !this.knownCount());

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

  constructor() {
    // Load the character whenever another NPC is looked up.
    effect(() => this.loadNpc(this.npcId()));
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
