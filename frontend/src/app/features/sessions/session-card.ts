import { Component, computed, inject, input } from '@angular/core';

import { EntryRef } from '../../core/models';
import { QUEST_STATUSES, questStatus } from '../../core/session-models';
import { EyeToggle } from '../../shared/eye-toggle';
import { Icon, IconName } from '../../shared/icon';
import { Portrait } from '../../shared/portrait';
import { KIND_LABELS, isItem } from '../worlds/entry-views';
import { WorldStore } from '../worlds/world-store';
import { SESSION_KINDS, SessionStore } from './session-store';

/** What a card needs to show of an entry of the world. */
interface Face {
  name: string;
  symbol: string;
  fallback: IconName;
  tone: string;
}

/**
 * A small card for any entry of the world while playing: its name, the eye that shows it to the players,
 * the pin and, where it makes sense, "done". A quest can also be accepted and finished here.
 * A click on the name looks the entry up in the window at the side.
 */
@Component({
  selector: 'app-session-card',
  imports: [Icon, Portrait, EyeToggle],
  template: `
    @if (face(); as shown) {
      <article [class]="'card kind--' + shown.tone" [class.card--done]="!!state()?.done">
        <button type="button" class="card__name" (click)="lookUp()">
          <app-portrait [symbol]="shown.symbol" [fallback]="shown.fallback" [size]="28" />
          <span class="card__text">
            <span class="kicker">{{ kicker() }}</span>
            <span class="card__title">{{ shown.name }}</span>
          </span>
        </button>
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
        @if (kind() === 'quest') {
          <button type="button" class="chip chip--link card__accept" [attr.aria-pressed]="!!state()?.started" (click)="session.toggle('quest', ref().id, 'started')">
            <app-icon name="flag" [size]="12" /> {{ state()?.started ? 'Angenommen' : 'Annehmen' }}
          </button>
        }
      </article>
    }
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .card {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 8px;
      align-items: center;
      justify-content: space-between;
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

    .card__name {
      display: flex;
      flex: 1 1 140px;
      gap: 8px;
      align-items: center;
      min-width: 0;
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

    .card__text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .card__title {
      overflow: hidden;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
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

    .card__accept {
      flex: 0 0 auto;
    }
  `,
})
export class SessionCard {
  protected readonly session = inject(SessionStore);
  private readonly world = inject(WorldStore);

  /** The entry of the world this card stands for. */
  readonly ref = input.required<EntryRef>();

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

  /** Look the entry up in the window at the side. */
  protected lookUp(): void {
    const { kind, id } = this.ref();
    if (kind === 'scenes' && this.world.openScene) {
      this.world.openScene(id);
    } else {
      this.world.peek.set({ kind, id });
    }
  }

  private category(): string {
    const { kind, id } = this.ref();
    return kind === 'trivia' ? (this.world.trivia().find((trivia) => trivia.id === id)?.category ?? '') : '';
  }

  private faceOf(): Face | null {
    const { kind, id } = this.ref();
    const pick = <T extends { id: number; name: string; symbol?: string }>(entries: T[], fallback: IconName, tone: string): Face | null => {
      const found = entries.find((entry) => entry.id === id);
      return found ? { name: found.name, symbol: found.symbol ?? '', fallback, tone } : null;
    };
    switch (kind) {
      case 'locations':
        return pick(this.world.locations(), 'pin', 'locations');
      case 'quests':
        return pick(this.world.quests(), 'quest', 'quests');
      case 'events':
        return pick(this.world.events(), 'flag', 'events');
      case 'scenes':
        return pick(this.world.scenes(), 'book', 'scenes');
      case 'trivia': {
        const trivia = this.world.trivia().find((entry) => entry.id === id);
        return trivia ? { name: trivia.name, symbol: trivia.symbol, fallback: isItem(trivia) ? 'gift' : 'note', tone: isItem(trivia) ? 'items' : 'trivia' } : null;
      }
      case 'npcs': {
        const link = this.world.npcs().find((npc) => npc.npc === id);
        return link ? { name: link.name, symbol: link.symbol, fallback: 'sheet', tone: 'npcs' } : null;
      }
      default:
        return null;
    }
  }
}
