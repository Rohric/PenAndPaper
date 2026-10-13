import { Component, computed, effect, inject, input, signal } from '@angular/core';

import { EntryRef, Knowledge, Npc } from '../../core/models';
import { CharacterService } from '../characters/character.service';
import { WorldStore } from '../worlds/world-store';
import { SESSION_KINDS, SessionStore } from './session-store';

/**
 * What a session can do with the entry that is looked up: mark it as done, pin it,
 * reveal it to the players, and check the quest steps and the pieces of knowledge they know.
 */
@Component({
  selector: 'app-session-entry-actions',
  template: `
    @if (kind(); as sessionKind) {
      <div class="panel">
        <span class="kicker">In dieser Runde</span>
        <div class="row">
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.done" (click)="session.toggle(sessionKind, entry().id, 'done')">
            Erledigt
          </button>
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.pinned" (click)="session.toggle(sessionKind, entry().id, 'pinned')">
            Stecknadel
          </button>
          <button type="button" class="pill" [attr.aria-pressed]="!!state()?.revealed" (click)="session.toggle(sessionKind, entry().id, 'revealed')">
            {{ sessionKind === 'quest' ? 'Mit Spielern geteilt' : 'Für Spieler sichtbar' }}
          </button>
        </div>

        @if (steps().length) {
          <div class="field">
            <span class="label">Schritte der Quest</span>
            @for (step of steps(); track $index) {
              <label class="check">
                <input type="checkbox" [checked]="state()?.steps?.includes($index)" (change)="session.toggleIn(sessionKind, entry().id, 'steps', $index)" />
                {{ step }}
              </label>
            }
          </div>
        }

        @if (knowledge().length) {
          <div class="field">
            <span class="label">Das wissen die Spieler schon</span>
            @for (piece of knowledge(); track $index) {
              <label class="check">
                <input type="checkbox" [checked]="state()?.known?.includes($index)" (change)="session.toggleIn(sessionKind, entry().id, 'known', $index)" />
                {{ piece.title ? piece.title + ': ' : '' }}{{ piece.text }}
              </label>
            }
          </div>
        }
      </div>
    }
  `,
})
export class SessionEntryActions {
  protected readonly session = inject(SessionStore);
  private readonly world = inject(WorldStore);
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
  protected readonly steps = computed(() => this.world.quests().find((quest) => this.is('quests', quest.id))?.checklist ?? []);
  protected readonly knowledge = computed<Knowledge[]>(() => this.playerKnowledge());

  constructor() {
    // Load the character whenever another NPC is looked up.
    effect(() => this.loadNpc(this.npcId()));
  }

  private is(kind: EntryRef['kind'], id: number): boolean {
    return this.entry().kind === kind && this.entry().id === id;
  }

  private playerKnowledge(): Knowledge[] {
    const { kind, id } = this.entry();
    if (kind === 'npcs') {
      return this.npc()?.id === id ? (this.npc()?.player_knowledge ?? []) : [];
    }
    const lists = { locations: this.world.locations(), quests: this.world.quests(), events: this.world.events(), trivia: this.world.trivia() };
    const entries = kind in lists ? lists[kind as keyof typeof lists] : [];
    return entries.find((entry) => entry.id === id)?.player_knowledge ?? [];
  }

  private loadNpc(id: number | null): void {
    this.npc.set(null);
    if (id !== null) {
      this.characters.get<Npc>('npcs', id).subscribe({ next: (npc) => this.npc.set(npc), error: () => undefined });
    }
  }
}
