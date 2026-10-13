import { Component, inject, output } from '@angular/core';

import { CharacterPanel, CharacterTile } from './character-tile';
import { SessionStore } from './session-store';

/** The group of a session as a row of tiles, one per character. */
@Component({
  selector: 'app-session-group',
  imports: [CharacterTile],
  template: `
    <div class="tiles">
      @for (member of store.characters(); track member.id) {
        <app-character-tile
          [character]="member"
          [unread]="store.unread(member.id)"
          (life)="store.setLife(member.id, $event)"
          (open)="open.emit({ kind: $event, characterId: member.id })"
        />
      } @empty {
        <p class="soft">Noch kein Charakter in der Runde.</p>
      }
    </div>
  `,
})
export class SessionGroup {
  protected readonly store = inject(SessionStore);

  /** Asks the cockpit to open the sheet, the messages or the item form of a character. */
  readonly open = output<{ kind: CharacterPanel; characterId: number }>();
}
