import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { EntryRef, Npc } from '../../core/models';
import { CharacterService } from '../characters/character.service';
import { viewOf } from './entry-views';
import { LinkRow } from './link-row';
import { WorldStore } from './world-store';

/** Read one entry of the glossary: its texts, its lists and everything it is linked with. */
@Component({
  selector: 'app-entry-view',
  imports: [LinkRow],
  template: `
    @if (view(); as shown) {
      <article class="panel">
        <header class="row row--between">
          <div>
            <span class="kicker">{{ shown.kicker }}</span>
            <h2 class="subtitle">{{ shown.title }}</h2>
            @if (shown.sub) {
              <p class="soft">{{ shown.sub }}</p>
            }
          </div>
          @if (editable()) {
            <button type="button" class="btn btn--small" (click)="edit.emit()">Bearbeiten</button>
          }
        </header>

        @for (block of shown.blocks; track block.label) {
          <div class="field">
            <span class="label">{{ block.label }}</span>
            <p class="prose">{{ block.text }}</p>
          </div>
        }

        @for (group of shown.knowledge; track group.label) {
          <div class="field">
            <span class="label">{{ group.label }}</span>
            @for (piece of group.pieces; track $index) {
              <div class="knowledge" [class.knowledge--gm]="group.gmOnly">
                @if (piece.title) {
                  <span class="kicker">{{ piece.title }}</span>
                }
                <p class="prose">{{ piece.text }}</p>
              </div>
            }
          </div>
        }

        @for (list of shown.lists; track list.label) {
          <div class="field">
            <span class="label">{{ list.label }}</span>
            <ul class="plain-list">
              @for (item of list.items; track $index) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        }

        @if (shown.phrases.length) {
          <div class="field">
            <span class="label">Beispielsätze</span>
            @for (phrase of shown.phrases; track $index) {
              <div class="read-aloud">
                @if (phrase.trigger) {
                  <span class="kicker">{{ phrase.trigger }}</span>
                }
                <p class="prose">{{ phrase.text }}</p>
              </div>
            }
          </div>
        }

        @for (group of shown.links; track group.label) {
          <app-link-row [label]="group.label" [items]="group.items" />
        }

        @if (isEmpty()) {
          <p class="soft">Hier steht noch nichts.</p>
        }
      </article>
    } @else {
      <div class="empty">
        <p>Diesen Eintrag gibt es nicht mehr.</p>
      </div>
    }
  `,
})
export class EntryView {
  private readonly store = inject(WorldStore);
  private readonly characters = inject(CharacterService);

  readonly entry = input.required<EntryRef>();
  /** Whether the edit button is shown. */
  readonly editable = input(false);
  readonly edit = output<void>();

  /** The character itself; the world only knows name, profession and place of an NPC. */
  private readonly npc = signal<Npc | null>(null);
  private readonly npcId = computed(() => (this.entry().kind === 'npcs' ? this.entry().id : null));
  protected readonly view = computed(() => viewOf(this.store, this.entry(), this.npc()));
  protected readonly isEmpty = computed(() => {
    const view = this.view();
    const parts = view ? [view.blocks, view.knowledge, view.lists, view.phrases, view.links] : [];
    return !!view && parts.every((part) => !part.length);
  });

  constructor() {
    // Load the character whenever another NPC is shown.
    effect(() => this.loadNpc(this.npcId()));
  }

  private loadNpc(id: number | null): void {
    this.npc.set(null);
    if (id !== null) {
      this.characters.get<Npc>('npcs', id).subscribe({ next: (npc) => this.npc.set(npc), error: () => undefined });
    }
  }
}
