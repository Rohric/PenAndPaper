import { Component, input, output } from '@angular/core';
import { Observable } from 'rxjs';

import { Dialogue, DialogueLine, Option } from '../../core/models';
import { AutoGrow } from './auto-grow';
import { Icon } from '../basic/icon';
import { LinkPicker } from './link-picker';

/**
 * Edit what is said in a scene, a quest or an event. Every statement has a text and, if wanted,
 * a character who says it. Statements that follow each other in one block form a conversation;
 * a block can be joined to the one before, and a conversation can get a title.
 */
@Component({
  selector: 'app-dialogue-list-editor',
  imports: [Icon, LinkPicker, AutoGrow],
  template: `
    @for (dialogue of dialogues(); track $index; let at = $index) {
      <div class="talk">
        <div class="list-row">
          <input
            class="input"
            placeholder="Titel des Gesprächs (freiwillig)"
            [attr.aria-label]="'Titel von Gespräch ' + (at + 1)"
            [value]="dialogue.title"
            (input)="setTitle(at, $any($event.target).value)"
          />
          @if (at > 0) {
            <button type="button" class="btn btn--small" (click)="join(at)">Mit dem vorigen verbinden</button>
          }
          <button type="button" class="btn btn--small btn--danger" [attr.aria-label]="'Gespräch ' + (at + 1) + ' löschen'" (click)="remove(at)">
            <app-icon name="trash" [size]="16" />
          </button>
        </div>

        @for (line of dialogue.lines; track $index; let row = $index) {
          <div class="line">
            <app-link-picker
              single
              emptyText="Wer spricht? (freiwillig)"
              [label]="'Wer in Zeile ' + (row + 1) + ' spricht'"
              [options]="speakers()"
              [value]="line.npc"
              [creatable]="!!newSpeaker()"
              (valueChange)="setLine(at, row, { npc: $event })"
              (create)="createSpeaker(at, row, $event)"
              (look)="look.emit($event)"
            />
            <textarea
              class="input"
              rows="1"
              placeholder="Was gesagt wird …"
              [attr.aria-label]="'Text von Zeile ' + (row + 1)"
              [appAutoGrow]="line.text"
              [value]="line.text"
              (input)="setLine(at, row, { text: $any($event.target).value })"
            ></textarea>
            <button type="button" class="btn btn--small" [attr.aria-label]="'Zeile ' + (row + 1) + ' löschen'" (click)="removeLine(at, row)">
              <app-icon name="close" [size]="16" />
            </button>
          </div>
        }

        <div class="row">
          <button type="button" class="btn btn--small" (click)="addLine(at)"><app-icon name="plus" [size]="16" /> Antwort im selben Gespräch</button>
        </div>
      </div>
    } @empty {
      <p class="soft">Noch nichts gesagt.</p>
    }

    <div class="row">
      <button type="button" class="btn btn--small" (click)="add()"><app-icon name="speech" [size]="16" /> Neue Aussage</button>
    </div>
  `,
  styleUrl: './dialogue-list-editor.scss',
})
export class DialogueListEditor {
  readonly dialogues = input.required<Dialogue[]>();
  /** The characters that can speak. */
  readonly speakers = input.required<Option[]>();
  readonly dialoguesChange = output<Dialogue[]>();
  /** Fired with the id of a speaker that was clicked, to look the character up. */
  readonly look = output<number>();
  /** How a new character is created from a typed name; it answers with the id. Without it only known characters speak. */
  readonly newSpeaker = input<((name: string) => Observable<number>) | null>(null);

  /** Create a character with the typed name and let it speak the line. */
  protected createSpeaker(at: number, row: number, name: string): void {
    this.newSpeaker()?.(name).subscribe((npc) => this.setLine(at, row, { npc }));
  }

  /** Add a statement that stands for itself. */
  protected add(): void {
    this.dialoguesChange.emit([...this.dialogues(), { title: '', lines: [{ npc: null, text: '' }] }]);
  }

  /** Add an answer to a conversation. */
  protected addLine(at: number): void {
    this.change(at, (dialogue) => ({ ...dialogue, lines: [...dialogue.lines, { npc: null, text: '' }] }));
  }

  protected setTitle(at: number, title: string): void {
    this.change(at, (dialogue) => ({ ...dialogue, title }));
  }

  /** Change who speaks in a line, or what is said. */
  protected setLine(at: number, row: number, changes: Partial<DialogueLine>): void {
    this.change(at, (dialogue) => ({ ...dialogue, lines: dialogue.lines.map((line, index) => (index === row ? { ...line, ...changes } : line)) }));
  }

  protected removeLine(at: number, row: number): void {
    this.change(at, (dialogue) => ({ ...dialogue, lines: dialogue.lines.filter((_, index) => index !== row) }));
  }

  protected remove(at: number): void {
    this.dialoguesChange.emit(this.dialogues().filter((_, index) => index !== at));
  }

  /** Join a block to the one before, so their statements become one conversation. */
  protected join(at: number): void {
    const all = this.dialogues();
    const joined = { title: all[at - 1].title || all[at].title, lines: [...all[at - 1].lines, ...all[at].lines] };
    this.dialoguesChange.emit([...all.slice(0, at - 1), joined, ...all.slice(at + 1)]);
  }

  private change(at: number, how: (dialogue: Dialogue) => Dialogue): void {
    this.dialoguesChange.emit(this.dialogues().map((dialogue, index) => (index === at ? how(dialogue) : dialogue)));
  }
}
