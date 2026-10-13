import { Component, computed, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { readError } from '../../core/api-error';
import { AnyCharacter } from '../../core/models';
import { creditLeft, skillHints, skillProblems } from '../../core/house-rules';
import { EntryTextsEditor } from '../../shared/entry-texts-editor';
import { Icon } from '../../shared/icon';
import { SymbolPicker } from '../../shared/symbol-picker';
import { TutorialButton } from '../../shared/tutorial-button';
import { CharacterService, CharacterSource } from './character.service';
import { InventoryEditor } from './inventory-editor';
import { PhraseListEditor } from './phrase-list-editor';
import { PointsOverview } from './points-overview';
import { SkillEditor } from './skill-editor';
import { SpecialAbilityListEditor } from './special-ability-list-editor';

type NumberField = 'life_points' | 'max_life_points' | 'skill_points_total' | 'bonus_points_total';

/** The parts of the editor; the phrases belong to NPCs only. */
export type EditorSection = 'profile' | 'skills' | 'inventory' | 'abilities' | 'phrases';

const SECTIONS: { id: EditorSection; label: string; npcOnly?: boolean }[] = [
  { id: 'profile', label: 'Steckbrief' },
  { id: 'skills', label: 'Skillung' },
  { id: 'inventory', label: 'Inventar' },
  { id: 'abilities', label: 'Besonderes' },
  { id: 'phrases', label: 'Sätze', npcOnly: true },
];

/**
 * Edit one character. Changes stay in a draft until the user saves with the button in the bar on top.
 * An NPC is written by the game master. A player character is written by its player, who sees the
 * budgets and the life points but cannot change them; the rules of the skills are checked while typing.
 */
@Component({
  selector: 'app-character-editor',
  imports: [
    FormsModule, Icon, SymbolPicker, SkillEditor, InventoryEditor, PhraseListEditor, PointsOverview, SpecialAbilityListEditor,
    EntryTextsEditor, TutorialButton,
  ],
  templateUrl: './character-editor.html',
  styleUrl: './character-editor.scss',
})
export class CharacterEditor {
  private readonly service = inject(CharacterService);

  readonly character = input.required<AnyCharacter>();
  readonly kind = input.required<'npc' | 'player'>();
  /** The section the editor opens at. */
  readonly section = input<EditorSection>('profile');
  readonly saved = output<AnyCharacter>();
  readonly deleted = output<void>();
  /** Fired whenever there are unsaved changes or none. */
  readonly dirtyChange = output<boolean>();

  protected readonly isNpc = computed(() => this.kind() === 'npc');
  protected readonly sections = computed(() => SECTIONS.filter((item) => !item.npcOnly || this.isNpc()));
  protected readonly current = linkedSignal<EditorSection>(() => this.section());
  private readonly source = computed<CharacterSource>(() => (this.isNpc() ? 'npcs' : 'player-characters'));

  /** Working copy; it starts over whenever another character is opened or the saved one comes back. */
  protected readonly draft = linkedSignal(() => structuredClone(this.character()));
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  /** The picture is saved by its own call, so it does not count as an unsaved change. */
  protected readonly dirty = computed(() => JSON.stringify({ ...this.draft(), image: null }) !== JSON.stringify({ ...this.character(), image: null }));
  protected readonly locked = computed(() => !this.isNpc() && !!this.character().adventure);
  protected readonly budgets = computed(() => ({ base: this.draft().skill_points_total, bonus: this.draft().bonus_points_total }));
  /** What the rules say about the skills of a player; skills still without a name are left out. */
  protected readonly shownProblems = computed(() => {
    const draft = this.draft();
    if (this.isNpc()) {
      return [];
    }
    return skillProblems(draft.skills, this.character().skills, this.locked(), this.budgets()).filter(
      (problem) => problem.index === null || !!draft.skills[problem.index].name.trim(),
    );
  });
  /** The free bonus points and the credit of each talent; only a player character has credit. */
  protected readonly credit = computed(() => (this.isNpc() ? undefined : creditLeft(this.draft().skills, this.draft().bonus_points_total)));
  protected readonly hints = computed(() => skillHints(this.draft().skills));
  protected readonly errors = computed(() => this.shownProblems().length + (this.draft().name.trim() ? 0 : 1));
  protected readonly state = computed<'busy' | 'errors' | 'dirty' | 'saved'>(() => {
    if (this.busy()) {
      return 'busy';
    }
    if (this.errors()) {
      return 'errors';
    }
    return this.dirty() ? 'dirty' : 'saved';
  });
  protected readonly saveLabel = computed(() => {
    const labels = { busy: 'Speichert …', errors: `${this.errors()} Fehler`, dirty: 'Speichern', saved: 'Gespeichert' };
    return labels[this.state()];
  });

  constructor() {
    effect(() => this.dirtyChange.emit(this.dirty()));
  }

  /** Change one field of the draft. */
  protected set<K extends keyof AnyCharacter>(key: K, value: AnyCharacter[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  /** Change a number field; empty or negative input counts as 0. */
  protected setNumber(key: NumberField, value: number | null): void {
    this.set(key, Math.max(0, Math.floor(value ?? 0)));
  }

  /** Save, or take the user to the messages when something is wrong. */
  protected onSave(): void {
    if (this.errors()) {
      this.current.set(this.draft().name.trim() ? 'skills' : 'profile');
      return;
    }
    this.save();
  }

  /** Send the draft to the server. Entries without a name are left out. */
  protected save(): void {
    this.busy.set(true);
    this.service.update<AnyCharacter>(this.source(), this.character().id, this.cleaned()).subscribe({
      next: (character) => this.done(character),
      error: (e: unknown) => this.fail(e),
    });
  }

  /** Upload a picture and show it. */
  protected upload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.service.setImage<AnyCharacter>(this.source(), this.character().id, file).subscribe({
        next: (character) => this.showImage(character),
        error: (e: unknown) => this.fail(e),
      });
    }
  }

  /** Remove the picture. */
  protected removeImage(): void {
    this.service.removeImage<AnyCharacter>(this.source(), this.character().id).subscribe({
      next: (character) => this.showImage(character),
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

  private showImage(character: AnyCharacter): void {
    this.error.set('');
    this.draft.update((draft) => ({ ...draft, image: character.image, shows_image: character.shows_image }));
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
