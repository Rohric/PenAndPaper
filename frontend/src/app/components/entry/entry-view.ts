import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { EntryRef, Npc } from '../../core/models';
import { SessionStore } from '../../core/session-store';
import { EyeToggle } from './eye-toggle';
import { Fold } from '../basic/fold';
import { Icon } from '../basic/icon';
import { Portrait } from '../basic/portrait';
import { CharacterService } from '../../core/character.service';
import { DialogueView } from './dialogue-view';
import { EntryCard } from './entry-card';
import { chaptersOf } from './entry-face';
import { Eyes, viewOf } from './entry-views';
import { LinkRow } from './link-row';
import { WorldStore } from '../../core/world-store';

/**
 * Read one entry of any kind, always in the same order: the head, its texts, the knowledge, the note of the game
 * master, dialogues, lists and what it is linked with. Every section folds at its title; the device remembers it.
 */
@Component({
  selector: 'app-entry-view',
  imports: [Icon, Portrait, LinkRow, DialogueView, EyeToggle, Fold, EntryCard],
  template: `
    @if (view(); as shown) {
      <article [class]="'panel kind--' + shown.tone" [style.--kind]="shown.colour || null">
        <header class="tile__head">
          <app-portrait [symbol]="shown.symbol" [fallback]="shown.fallback" [size]="52" />
          <div>
            <span class="kicker kicker--kind">{{ shown.kicker }}</span>
            <h2 class="subtitle">
              @if (eyes(); as seen) {
                <app-eye [shown]="seen.revealed" label="Name" (toggle)="eye.emit('name')" />
              }
              {{ shown.title }}
            </h2>
            @if (shown.sub) {
              <p class="soft">{{ shown.sub }}</p>
            }
            @if (chapters().length) {
              <div class="row">
                @for (chapter of chapters(); track chapter.id) {
                  @if (session) {
                    <span class="chip kind--chapters" [attr.title]="chapter.name">Kap. {{ chapter.number }}</span>
                  } @else {
                    <app-entry-card size="tag" [ref]="chapter.ref" [label]="'Kap. ' + chapter.number" />
                  }
                }
              </div>
            }
          </div>
        </header>

        @for (block of shown.blocks; track block.label) {
          <app-fold [key]="'read:' + block.label" [title]="block.label">
            @if (eyes() && block.key) {
              <app-eye foldLead [shown]="eyes()!.shown.includes(block.key!)" [label]="block.label" [faded]="!eyes()!.revealed" (toggle)="eye.emit(block.key!)" />
            }
            <p class="prose" [class.read-aloud]="block.readAloud">{{ block.text }}</p>
          </app-fold>
        }

        @for (group of shown.knowledge; track group.label) {
          <app-fold [key]="'read:' + group.label" [title]="group.label" [count]="group.pieces.length" [locked]="group.gmOnly">
            @for (piece of group.pieces; track $index) {
              <div class="knowledge" [class.knowledge--gm]="group.gmOnly">
                @if (eyes() && !group.gmOnly) {
                  <app-eye [shown]="eyes()!.known.includes($index)" label="Herausgefunden" [faded]="!eyes()!.revealed" (toggle)="eye.emit('known:' + $index)" />
                }
                @if (piece.title) {
                  <span class="kicker">{{ piece.title }}</span>
                }
                <p class="prose">{{ piece.text }}</p>
              </div>
            }
          </app-fold>
        }

        @if (shown.note) {
          <app-fold key="read:Notiz" title="Notiz (nur für dich)" [locked]="true">
            <div class="knowledge knowledge--gm">
              <p class="prose">{{ shown.note }}</p>
            </div>
          </app-fold>
        }

        @if (shown.dialogues.length) {
          <app-fold key="read:Dialoge" title="Dialoge" [count]="shown.dialogues.length">
            <app-dialogue-view [dialogues]="shown.dialogues" />
          </app-fold>
        }

        @if (shown.phrases.length) {
          <app-fold key="read:Beispielsätze" title="Beispielsätze" [count]="shown.phrases.length">
            @for (phrase of shown.phrases; track $index) {
              <div class="read-aloud">
                @if (phrase.trigger) {
                  <span class="kicker">{{ phrase.trigger }}</span>
                }
                <p class="prose">{{ phrase.text }}</p>
              </div>
            }
          </app-fold>
        }

        @for (list of shown.lists; track list.label) {
          <app-fold [key]="'read:' + list.label" [title]="list.label" [count]="list.items.length">
            @if (eyes() && list.key === 'checklist') {
              @for (item of list.items; track $index) {
                <div class="row">
                  <app-eye [shown]="eyes()!.shown.includes('step:' + $index)" [label]="item" [faded]="!eyes()!.revealed" (toggle)="eye.emit('step:' + $index)" />
                  <label class="check">
                    <input type="checkbox" [checked]="eyes()!.steps.includes($index)" (change)="step.emit($index)" />
                    {{ item }}
                  </label>
                </div>
              }
            } @else {
              <ul class="plain-list">
                @for (item of list.items; track $index) {
                  <li>{{ item }}</li>
                }
              </ul>
            }
          </app-fold>
        }

        @if (shown.links.length) {
          <app-fold key="read:Verknüpfungen" title="Verknüpfungen" [count]="linkCount()">
            @for (group of shown.links; track group.label) {
              <app-link-row
                [label]="group.label"
                [items]="group.items"
                [eye]="eyes() && group.key ? eyes()!.shown.includes(group.key) : null"
                [faded]="!eyes()?.revealed"
                (eyeToggle)="eye.emit(group.key!)"
              />
            }
          </app-fold>
        }

        @if (shown.pictures) {
          <app-fold key="read:Bilder" title="Bilder">
            <div class="row">
              @for (slot of slots(shown.pictures); track slot) {
                <span class="picture-slot"><app-icon name="image" [size]="20" /> Bild folgt</span>
              }
            </div>
          </app-fold>
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
  /** In a session the chapters are only shown; while the world is written they open their popup. */
  protected readonly session = inject(SessionStore, { optional: true });

  readonly entry = input.required<EntryRef>();
  /** What the players see, when a session decides it; each part then gets an eye. Writing the world has none. */
  readonly eyes = input<Eyes | null>(null);
  /** The eye of a part was clicked: its key, like "name", "goal", "step:2" or "known:0". */
  readonly eye = output<string>();
  /** A point of the checklist was ticked: its position. */
  readonly step = output<number>();

  /** The character itself; the world only knows name, profession and place of an NPC. */
  private readonly npc = signal<Npc | null>(null);
  private readonly npcId = computed(() => (this.entry().kind === 'npcs' ? this.entry().id : null));
  protected readonly view = computed(() => viewOf(this.store, this.entry(), this.npc()));
  /** The chapters the entry is tagged with, each with the pointer its tag opens. */
  protected readonly chapters = computed(() =>
    chaptersOf(this.store, this.entry()).map((chapter) => ({ ...chapter, ref: { kind: 'chapters' as const, id: chapter.id } })),
  );
  protected readonly linkCount = computed(() => (this.view()?.links ?? []).reduce((sum, group) => sum + group.items.length, 0));
  protected readonly isEmpty = computed(() => {
    const view = this.view();
    const parts = view ? [view.blocks, view.knowledge, view.lists, view.phrases, view.links, view.dialogues] : [];
    return !!view && !view.note && parts.every((part) => !part.length);
  });

  constructor() {
    // Load the character whenever another NPC is shown.
    effect(() => this.loadNpc(this.npcId()));
  }

  /** The numbers of the places for pictures. */
  protected slots(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index);
  }

  private loadNpc(id: number | null): void {
    this.npc.set(null);
    if (id !== null) {
      this.characters.get<Npc>('npcs', id).subscribe({ next: (npc) => this.npc.set(npc), error: () => undefined });
    }
  }
}
