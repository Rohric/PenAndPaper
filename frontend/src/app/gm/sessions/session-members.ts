import { Component, computed, inject } from '@angular/core';

import { Icon } from '../../components/basic/icon';
import { SessionStore } from '../../core/session-store';

/**
 * Edit the group of a running session at the side: take free characters in, take members out.
 * A character plays in one adventure only, so characters of other adventures are not offered.
 */
@Component({
  selector: 'app-session-members',
  imports: [Icon],
  template: `
    <section class="stack">
      <h3 class="section-title kind--npcs"><app-icon name="group" /> In der Gruppe · {{ store.characters().length }}</h3>
      @for (member of store.characters(); track member.id) {
        <div class="row row--between">
          <span><strong>{{ member.name }}</strong> <span class="soft">({{ member.player }})</span></span>
          <button type="button" class="btn btn--small btn--danger" (click)="take(member.id, member.name)">
            <app-icon name="close" [size]="16" /> Herausnehmen
          </button>
        </div>
      } @empty {
        <p class="soft">Noch niemand in der Gruppe.</p>
      }
    </section>

    <section class="stack">
      <h3 class="section-title"><app-icon name="plus" /> Freie Charaktere · {{ free().length }}</h3>
      @for (character of free(); track character.id) {
        <div class="row row--between">
          <span><strong>{{ character.name }}</strong> <span class="soft">({{ character.player }})</span></span>
          <button type="button" class="btn btn--small btn--primary" (click)="add(character.id)">
            <app-icon name="plus" [size]="16" /> Aufnehmen
          </button>
        </div>
      } @empty {
        <p class="soft">Kein freier Charakter. Alle anderen spielen schon in einem laufenden Abenteuer.</p>
      }
    </section>
  `,
  styleUrl: './session-members.scss',
})
export class SessionMembers {
  protected readonly store = inject(SessionStore);

  /** The characters no adventure has taken yet. */
  protected readonly free = computed(() => this.store.everyone().filter((character) => !character.adventure));

  /** Take a free character into the group. */
  protected add(id: number): void {
    this.store.save({ characters: [...this.store.characters().map((member) => member.id), id] });
  }

  /** Take a member out after the game master confirmed; the character is free again. */
  protected take(id: number, name: string): void {
    if (confirm(`„${name}“ aus der Gruppe nehmen? Der Charakter ist danach wieder frei.`)) {
      this.store.save({ characters: this.store.characters().map((member) => member.id).filter((other) => other !== id) });
    }
  }
}
