import { Component, computed, input, linkedSignal, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Note } from '../../core/session-models';

/**
 * One note in the window at the side: write a new one, change an own one, put it into the
 * notepad of the group or take it back, and read and write the comments of a shared note.
 */
@Component({
  selector: 'app-note-detail',
  imports: [FormsModule],
  templateUrl: './note-detail.html',
})
export class NoteDetail {
  /** The opened note; null stands for a new one. */
  readonly note = input<Note | null>(null);
  readonly add = output<Partial<Note>>();
  readonly save = output<{ id: number; changes: Partial<Note> }>();
  readonly remove = output<number>();
  readonly comment = output<{ id: number; text: string }>();

  /** Whether the reader may change the note: it is new or his own. */
  protected readonly writable = computed(() => this.note()?.mine ?? true);
  /** Id of the opened note. The drafts start over only when another note is opened, not on every reload. */
  private readonly noteId = computed(() => this.note()?.id ?? null);
  protected readonly title = linkedSignal({ source: this.noteId, computation: () => untracked(() => this.note()?.title ?? '') });
  protected readonly text = linkedSignal({ source: this.noteId, computation: () => untracked(() => this.note()?.text ?? '') });
  protected readonly dirty = computed(() => this.title() !== (this.note()?.title ?? '') || this.text() !== (this.note()?.text ?? ''));
  protected readonly reply = signal('');

  /** Save the note: a new one is created, an own one is changed. */
  protected store(shared: boolean): void {
    const note = this.note();
    const changes = { title: this.title().trim(), text: this.text(), shared };
    if (note) {
      this.save.emit({ id: note.id, changes });
    } else {
      this.add.emit(changes);
    }
  }

  /** Send the typed comment. */
  protected send(id: number): void {
    this.comment.emit({ id, text: this.reply().trim() });
    this.reply.set('');
  }

  /** Delete the note after the user confirmed. */
  protected drop(note: Note): void {
    if (confirm(`Die Notiz „${note.title}“ wirklich löschen?`)) {
      this.remove.emit(note.id);
    }
  }
}
