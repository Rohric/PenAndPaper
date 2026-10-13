import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EntryRef, Scene } from '../../core/models';
import { QUEST_STATUSES, questStatus } from '../../core/session-models';
import { SESSION_KINDS, SessionStore } from '../../core/session-store';
import { WorldStore } from '../../core/world-store';
import { Icon } from '../basic/icon';
import { Portrait } from '../basic/portrait';
import { Popup } from '../window/popup';
import { chaptersOf, faceOf } from './entry-face';
import { openEntry } from './entry-views';
import { EyeToggle } from './eye-toggle';

/** The lists of a scene that an entry can be added to, by the kind of the entry. */
const SCENE_LISTS: Partial<Record<EntryRef['kind'], keyof Pick<Scene, 'quests' | 'events' | 'trivia' | 'npcs'>>> = {
  quests: 'quests',
  events: 'events',
  trivia: 'trivia',
  npcs: 'npcs',
};

/**
 * The one card for every entry of the world, always built the same way: the stripe in the colour of the kind,
 * the symbol, kind and name, the text, and on the right the switches of the round when a session is open.
 * It comes in three sizes: a tag (one line), a tile (lists, drawers, the glossary) and a card (more text and
 * what the entry is linked to). A click on the name follows the rule of the windows and opens the popup first.
 */
@Component({
  selector: 'app-entry-card',
  imports: [FormsModule, Icon, Popup, Portrait, EyeToggle],
  templateUrl: './entry-card.html',
  styleUrl: './entry-card.scss',
  host: { '[class.is-tag]': "size() === 'tag'" },
})
export class EntryCard {
  /** There is a session only while a round is played; while the world is written the card has no switches. */
  protected readonly session = inject(SessionStore, { optional: true });
  private readonly world = inject(WorldStore);
  private readonly router = inject(Router);

  /** The entry of the world this card stands for. */
  readonly ref = input.required<EntryRef>();
  readonly size = input<'tag' | 'tile' | 'card'>('tile');
  /** More words behind the kind, like " · hängt an einer Szene". */
  readonly marks = input('');
  /** Show all of the text instead of how it begins. */
  readonly whole = input(false);
  /** In the master mode the page decides what a click opens and which group of the table the entry joins. */
  readonly master = input(false);
  readonly pick = output<EntryRef>();
  readonly table = output<EntryRef>();

  protected readonly noteOpen = signal(false);
  protected readonly draft = signal('');

  protected readonly face = computed(() => faceOf(this.world, this.ref()));
  protected readonly chapters = computed(() => chaptersOf(this.world, this.ref()));
  /** The kind of the entry as a session tracks it; nothing while no session is open. */
  protected readonly kind = computed(() => (this.session ? SESSION_KINDS[this.ref().kind] : undefined));
  protected readonly state = computed(() => {
    const kind = this.kind();
    return kind ? this.session?.state(kind, this.ref().id) : undefined;
  });
  protected readonly canFinish = computed(() => ['scene', 'quest', 'event'].includes(this.kind() ?? ''));
  /** The kind in words; a quest in a session also says how far it is. */
  protected readonly kicker = computed(() => {
    const kicker = this.face()?.kicker ?? '';
    if (this.kind() !== 'quest') {
      return kicker;
    }
    const status = QUEST_STATUSES.find((other) => other.id === questStatus(this.state()))?.label.toLowerCase();
    return `${kicker} · ${status}`;
  });
  /** The open scene of a session, when the entry can be added to it and is not part of it yet. */
  private readonly scene = computed(() => this.world.scenes().find((scene) => scene.id === this.world.activeScene()) ?? null);
  protected readonly canAdd = computed(() => {
    const list = SCENE_LISTS[this.ref().kind];
    return !this.master() && !!list && !!this.scene() && !this.scene()![list].includes(this.ref().id);
  });

  /** A click on the name: the popup of the entry, or what the master mode does with it. */
  protected open(): void {
    if (this.master()) {
      this.pick.emit(this.ref());
    } else {
      openEntry(this.world, this.router, this.ref());
    }
  }

  /** Follow a tag of the card to the entry it names. */
  protected follow(ref: EntryRef): void {
    openEntry(this.world, this.router, ref);
  }

  /** Switch one of the flags of the round. */
  protected toggle(flag: 'revealed' | 'pinned' | 'done' | 'started'): void {
    const kind = this.kind();
    if (kind) {
      this.session?.toggle(kind, this.ref().id, flag);
    }
  }

  /** The plus: in the master mode the table decides the group, elsewhere the entry just lies on the table or leaves it. */
  protected toTable(): void {
    const kind = this.kind();
    if (this.master()) {
      this.table.emit(this.ref());
    } else if (kind) {
      this.session?.toggle(kind, this.ref().id, 'on_table');
    }
  }

  /** Open the note of the game master about this entry. */
  protected openNote(): void {
    this.draft.set(this.state()?.gm_note ?? '');
    this.noteOpen.set(true);
  }

  /** Close the note and save what was written. */
  protected closeNote(): void {
    const kind = this.kind();
    if (kind && this.noteOpen() && this.draft() !== (this.state()?.gm_note ?? '')) {
      this.session?.setNote(kind, this.ref().id, this.draft());
    }
    this.noteOpen.set(false);
  }

  /** Add the entry to the open scene, right away. This writes the scene of the world. */
  protected addToScene(): void {
    const scene = this.scene();
    const list = SCENE_LISTS[this.ref().kind];
    if (scene && list) {
      this.world.save('scenes', scene.id, { [list]: [...scene[list], this.ref().id] }).subscribe({
        error: () => this.session?.error.set('Der Eintrag konnte der Szene nicht hinzugefügt werden.'),
      });
    }
  }
}
