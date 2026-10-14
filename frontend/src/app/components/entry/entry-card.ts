import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EntryRef, Scene } from '../../core/models';
import { QUEST_STATUSES, questStatus } from '../../core/session-models';
import { SESSION_KINDS, SessionStore } from '../../core/session-store';
import { WorldStore } from '../../core/world-store';
import { Icon } from '../basic/icon';
import { Portrait } from '../basic/portrait';
import { Popup } from '../window/popup';
import { Face, FaceTag, chaptersOf, faceOf } from './entry-face';
import { openEntry, roundKicker } from './entry-views';
import { EyeToggle } from './eye-toggle';

/** A tile with more tags than this is two columns wide in a wall, so it grows wider instead of taller. */
const WIDE_TAGS = 4;

/** The tags of a card that say the same about the entry, like all its "Figur" links. */
interface TagGroup {
  word: string;
  tags: FaceTag[];
}

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
 * It comes in three sizes: a tag (one line), a tile (walls, drawers, lists) and a card (more lines of text).
 * Tile and card show all their tags, small and grouped by what they are to the entry. A click on the name follows
 * the rule of the windows and opens the popup first. Something that is no entry of the world can wear the same
 * card with a face of its own ("loose"); a click on it only tells the page.
 */
@Component({
  selector: 'app-entry-card',
  imports: [FormsModule, Icon, Popup, Portrait, EyeToggle],
  templateUrl: './entry-card.html',
  styleUrl: './entry-card.scss',
  host: { '[class.is-tag]': "size() === 'tag'", '[class.is-wide]': "size() === 'tile' && (face()?.tags?.length ?? 0) > WIDE_TAGS" },
})
export class EntryCard {
  /** There is a session only while a round is played; while the world is written the card has no switches. */
  protected readonly session = inject(SessionStore, { optional: true });
  private readonly world = inject(WorldStore);

  /** The entry of the world this card stands for; null for a loose card. */
  readonly ref = input<EntryRef | null>(null);
  /** The face of something that is no entry of the world, like an item only a player carries. */
  readonly loose = input<Face | null>(null);
  readonly size = input<'tag' | 'tile' | 'card'>('tile');
  /** Other words for a tag than the name of the entry, like "Kap. 2 · Am Hafen". */
  readonly label = input('');
  /** Another colour for a tag than the one of the kind: an item is knowledge, but has its own colour. */
  readonly tone = input('');
  /** More words behind the kind, like " · hängt an einer Szene". */
  readonly marks = input('');
  /** Show all of the text instead of how it begins. */
  readonly whole = input(false);
  /** In the master mode the page decides what a click opens and which group of the table the entry joins. */
  readonly master = input(false);
  readonly pick = output<EntryRef>();
  readonly table = output<EntryRef>();
  /** A loose card was clicked. */
  readonly press = output<void>();

  protected readonly WIDE_TAGS = WIDE_TAGS;
  protected readonly noteOpen = signal(false);
  protected readonly draft = signal('');

  protected readonly face = computed(() => {
    const ref = this.ref();
    return this.loose() ?? (ref ? faceOf(this.world, ref) : null);
  });
  protected readonly chapters = computed(() => {
    const ref = this.ref();
    return ref ? chaptersOf(this.world, ref) : [];
  });
  /** The tags side by side, each word once before the names it is about. */
  protected readonly tagGroups = computed<TagGroup[]>(() => {
    const groups: TagGroup[] = [];
    for (const tag of this.face()?.tags ?? []) {
      const group = groups.find((other) => other.word === tag.word);
      if (group) {
        group.tags.push(tag);
      } else {
        groups.push({ word: tag.word, tags: [tag] });
      }
    }
    return groups;
  });
  /** The kind of the entry as a session tracks it; nothing while no session is open. */
  protected readonly kind = computed(() => {
    const ref = this.ref();
    return this.session && ref ? SESSION_KINDS[ref.kind] : undefined;
  });
  protected readonly state = computed(() => {
    const kind = this.kind();
    const ref = this.ref();
    return kind && ref ? this.session?.state(kind, ref.id) : undefined;
  });
  protected readonly canFinish = computed(() => ['scene', 'quest', 'event'].includes(this.kind() ?? ''));
  /** The kind in words; a quest in a session also says how far it is, and an entry of the round ends with its mark. */
  protected readonly kicker = computed(() => {
    const ref = this.ref();
    const kicker = this.face()?.kicker ?? '';
    const status = QUEST_STATUSES.find((other) => other.id === questStatus(this.state()))?.label.toLowerCase();
    return roundKicker(this.kind() === 'quest' ? `${kicker} · ${status}` : kicker, !!ref && this.world.ofRound(ref));
  });
  /**
   * The open scene of a session, when the entry can be added to it and is not part of it yet. Only a scene the round
   * made up takes new links; a scene of the world stays as it is written.
   */
  private readonly scene = computed(() => this.world.written.scenes().find((scene) => scene.id === this.world.activeScene() && !!scene.session) ?? null);
  protected readonly canAdd = computed(() => {
    const ref = this.ref();
    const list = ref && SCENE_LISTS[ref.kind];
    return !this.master() && !!ref && !!list && !!this.scene() && !this.scene()![list].includes(ref.id);
  });

  /** A click on the name: the popup of the entry, what the master mode does with it, or what a loose card stands for. */
  protected open(): void {
    const ref = this.ref();
    if (!ref) {
      this.press.emit();
    } else if (this.master()) {
      this.pick.emit(ref);
    } else {
      openEntry(this.world, ref);
    }
  }

  /** Follow a tag of the card to the entry it names. */
  protected follow(ref: EntryRef): void {
    openEntry(this.world, ref);
  }

  /** Switch one of the flags of the round. */
  protected toggle(flag: 'revealed' | 'pinned' | 'done' | 'started'): void {
    const kind = this.kind();
    const ref = this.ref();
    if (kind && ref) {
      this.session?.toggle(kind, ref.id, flag);
    }
  }

  /** The plus: in the master mode the table decides the group, elsewhere the entry just lies on the table or leaves it. */
  protected toTable(): void {
    const kind = this.kind();
    const ref = this.ref();
    if (ref && this.master()) {
      this.table.emit(ref);
    } else if (kind && ref) {
      this.session?.toggle(kind, ref.id, 'on_table');
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
    const ref = this.ref();
    if (kind && ref && this.noteOpen() && this.draft() !== (this.state()?.gm_note ?? '')) {
      this.session?.setNote(kind, ref.id, this.draft());
    }
    this.noteOpen.set(false);
  }

  /** Add the entry to the open scene of the round, right away. */
  protected addToScene(): void {
    const scene = this.scene();
    const ref = this.ref();
    const list = ref && SCENE_LISTS[ref.kind];
    if (scene && ref && list) {
      this.world.save('scenes', scene.id, { [list]: [...scene[list], ref.id] }).subscribe({
        error: () => this.session?.error.set('Der Eintrag konnte der Szene nicht hinzugefügt werden.'),
      });
    }
  }
}
