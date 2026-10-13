import { Component, computed, input, output } from '@angular/core';

import { Message } from '../../core/session-models';
import { Bubble, ChatThread } from './chat-thread';

/** The secret thread between the game master and one character: read the messages and write one. */
@Component({
  selector: 'app-session-thread',
  imports: [ChatThread],
  template: `<app-chat-thread [bubbles]="bubbles()" placeholder="Geheime Nachricht schreiben" (send)="send.emit($event)" />`,
})
export class SessionThread {
  /** The messages of one character's thread, oldest first. */
  readonly messages = input.required<Message[]>();
  readonly characterName = input('');
  /** Whether the reader is the game master; his messages stand on the right. */
  readonly asGameMaster = input(false);
  readonly send = output<string>();

  protected readonly bubbles = computed<Bubble[]>(() =>
    this.messages().map((message) => ({
      id: message.id,
      name: message.from_gm ? 'Spielleiter' : this.characterName(),
      text: message.text,
      at: message.created_at,
      mine: message.from_gm === this.asGameMaster(),
      gm: message.from_gm,
    })),
  );
}
