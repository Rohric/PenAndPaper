import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Note } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { timeAgo } from '../../shared/time-ago';

type Filter = 'all' | 'mine' | 'group';

/**
 * The notes of a session as a board of cards: the own notes of the reader and the notepad of the group.
 * A field on top makes a quick note from a title; the filters, the search and the order keep the board short.
 * A card opens in the window at the side.
 */
@Component({
  selector: 'app-session-notes',
  imports: [FormsModule, Icon],
  templateUrl: './session-notes.html',
  styleUrl: './session-notes.scss',
})
export class SessionNotes {
  readonly notes = input.required<Note[]>();
  /** Asks to open a note; null stands for a new one. */
  readonly open = output<number | null>();
  /** Asks to make a note from a title alone. */
  readonly quick = output<string>();

  protected readonly ago = timeAgo;
  protected readonly filter = signal<Filter>('all');
  protected readonly query = signal('');
  protected readonly newest = signal(true);
  protected readonly title = signal('');
  protected readonly own = computed(() => this.arranged(this.notes().filter((note) => note.mine && !note.shared)));
  protected readonly group = computed(() => this.arranged(this.notes().filter((note) => note.shared)));
  protected readonly showOwn = computed(() => this.filter() !== 'group');
  protected readonly showGroup = computed(() => this.filter() !== 'mine');

  /** Make the quick note and clear the field. */
  protected add(): void {
    if (this.title().trim()) {
      this.quick.emit(this.title().trim());
      this.title.set('');
    }
  }

  private arranged(notes: Note[]): Note[] {
    const query = this.query().trim().toLowerCase();
    const found = notes.filter((note) => `${note.title} ${note.text}`.toLowerCase().includes(query));
    return this.newest() ? found : [...found].sort((a, b) => a.title.localeCompare(b.title));
  }
}
