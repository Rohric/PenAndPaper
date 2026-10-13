import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EntryRef, EntryTexts, Scene } from '../../core/models';
import { QUEST_STATUSES, questStatus } from '../../core/session-models';
import { EyeToggle } from '../../shared/eye-toggle';
import { Icon, IconName } from '../../shared/icon';
import { Popup } from '../../shared/popup';
import { Portrait } from '../../shared/portrait';
import { KIND_LABELS, isItem, summaryOf } from '../worlds/entry-views';
import { WorldStore } from '../worlds/world-store';
import { SESSION_KINDS, SessionStore } from './session-store';

/** What a card needs to show of an entry of the world. */
interface Face {
  name: string;
  symbol: string;
  fallback: IconName;
  tone: string;
  /** What the entry is about, in a few lines. */
  text: string;
}

/** The lists of a scene that an entry can be added to, by the kind of the entry. */
const SCENE_LISTS: Partial<Record<EntryRef['kind'], keyof Pick<Scene, 'quests' | 'events' | 'trivia' | 'npcs'>>> = {
  quests: 'quests',
  events: 'events',
  trivia: 'trivia',
  npcs: 'npcs',
};

/**
 * A card for any entry of the world while playing, wide and low: portrait, kind and name, a few lines of
 * what the entry is about, and on the right the eye that shows it to the players, the pin and, where it
 * makes sense, "done". A quest can also be accepted here. "Zur Szene" adds the entry to the scene that is open.
 * A click on the name looks the entry up in the window at the side.
 */
