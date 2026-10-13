import { Component, computed, input, output } from '@angular/core';

import { Note } from '../../core/session-models';
import { Icon } from '../../shared/icon';

/**
 * The notes of a session as a board of cards: the own notes of the reader on one side,
 * the notepad of the group on the other. A card opens in the window at the side.
 */
@Component({
  selector: 'app-session-notes',
  imports: [Icon],
  templateUrl: './session-notes.html',
  styleUrl: './session-notes.scss',
})
export class SessionNotes {
  readonly notes = input.required<Note[]>();
  /** Asks to open a note; null stands for a new one. */
  readonly open = output<number | null>();

  protected readonly own = computed(() => this.notes().filter((note) => note.mine && !note.shared));
  protected readonly group = computed(() => this.notes().filter((note) => note.shared));
}
