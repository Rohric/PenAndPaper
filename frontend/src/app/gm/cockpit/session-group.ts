import { Component, inject, output } from '@angular/core';

import { CharacterPanel, CharacterTile } from '../../components/character/character-tile';
import { SessionStore } from '../../core/session-store';
import { WorldStore } from '../../core/world-store';

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
          [secondBar]="world.world()?.second_bar_name ?? ''"
          (life)="store.setPoints(member.id, { life_points: $event })"
          (second)="store.setPoints(member.id, { second_bar_points: $event })"
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
  protected readonly world = inject(WorldStore);

  /** Asks the cockpit to open the sheet, the messages or the item form of a character. */
  readonly open = output<{ kind: CharacterPanel; characterId: number }>();
}
