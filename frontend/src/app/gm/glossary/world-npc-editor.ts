import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { readError } from '../../core/api-error';
import { AnyCharacter, Npc, WorldNpc } from '../../core/models';
import { CategoryField } from '../../components/form/category-field';
import { ChapterField } from '../../components/form/chapter-field';
import { LinkPicker } from '../../components/form/link-picker';
import { NoteField } from '../../components/form/note-field';
import { CharacterEditor } from '../../components/character/character-editor';
import { CharacterService } from '../../core/character.service';
import { ToastService } from '../../global/toast/toast.service';
import { EntryItems } from './entry-items';
import { WorldStore } from '../../core/world-store';

/**
 * Edit an NPC of the world: what it is in this world (category, chapters, where it can be met, the items of the
 * world it has, the note of the game master), saved right away, and below the character itself with its own button.
 */
@Component({
  selector: 'app-world-npc-editor',
  imports: [CharacterEditor, CategoryField, ChapterField, LinkPicker, NoteField, EntryItems],
  template: `
    <div class="stack">
      <div class="panel">
        <h2 class="subtitle">{{ link().session ? 'In dieser Runde' : 'In dieser Welt' }}</h2>
        <p class="soft">Das wird sofort gespeichert, Kategorie und Notiz beim Verlassen des Feldes. Was die Figur bei sich trägt, steht unten im Inventar.</p>
        <app-category-field inputId="npc-category" kind="world-npcs" [value]="link().category" (commit)="saveCharacter({ category: $event })" />
        @if (!link().session) {
          <app-chapter-field inputId="npc-chapters" [selected]="link().chapters" (selectedChange)="setChapters($event)" (look)="store.look({ kind: 'chapters', id: $event })" />
        }
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
            (look)="store.look({ kind: 'locations', id: $event })"
          />
        </div>
        <div class="field">
          <span class="label">Gegenstände der Welt bei dieser Figur</span>
          <app-entry-items kind="npcs" [entryId]="link().npc" />
        </div>
        <app-note-field inputId="npc-note" [value]="link().note" (commit)="saveCharacter({ note: $event })" />
      </div>

      @if (sheet(); as loaded) {
        <app-character-editor
          kind="npc"
          [character]="loaded"
          [secondBar]="store.world()?.second_bar_name ?? ''"
          [startChoice]="!link().session"
          (saved)="onSaved($event)"
          (deleted)="onDeleted()"
        />
      }
    </div>
  `,
})
export class WorldNpcEditor {
  protected readonly store = inject(WorldStore);
  private readonly characters = inject(CharacterService);
  private readonly toast = inject(ToastService);

  readonly link = input.required<WorldNpc>();
  /** Fired after the character was saved. */
  readonly saved = output<void>();
  /** Fired after the NPC was deleted. */
  readonly closed = output<void>();

  private readonly npc = signal<Npc | null>(null);
  /**
   * The character for its editor, without category and note: they are saved above, right away, and the editor
   * sends everything it holds, so it would bring back what was there when it opened.
   */
  protected readonly sheet = computed<AnyCharacter | null>(() => {
    const npc = this.npc();
    if (!npc) {
      return null;
    }
    const { category: _category, note: _note, ...character } = npc;
    return character;
  });
  private readonly npcId = computed(() => this.link().npc);

  constructor() {
    // Load the character whenever another NPC is opened.
    effect(() => {
      this.npc.set(null);
      this.characters.get<Npc>('npcs', this.npcId()).subscribe({ next: (npc) => this.npc.set(npc), error: (e: unknown) => this.fail(e) });
    });
  }

  /** Save the place where the NPC can be met right away. */
  protected setLocation(location: number | null): void {
    this.store.save('world-npcs', this.link().id, { location }).subscribe({ error: (e: unknown) => this.fail(e) });
  }

  /** Save the chapters the NPC is tagged with right away. */
  protected setChapters(chapters: number[]): void {
    this.store.save('world-npcs', this.link().id, { chapters }).subscribe({ error: (e: unknown) => this.fail(e) });
  }

  /** Save the category or the note at the character itself, and keep the list of the world in step. */
  protected saveCharacter(changes: Partial<Pick<Npc, 'category' | 'note'>>): void {
    this.characters.update<Npc>('npcs', this.link().npc, changes).subscribe({
      next: (npc) => this.store.patchLocal('world-npcs', this.link().id, { category: npc.category, note: npc.note, updated_at: npc.updated_at }),
      error: (e: unknown) => this.fail(e),
    });
  }

  /** Create a place with the typed name and put the NPC there. */
  protected createLocation(name: string): void {
    this.store.add<{ id: number }>('locations', { name }).subscribe({
      next: (place) => this.setLocation(place.id),
      error: (e: unknown) => this.fail(e),
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

  private fail(error: unknown): void {
    this.toast.show(readError(error), 'danger');
  }
}
