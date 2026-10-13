import { Component, computed, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChatMessage } from '../../core/session-models';

/** One speech bubble. */
export interface Bubble {
  id: number;
  name: string;
  text: string;
  at: string;
  /** Whether the reader wrote it; his bubbles stand on the right. */
  mine: boolean;
  /** Whether the game master wrote it. */
  gm: boolean;
}

/** Turn the messages of the group chat into bubbles. */
export function groupBubbles(messages: ChatMessage[]): Bubble[] {
  return messages.map((m) => ({ id: m.id, name: m.author_name, text: m.text, at: m.created_at, mine: m.mine, gm: m.from_gm }));
}

/**
 * A conversation as speech bubbles: the own ones on the right, the others on the left with their name,
 * the time under each, a line between two days, and the field to write at the bottom.
 * The list jumps to the newest message.
 */
@Component({
  selector: 'app-chat-thread',
  imports: [FormsModule],
  template: `
    <div #list class="list" role="log" aria-live="polite">
      @for (row of rows(); track row.bubble.id) {
        @if (row.day) {
          <span class="day">{{ row.day }}</span>
        }
        <div class="bubble" [class.bubble--mine]="row.bubble.mine" [class.bubble--gm]="row.bubble.gm">
          @if (!row.bubble.mine) {
            <span class="bubble__name">{{ row.bubble.name }}</span>
          }
          <p class="bubble__text">{{ row.bubble.text }}</p>
          <span class="bubble__time">{{ row.time }}</span>
        </div>
      } @empty {
        <p class="soft">{{ emptyText() }}</p>
      }
    </div>
    <form class="write" (ngSubmit)="submit()">
      <input class="input" name="text" autocomplete="off" [attr.aria-label]="placeholder()" [placeholder]="placeholder()" [ngModel]="text()" (ngModelChange)="text.set($event)" />
      <button type="submit" class="btn btn--primary write__send" [disabled]="!text().trim()">Senden</button>
    </form>
  `,
  styleUrl: './chat-thread.scss',
})
export class ChatThread {
  readonly bubbles = input.required<Bubble[]>();
  readonly placeholder = input('Nachricht schreiben');
  readonly emptyText = input('Noch keine Nachricht.');
  readonly send = output<string>();

  protected readonly text = signal('');
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  /** The bubbles with the day above the first bubble of every day and the time of each. */
  protected readonly rows = computed(() => {
    let last = '';
    return this.bubbles().map((bubble) => {
      const date = new Date(bubble.at);
      const day = date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' });
      const row = { bubble, day: day === last ? '' : day, time: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) };
      last = day;
      return row;
    });
  });

  constructor() {
    // Jump to the newest message whenever there is one more.
    effect(() => {
      this.bubbles();
      setTimeout(() => this.jumpToEnd());
    });
  }

  /** Send the typed message. */
  protected submit(): void {
    if (this.text().trim()) {
      this.send.emit(this.text().trim());
      this.text.set('');
    }
  }

  private jumpToEnd(): void {
    const element = this.list().nativeElement;
    element.scrollTop = element.scrollHeight;
  }
}
