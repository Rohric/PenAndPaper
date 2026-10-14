import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { AnyCharacter, Npc, WorldNpc } from '../../core/models';
import { ChapterField } from '../../components/form/chapter-field';
import { LinkPicker } from '../../components/form/link-picker';
import { CharacterEditor } from '../../components/character/character-editor';
import { CharacterService } from '../../core/character.service';
import { EntryItems } from './entry-items';
import { WorldStore } from '../../core/world-store';

/** Edit an NPC of the world: where it can be met, and the character itself. */
@Component({
  selector: 'app-world-npc-editor',
  imports: [CharacterEditor, ChapterField, LinkPicker, EntryItems],
  template: `
    <div class="stack">
      <div class="panel">
        <h2 class="subtitle">In dieser Welt</h2>
        <div class="field">
          <label for="npc-location">Anzutreffen in</label>
          <app-link-picker
            single
            inputId="npc-location"
            label="Ort, an dem die Figur anzutreffen ist"
            emptyText="Kein fester Ort"
            [options]="store.locationOptions()"
            [value]="link().location"
            [creatable]="true"
            (valueChange)="setLocation($event)"
            (create)="createLocation($event)"
          />
        </div>
        <app-chapter-field inputId="npc-chapters" [selected]="link().chapters" (selectedChange)="setChapters($event)" />
        <div class="field">
          <span class="label">Gegenstände der Welt bei dieser Figur</span>
          <app-entry-items kind="npcs" [entryId]="link().npc" />
        </div>
        <p class="soft">Ort, Kapitel und Gegenstände werden sofort gespeichert. Was die Figur bei sich trägt, steht unten im Inventar.</p>
        @if (error()) {
          <p class="notice notice--error" role="alert">{{ error() }}</p>
        }
      </div>

      @if (npc(); as loaded) {
        <app-character-editor kind="npc" [character]="loaded" [secondBar]="store.world()?.second_bar_name ?? ''" (saved)="onSaved($event)" (deleted)="onDeleted()" />
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

  /** Save the chapters the NPC is tagged with right away. */
  protected setChapters(chapters: number[]): void {
    this.store.save('world-npcs', this.link().id, { chapters }).subscribe({ error: (e: unknown) => this.error.set(readError(e)) });
  }

  /** Create a place with the typed name and put the NPC there. */
  protected createLocation(name: string): void {
    this.store.add<{ id: number }>('locations', { name }).subscribe({
      next: (place) => this.setLocation(place.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Keep the list of the world in step with the saved character. */
  protected onSaved(saved: AnyCharacter): void {
    const npc = saved as Npc;
    this.npc.set(npc);
    this.store.patchLocal('world-npcs', this.link().id, {
      name: npc.name, profession: npc.profession, inventory: npc.inventory, symbol: npc.symbol, updated_at: npc.updated_at,
    });
    this.saved.emit();
  }

  /** The character is gone; reload the world, because quests and scenes may have named it. */
  protected onDeleted(): void {
    this.store.load(this.store.worldId());
    this.closed.emit();
  }
}
