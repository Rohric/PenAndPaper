import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { EntryLink, Quest, questLabel } from '../../core/models';
import { EyeToggle } from '../../shared/eye-toggle';
import { Portrait } from '../../shared/portrait';
import { isItem, npcLinks, openEntry, sceneLinks, summaryOf } from './entry-views';
import { WorldStore } from './world-store';

/** A link of a quest with the word that says what it is for, like "Questgeber". */
interface Tag extends EntryLink {
  word: string;
}

/**
 * A quest as a tile that uses its room: kind and number, name, goal, how far the checklist is,
 * and as tags the giver, the place where it starts, the scene it comes from, its characters and
 * its items. A click on the tile or on a tag looks the entry up at the side.
 * Whoever shows the tile puts its buttons inside.
 */
@Component({
  selector: 'app-quest-tile',
  imports: [Portrait, EyeToggle],
  template: `
    <article class="tile kind--quests" [class.tile--done]="done()">
      <button type="button" class="tile__body" (click)="lookUp()">
        <span class="tile__head">
          <app-portrait fallback="quest" [symbol]="now().symbol" [size]="36" />
          <span class="tile__names">
            <span class="kicker">{{ label() }}{{ marks() }}</span>
            <span class="tile__title">{{ now().name }}</span>
          </span>
        </span>
        @if (now().goal) {
          <span class="soft clamp"><strong>Ziel:</strong> {{ now().goal }}</span>
        }
        @if (now().description) {
          <span class="soft clamp">{{ now().description }}</span>
        } @else if (!now().goal && summary()) {
          <span class="soft clamp">{{ summary() }}</span>
        }
      </button>
      @if (eye() !== null) {
        <app-eye class="tile__eye" [shown]="eye() === true" label="Für Spieler sichtbar" (toggle)="eyeToggle.emit()" />
      }
      @if (now().checklist.length) {
        <span class="soft">Checkliste: {{ stepsDone() === null ? '' : stepsDone() + ' von ' }}{{ now().checklist.length }} Schritte</span>
      }
      @if (tags().length) {
        <div class="row">
          @for (tag of tags(); track tag.word + tag.kind + tag.id) {
            <button type="button" [class]="'chip chip--link kind--' + (tag.tone ?? tag.kind)" (click)="follow(tag)">
              {{ tag.word }} · {{ tag.label }}
            </button>
          }
        </div>
      }
      <ng-content />
    </article>
  `,
})
export class QuestTile {
  private readonly store = inject(WorldStore);
  private readonly router = inject(Router);

  readonly quest = input.required<Quest>();
  /** Whether the quest is done; then the tile steps back. */
  readonly done = input(false);
  /** More words behind the kind, like " · geteilt". */
  readonly marks = input('');
  /** Whether the players see the quest, when a session decides it; null shows no eye. */
  readonly eye = input<boolean | null>(null);
  readonly eyeToggle = output<void>();
  /** How many steps of the checklist a session has checked; outside a session nothing is counted. */
  readonly stepsDone = input<number | null>(null);

  /** The quest as it counts right now: in a session with what that session has different about it. */
  protected readonly now = computed(() => this.store.questNow(this.quest()));
  protected readonly label = computed(() => questLabel(this.now()));
  protected readonly summary = computed(() => summaryOf(this.now()));
  protected readonly tags = computed<Tag[]>(() => {
    const quest = this.now();
    const places = this.store.locations().filter((place) => place.id === quest.location);
    const scenes = this.store.scenes().filter((scene) => scene.id === quest.scene);
    const items = this.store.trivia().filter((trivia) => isItem(trivia) && trivia.quests.includes(quest.id));
    return [
      ...this.tagged('Questgeber', npcLinks(this.store, [quest.giver])),
      ...this.tagged('Startgebiet', places.map((place) => ({ kind: 'locations', id: place.id, label: place.name }))),
      ...this.tagged('Szene', sceneLinks(this.store, scenes)),
      ...this.tagged('Figur', npcLinks(this.store, quest.npcs)),
      ...this.tagged('Gegenstand', items.map((item) => ({ kind: 'trivia', id: item.id, label: item.name, tone: 'items' }))),
    ];
  });

  /** Look the quest up in the window at the side. */
  protected lookUp(): void {
    this.store.peek.set({ kind: 'quests', id: this.quest().id });
  }

  /** Follow a tag: look the entry up, or go to the scene. */
  protected follow(tag: Tag): void {
    openEntry(this.store, this.router, tag);
  }

  private tagged(word: string, links: EntryLink[]): Tag[] {
    return links.map((link) => ({ ...link, word }));
  }
}
