import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { readError } from '../../core/api-error';
import { Npc } from '../../core/models';
import { basePointsLeft, bonusPointsLeft } from '../../core/rules';
import { InventoryEditor } from './inventory-editor';
import { NpcService } from './npc.service';
import { PhraseListEditor } from './phrase-list-editor';
import { SkillEditor } from './skill-editor';

type NumberField = 'life_points' | 'skill_points_total' | 'bonus_points_total';

/** Edit one NPC. Changes stay in a draft until the user saves. */
@Component({
  selector: 'app-npc-editor',
  imports: [FormsModule, SkillEditor, InventoryEditor, PhraseListEditor],
  templateUrl: './npc-editor.html',
})
export class NpcEditor {
  private readonly service = inject(NpcService);

  readonly npc = input.required<Npc>();
  readonly saved = output<Npc>();
  readonly deleted = output<void>();

  /** Working copy; it starts over whenever another NPC is opened or the saved one comes back. */
  protected readonly draft = linkedSignal(() => structuredClone(this.npc()));
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly dirty = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(this.npc()));
  protected readonly baseLeft = computed(() => basePointsLeft(this.draft().skills, this.draft().skill_points_total));
  protected readonly bonusLeft = computed(() => bonusPointsLeft(this.draft().skills, this.draft().bonus_points_total));

  /** Change one field of the draft. */
  protected set<K extends keyof Npc>(key: K, value: Npc[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  /** Change a number field; empty or negative input counts as 0. */
  protected setNumber(key: NumberField, value: number | null): void {
    this.set(key, Math.max(0, Math.floor(value ?? 0)));
  }

  /** Send the draft to the server. Entries without a name are left out. */
  protected save(): void {
    this.busy.set(true);
    this.service.update(this.npc().id, this.cleaned()).subscribe({
      next: (npc) => this.done(npc),
      error: (e: unknown) => this.fail(e),
    });
  }

  /** Delete the NPC after the user confirmed. */
  protected remove(): void {
    if (!confirm(`„${this.npc().name}“ wirklich löschen?`)) {
      return;
    }
    this.service.remove(this.npc().id).subscribe({ next: () => this.deleted.emit(), error: (e: unknown) => this.fail(e) });
  }

  private cleaned(): Npc {
    const draft = this.draft();
    return {
      ...draft,
      skills: draft.skills.filter((skill) => skill.name.trim()),
      inventory: draft.inventory.filter((item) => item.name.trim()),
      phrases: draft.phrases.filter((phrase) => phrase.text.trim()),
    };
  }

  private done(npc: Npc): void {
    this.busy.set(false);
    this.error.set('');
    this.saved.emit(npc);
  }

  private fail(error: unknown): void {
    this.busy.set(false);
    this.error.set(readError(error));
  }
}
