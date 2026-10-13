import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { AnyCharacter, Npc, WorldNpc } from '../../core/models';
import { IdSelect } from '../../shared/id-select';
import { CharacterEditor } from '../characters/character-editor';
import { CharacterService } from '../characters/character.service';
import { WorldStore } from './world-store';

/** Edit an NPC of the world: where it can be met, and the character itself. */
@Component({
  selector: 'app-world-npc-editor',
  imports: [CharacterEditor, IdSelect],
  template: `
    <div class="stack">
      <div class="panel">
        <h2 class="subtitle">In dieser Welt</h2>
        <div class="field">
          <label for="npc-location">Anzutreffen in</label>
          <app-id-select
            inputId="npc-location"
            emptyLabel="Kein fester Ort"
            [options]="store.locationOptions()"
            [value]="link().location"
            (valueChange)="setLocation($event)"
          />
        </div>
        @if (error()) {
          <p class="notice notice--error" role="alert">{{ error() }}</p>
        }
      </div>

      @if (npc(); as loaded) {
        <app-character-editor kind="npc" [character]="loaded" (saved)="onSaved($event)" (deleted)="onDeleted()" />
      }
    </div>
  `,
})
export class WorldNpcEditor {
  protected readonly store = inject(WorldStore);
  private readonly characters = inject(CharacterService);

  readonly link = input.required<WorldNpc>();
  /** Fired after the character was saved. */
  readonly saved = output<void>();
  /** Fired after the NPC was deleted. */
  readonly closed = output<void>();

  protected readonly npc = signal<Npc | null>(null);
  protected readonly error = signal('');
  private readonly npcId = computed(() => this.link().npc);

  constructor() {
    // Load the character whenever another NPC is opened.
    effect(() => {
      this.npc.set(null);
      this.characters.get<Npc>('npcs', this.npcId()).subscribe({ next: (npc) => this.npc.set(npc), error: (e: unknown) => this.error.set(readError(e)) });
    });
  }

  /** Save the place where the NPC can be met right away. */
  protected setLocation(location: number | null): void {
    this.store.save('world-npcs', this.link().id, { location }).subscribe({ error: (e: unknown) => this.error.set(readError(e)) });
  }

  /** Keep the list of the world in step with the saved character. */
  protected onSaved(saved: AnyCharacter): void {
    const npc = saved as Npc;
    this.npc.set(npc);
    this.store.patchLocal('world-npcs', this.link().id, { name: npc.name, profession: npc.profession });
    this.saved.emit();
  }

  /** The character is gone; reload the world, because quests and scenes may have named it. */
  protected onDeleted(): void {
    this.store.load(this.store.worldId());
    this.closed.emit();
  }
}
