import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { Npc, Option, WorldNpc } from '../../core/models';
import { IdSelect } from '../../shared/id-select';
import { NpcEditor } from '../npcs/npc-editor';
import { NpcService } from '../npcs/npc.service';
import { EntryLinks } from './entry-links';
import { WorldStore } from './world-store';

/** Edit an NPC of the world: where it can be met, and the character itself. */
@Component({
  selector: 'app-world-npc-editor',
  imports: [NpcEditor, IdSelect, EntryLinks],
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
        <app-entry-links label="Quests mit dieser Figur" section="quests" [items]="quests()" />
        @if (error()) {
          <p class="notice notice--error" role="alert">{{ error() }}</p>
        }
      </div>

      @if (npc(); as loaded) {
        <app-npc-editor [npc]="loaded" (saved)="onSaved($event)" (deleted)="onDeleted()" />
      }
    </div>
  `,
})
export class WorldNpcEditor {
  protected readonly store = inject(WorldStore);
  private readonly npcService = inject(NpcService);

  readonly link = input.required<WorldNpc>();
  /** Fired after the NPC was deleted. */
  readonly closed = output<void>();

  protected readonly npc = signal<Npc | null>(null);
  protected readonly error = signal('');
  private readonly npcId = computed(() => this.link().npc);
  protected readonly quests = computed<Option[]>(() =>
    this.store
      .quests()
      .filter((quest) => quest.giver === this.npcId() || quest.npcs.includes(this.npcId()))
      .map((quest) => ({ id: quest.id, label: quest.name })),
  );

  constructor() {
    // Load the character whenever another NPC is opened.
    effect(() => {
      this.npc.set(null);
      this.npcService.get(this.npcId()).subscribe({ next: (npc) => this.npc.set(npc), error: (e: unknown) => this.error.set(readError(e)) });
    });
  }

  /** Save the place where the NPC can be met right away. */
  protected setLocation(location: number | null): void {
    this.store.save('world-npcs', this.link().id, { location }).subscribe({ error: (e: unknown) => this.error.set(readError(e)) });
  }

  /** Keep the list of the world in step with the saved character. */
  protected onSaved(npc: Npc): void {
    this.npc.set(npc);
    this.store.patchLocal('world-npcs', this.link().id, { name: npc.name, profession: npc.profession });
  }

  /** The character is gone; reload the world, because quests and scenes may have named it. */
  protected onDeleted(): void {
    this.store.load(this.store.worldId());
    this.closed.emit();
  }
}