@Component({
  selector: 'app-session-card',
  imports: [FormsModule, Icon, Popup, Portrait, EyeToggle],
  template: `
    @if (face(); as shown) {
      <article [class]="'card kind--' + shown.tone" [class.card--done]="!!state()?.done">
        <app-portrait [symbol]="shown.symbol" [fallback]="shown.fallback" [size]="32" />
        <div class="card__main">
          <button type="button" class="card__name" (click)="lookUp()">
            <span class="kicker">{{ kicker() }}</span>
            <span class="card__title">{{ shown.name }}</span>
          </button>
          @if (shown.text) {
            <p class="card__text">{{ shown.text }}</p>
          }
          @if (state()?.gm_note) {
            <p class="card__note">Notiz: {{ state()?.gm_note }}</p>
          }
          @if (kind() === 'quest' || (canAdd() && !master())) {
            <div class="row card__row">
              @if (kind() === 'quest') {
                <button type="button" class="chip chip--link" [attr.aria-pressed]="!!state()?.started" (click)="session.toggle('quest', ref().id, 'started')">
                  <app-icon name="flag" [size]="12" /> {{ state()?.started ? 'Angenommen' : 'Annehmen' }}
                </button>
              }
              @if (canAdd() && !master()) {
                <button type="button" class="chip chip--link" (click)="addToScene()">
                  <app-icon name="plus" [size]="12" /> Zur Szene
                </button>
              }
            </div>
          }
        </div>
        <div class="card__tools">
          @if (kind() !== 'scene') {
            <app-eye [shown]="!!state()?.revealed" label="Für Spieler sichtbar" (toggle)="session.toggle(kind()!, ref().id, 'revealed')" />
          }
          <button
            type="button"
            class="card__btn"
            [class.is-on]="!!state()?.pinned"
            aria-label="Stecknadel"
            [attr.aria-pressed]="!!state()?.pinned"
            (click)="session.toggle(kind()!, ref().id, 'pinned')"
          >
            <app-icon name="pin" [size]="16" />
          </button>
          <button
            type="button"
            class="card__btn"
            [class.is-on]="!!state()?.gm_note"
            aria-label="Notiz"
            title="Notiz"
            (click)="openNote($event)"
          >
            <app-icon name="note" [size]="16" />
          </button>
          <button
            type="button"
            class="card__btn"
            [class.is-on]="!!state()?.on_table"
            aria-label="Auf den Tisch"
            title="Auf den Tisch"
            [attr.aria-pressed]="!!state()?.on_table"
            (click)="toTable()"
          >
            <app-icon name="plus" [size]="16" />
          </button>
          @if (canFinish()) {
            <button
              type="button"
              class="card__btn"
              [class.is-on]="!!state()?.done"
              [attr.aria-label]="kind() === 'quest' ? 'Beendet' : 'Erledigt'"
              [attr.aria-pressed]="!!state()?.done"
              (click)="session.toggle(kind()!, ref().id, 'done')"
            >
              <app-icon name="check" [size]="16" />
            </button>
          }
        </div>
      </article>
      @if (noteOpen()) {
        <app-popup [title]="'Notiz zu ' + shown.name" side="auto" [anchor]="noteAnchor()" [size]="380" (closed)="closeNote()">
          <textarea class="input" rows="5" aria-label="Notiz (nur für dich)" [ngModel]="draft()" (ngModelChange)="draft.set($event)"></textarea>
          <p class="soft">Nur für dich und nur in dieser Runde.</p>
          <div class="row"><button type="button" class="btn btn--small btn--primary" (click)="closeNote()">Fertig</button></div>
        </app-popup>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .card {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 4px 10px;
      align-items: start;
      padding: 8px 10px;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      background: var(--surface);
      box-shadow: inset 3px 0 0 var(--kind, transparent);
    }

    .card--done .card__title {
      color: var(--soft);
      text-decoration: line-through;
    }

    .card__main {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .card__name {
      display: flex;
      flex-direction: column;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--text);
      text-align: left;
      cursor: pointer;
    }

    .card__name:hover .card__title {
      color: var(--accent);
    }

    .card__title {
      overflow: hidden;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card__text {
      display: -webkit-box;
      margin: 0;
      overflow: hidden;
      color: var(--soft);
      font-size: 13px;
      line-height: 1.35;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
    }

    .card__note {
      overflow: hidden;
      margin: 0;
      color: var(--accent);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card__row {
      gap: 6px;
    }

    .card__tools {
      display: flex;
      gap: 2px;
      align-items: center;
    }

    .card__btn {
      display: inline-flex;
      padding: 3px;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--muted);
      cursor: pointer;
    }

    .card__btn:hover,
    .card__btn.is-on {
      color: var(--accent);
    }
  `,
})
export class SessionCard {
  protected readonly session = inject(SessionStore);
  private readonly world = inject(WorldStore);

  /** The entry of the world this card stands for. */
  readonly ref = input.required<EntryRef>();
  /** In the master mode a card is picked instead of looked up, and it can be laid on the table. */
  readonly master = input(false);
  readonly pick = output<EntryRef>();
  readonly table = output<EntryRef>();

  protected readonly noteOpen = signal(false);
  protected readonly noteAnchor = signal<HTMLElement | null>(null);
  protected readonly draft = signal('');

  protected readonly kind = computed(() => SESSION_KINDS[this.ref().kind]);
  protected readonly state = computed(() => {
    const kind = this.kind();
    return kind ? this.session.state(kind, this.ref().id) : undefined;
  });
  protected readonly canFinish = computed(() => ['scene', 'quest', 'event'].includes(this.kind() ?? ''));
  protected readonly kicker = computed(() => {
    const kind = this.ref().kind;
    if (kind === 'quests') {
      const status = QUEST_STATUSES.find((other) => other.id === questStatus(this.state()))?.label.toLowerCase();
      return `Quest · ${status}`;
    }
    return isItem({ category: this.category() }) ? 'Gegenstand' : (KIND_LABELS[kind] ?? '');
  });
  protected readonly face = computed<Face | null>(() => this.faceOf());
  /** The open scene, when the entry can be added to it and is not part of it yet. */
  private readonly scene = computed(() => this.world.scenes().find((scene) => scene.id === this.world.activeScene()) ?? null);
  protected readonly canAdd = computed(() => {
    const list = SCENE_LISTS[this.ref().kind];
    return !!list && !!this.scene() && !this.scene()![list].includes(this.ref().id);
  });

