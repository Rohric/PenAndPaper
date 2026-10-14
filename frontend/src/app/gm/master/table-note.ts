import {
  Component, ElementRef, afterNextRender, computed, effect, input, linkedSignal, output, untracked, viewChild,
} from '@angular/core';

import { Note } from '../../core/session-models';
import { Icon } from '../../components/basic/icon';
import { AutoGrow } from '../../components/form/auto-grow';

const AUTOSAVE_MS = 700;

/**
 * A note of the game master lying on his table: an empty field of content with a name and a description, written in
 * place. What is typed saves itself a moment later, and at once when a field is left. The symbol in its head opens
 * the note in the window at the side. Keeping, turning it into an entry and deleting are the table's to do.
 */
@Component({
  selector: 'app-table-note',
  imports: [Icon, AutoGrow],
  template: `
    <article class="note">
      <div class="note__head">
        <span class="kicker">Notiz</span>
        <button type="button" class="note__open" title="Im Seitenfenster öffnen" aria-label="Notiz im Seitenfenster öffnen" (click)="open.emit()">
          <app-icon name="sheet" [size]="16" />
        </button>
      </div>
      <input
        #name
        class="input note__title"
        maxlength="200"
        aria-label="Name der Notiz"
        placeholder="Name"
        [value]="title()"
        (input)="title.set($any($event.target).value)"
        (change)="send()"
      />
      <textarea
        class="input note__text"
        rows="2"
        aria-label="Beschreibung der Notiz"
        placeholder="Beschreibung …"
        [appAutoGrow]="text()"
        [value]="text()"
        (input)="text.set($any($event.target).value)"
        (change)="send()"
      ></textarea>
    </article>
  `,
  styleUrl: './table-note.scss',
})
export class TableNote {
  readonly note = input.required<Note>();
  /** A note that was just laid: the cursor goes into its name, and the name is marked to be typed over. */
  readonly fresh = input(false);
  /** Fired with the new name and description. */
  readonly save = output<Pick<Note, 'title' | 'text'>>();
  readonly open = output<void>();

  /** The drafts start over only when another note is shown, not when the saved one comes back. */
  private readonly noteId = computed(() => this.note().id);
  protected readonly title = linkedSignal({ source: this.noteId, computation: () => untracked(() => this.note().title) });
  protected readonly text = linkedSignal({ source: this.noteId, computation: () => untracked(() => this.note().text) });
  private readonly name = viewChild.required<ElementRef<HTMLInputElement>>('name');
  /** What was sent last, so leaving a field right after typing does not send it twice. */
  private sent: string | null = null;

  constructor() {
    effect((onCleanup) => {
      this.title();
      this.text();
      const timer = setTimeout(() => untracked(() => this.send()), AUTOSAVE_MS);
      onCleanup(() => clearTimeout(timer));
    });
    afterNextRender(() => {
      if (this.fresh()) {
        this.name().nativeElement.focus();
        this.name().nativeElement.select();
      }
    });
  }

  /** Save what is typed, when it differs from the note and was not sent already; a note never loses its name. */
  protected send(): void {
    const note = this.note();
    const title = this.title().trim();
    const typed = JSON.stringify([title, this.text()]);
    if (!title || typed === JSON.stringify([note.title, note.text]) || typed === this.sent) {
      return;
    }
    this.sent = typed;
    this.save.emit({ title, text: this.text() });
  }
}
