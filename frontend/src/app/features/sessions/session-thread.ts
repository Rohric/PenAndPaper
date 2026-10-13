import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Message } from '../../core/session-models';

/** The secret thread between the game master and one character: read the messages and write one. */
@Component({
  selector: 'app-session-thread',
  imports: [FormsModule],
  template: `
    @for (message of messages(); track message.id) {
      <div class="knowledge" [class.knowledge--gm]="message.from_gm !== asGameMaster()">
        <span class="kicker">{{ message.from_gm ? 'Spielleiter' : characterName() }}</span>
        <p class="prose">{{ message.text }}</p>
      </div>
    } @empty {
      <p class="soft">Noch keine Nachricht.</p>
    }
    <form class="list-row" (ngSubmit)="submit()">
      <input class="input" name="text" aria-label="Nachricht" placeholder="Geheime Nachricht schreiben" [(ngModel)]="text" />
      <button type="submit" class="btn btn--small btn--primary" [disabled]="!text().trim()">Senden</button>
    </form>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `,
})
export class SessionThread {
  /** The messages of one character's thread, oldest first. */
  readonly messages = input.required<Message[]>();
  readonly characterName = input('');
  /** Whether the reader is the game master; the messages of the other side are set apart. */
  readonly asGameMaster = input(false);
  readonly send = output<string>();

  protected readonly text = signal('');

  /** Send the typed message. */
  protected submit(): void {
    this.send.emit(this.text().trim());
    this.text.set('');
  }
}
