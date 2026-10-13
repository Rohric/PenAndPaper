import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { readError } from '../../core/api-error';
import { AnyCharacter } from '../../core/models';
import { basePointsLeft, bonusPointsLeft } from '../../core/rules';
import { EntryTextsEditor } from '../../shared/entry-texts-editor';
import { Icon } from '../../shared/icon';
import { SymbolPicker } from '../../shared/symbol-picker';
import { CharacterService, CharacterSource } from './character.service';
import { InventoryEditor } from './inventory-editor';
import { PhraseListEditor } from './phrase-list-editor';
import { SkillEditor } from './skill-editor';
import { SpecialAbilityListEditor } from './special-ability-list-editor';

type NumberField = 'life_points' | 'max_life_points' | 'skill_points_total' | 'bonus_points_total';

/**
 * Edit one character. Changes stay in a draft until the user saves.
 * An NPC is written by the game master. A player character is written by its player,
 * who sees the budgets and the life points but cannot change them.
 */
@Component({
  selector: 'app-character-editor',
  imports: [
    FormsModule, Icon, SymbolPicker, SkillEditor, InventoryEditor, PhraseListEditor, SpecialAbilityListEditor, EntryTextsEditor,
  ],
  templateUrl: './character-editor.html',
})
export class CharacterEditor {
  private readonly service = inject(CharacterService);

  readonly character = input.required<AnyCharacter>();
  readonly kind = input.required<'npc' | 'player'>();
  readonly saved = output<AnyCharacter>();
  readonly deleted = output<void>();

  protected readonly isNpc = computed(() => this.kind() === 'npc');
  private readonly source = computed<CharacterSource>(() => (this.isNpc() ? 'npcs' : 'player-characters'));

  /** Working copy; it starts over whenever another character is opened or the saved one comes back. */
  protected readonly draft = linkedSignal(() => structuredClone(this.character()));
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly dirty = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(this.character()));
  protected readonly baseLeft = computed(() => basePointsLeft(this.draft().skills, this.draft().skill_points_total));
  protected readonly bonusLeft = computed(() => bonusPointsLeft(this.draft().skills, this.draft().bonus_points_total));

  /** Change one field of the draft. */
  protected set<K extends keyof AnyCharacter>(key: K, value: AnyCharacter[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  /** Change a number field; empty or negative input counts as 0. */
  protected setNumber(key: NumberField, value: number | null): void {
    this.set(key, Math.max(0, Math.floor(value ?? 0)));
  }

  /** Send the draft to the server. Entries without a name are left out. */
  protected save(): void {
    this.busy.set(true);
    this.service.update<AnyCharacter>(this.source(), this.character().id, this.cleaned()).subscribe({
      next: (character) => this.done(character),
      error: (e: unknown) => this.fail(e),
    });
  }

  /** Delete the character after the user confirmed. */
  protected remove(): void {
    if (!confirm(`„${this.character().name}“ wirklich löschen?`)) {
      return;
    }
    this.service.remove(this.source(), this.character().id).subscribe({
      next: () => this.deleted.emit(),
      error: (e: unknown) => this.fail(e),
    });
  }

  private cleaned(): AnyCharacter {
    const draft = this.draft();
    return {
      ...draft,
      skills: draft.skills.filter((skill) => skill.name.trim()),
      inventory: draft.inventory.filter((item) => item.name.trim()),
      special_abilities: draft.special_abilities.filter((ability) => ability.name.trim()),
    };
  }

  private done(character: AnyCharacter): void {
    this.busy.set(false);
    this.error.set('');
    this.saved.emit(character);
  }

  private fail(error: unknown): void {
    this.busy.set(false);
    this.error.set(readError(error));
  }
}