  /** The plus: in the master mode the table decides the group, elsewhere the entry just lies on the table or leaves it. */
  protected toTable(): void {
    const kind = this.kind();
    if (this.master()) {
      this.table.emit(this.ref());
    } else if (kind) {
      this.session.toggle(kind, this.ref().id, 'on_table');
    }
  }

  /** Open the note of the game master about this entry. */
  protected openNote(event: MouseEvent): void {
    this.noteAnchor.set(event.currentTarget as HTMLElement);
    this.draft.set(this.state()?.gm_note ?? '');
    this.noteOpen.set(true);
  }

  /** Close the note and save what was written. */
  protected closeNote(): void {
    const kind = this.kind();
    if (kind && this.noteOpen() && this.draft() !== (this.state()?.gm_note ?? '')) {
      this.session.setNote(kind, this.ref().id, this.draft());
    }
    this.noteOpen.set(false);
  }

  /** Look the entry up in the window at the side, or pick it in the master mode. */
  protected lookUp(): void {
    const { kind, id } = this.ref();
    if (this.master()) {
      this.pick.emit(this.ref());
      return;
    }
    if (kind === 'scenes' && this.world.openScene) {
      this.world.openScene(id);
    } else {
      this.world.peek.set({ kind, id });
    }
  }

  /** Add the entry to the open scene, right away. This writes the scene of the world. */
  protected addToScene(): void {
    const scene = this.scene();
    const list = SCENE_LISTS[this.ref().kind];
    if (scene && list) {
      this.world.save('scenes', scene.id, { [list]: [...scene[list], this.ref().id] }).subscribe({
        error: () => this.session.error.set('Der Eintrag konnte der Szene nicht hinzugefügt werden.'),
      });
    }
  }

  private category(): string {
    const { kind, id } = this.ref();
    return kind === 'trivia' ? (this.world.trivia().find((trivia) => trivia.id === id)?.category ?? '') : '';
  }

  private faceOf(): Face | null {
    const { kind, id } = this.ref();
    const pick = <T extends EntryTexts & { id: number; name: string; symbol?: string }>(
      entries: T[], fallback: IconName, tone: string, text: (entry: T) => string = summaryOf,
    ): Face | null => {
      const found = entries.find((entry) => entry.id === id);
      return found ? { name: found.name, symbol: found.symbol ?? '', fallback, tone, text: text(found) } : null;
    };
    switch (kind) {
      case 'locations':
        return pick(this.world.locations(), 'pin', 'locations');
      case 'quests':
        return pick(this.world.quests(), 'quest', 'quests', (quest) => [quest.goal && `Ziel: ${quest.goal}`, quest.description].filter(Boolean).join(' · ') || summaryOf(quest));
      case 'events':
        return pick(this.world.events(), 'flag', 'events', (event) => event.happening || summaryOf(event));
      case 'scenes': {
        const scene = this.world.scenes().find((entry) => entry.id === id);
        return scene ? { name: scene.name, symbol: '', fallback: 'book', tone: 'scenes', text: scene.to_read || scene.description } : null;
      }
      case 'trivia': {
        const trivia = this.world.trivia().find((entry) => entry.id === id);
        return trivia
          ? { name: trivia.name, symbol: trivia.symbol, fallback: isItem(trivia) ? 'gift' : 'note', tone: isItem(trivia) ? 'items' : 'trivia', text: summaryOf(trivia) }
          : null;
      }
      case 'npcs': {
        const link = this.world.npcs().find((npc) => npc.npc === id);
        return link ? { name: link.name, symbol: link.symbol, fallback: 'sheet', tone: 'npcs', text: link.profession } : null;
      }
      default:
        return null;
    }
  }
}
