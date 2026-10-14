import { Component, computed, effect, inject, input, signal } from '@angular/core';

import { CharacterService } from '../../core/character.service';
import { EntryRef, Npc } from '../../core/models';
import { CHANGE_FIELDS, ChangeField, SESSION_KINDS, changeOne, changedText } from '../../core/round';
import { sameJson } from '../../core/same';
import { EntryChanges, LinkKey, TextKey } from '../../core/session-models';
import { SessionStore } from '../../core/session-store';
import { WorldStore } from '../../core/world-store';
import { Icon } from '../basic/icon';
import { AutoGrow } from '../form/auto-grow';
import { LinkPicker } from '../form/link-picker';

let forms = 0;

/**
 * "In dieser Runde ändern": the texts a round may have different about an entry of the world, by its kind, and for a
 * quest also its giver, its place and its scene. Every field starts with what counts in the round right now and is
 * saved when it is left; a link is saved when it is chosen. An emptied text takes its change away, "Zurücksetzen"
 * takes all of them away. The world stays as it is.
 */
@Component({
  selector: 'app-round-changes',
  imports: [Icon, AutoGrow, LinkPicker],
  template: `
    @if (kind(); as sessionKind) {
      <div class="panel">
        <h3 class="section-title"><app-icon name="edit" /> In dieser Runde ändern</h3>
        <p class="soft">Gilt nur für diese Runde. Die Welt bleibt, wie sie ist. Ein geleertes Feld bringt den Text der Welt zurück.</p>
        @for (field of fields(); track field.key) {
          <div class="field">
            <label [for]="idOf(field.key)">{{ field.label }}</label>
            @if (field.long) {
              <textarea
                class="input"
                rows="2"
                [id]="idOf(field.key)"
                [appAutoGrow]="now(field.key)"
                [value]="now(field.key)"
                (change)="setText(field, $any($event.target))"
              ></textarea>
            } @else {
              <input class="input" [id]="idOf(field.key)" [value]="now(field.key)" (change)="setText(field, $any($event.target))" />
            }
            @if (isChanged(field.key)) {
              <span class="soft clamp">In der Welt: {{ inWorld(field.key) || 'leer' }}</span>
            }
          </div>
        }
        @if (sessionKind === 'quest') {
          <div class="field">
            <label [for]="idOf('giver')">Questgeber</label>
            <app-link-picker
              single
              [inputId]="idOf('giver')"
              label="Questgeber in dieser Runde"
              emptyText="Kein Questgeber"
              [options]="world.npcOptions()"
              [value]="link('giver')"
              (valueChange)="setLink('giver', $event)"
            />
          </div>
          <div class="field">
            <label [for]="idOf('location')">Startgebiet</label>
            <app-link-picker
              single
              [inputId]="idOf('location')"
              label="Startgebiet in dieser Runde"
              emptyText="Kein Startgebiet"
              [options]="world.locationOptions()"
              [value]="link('location')"
              (valueChange)="setLink('location', $event)"
            />
          </div>
          <div class="field">
            <label [for]="idOf('scene')">Entsteht in Szene</label>
            <app-link-picker
              single
              [inputId]="idOf('scene')"
              label="Szene, in der die Quest in dieser Runde entsteht"
              emptyText="Keine Szene"
              [options]="world.sceneOptions()"
              [value]="link('scene')"
              (valueChange)="setLink('scene', $event)"
            />
          </div>
        }
        <div class="row">
          <button type="button" class="btn btn--small" title="Wieder wie in der Welt" [disabled]="!changed()" (click)="reset()">
            <app-icon name="undo" [size]="16" /> Zurücksetzen
          </button>
        </div>
      </div>
    }
  `,
})
export class RoundChanges {
  protected readonly world = inject(WorldStore);
  private readonly session = inject(SessionStore);
  private readonly characters = inject(CharacterService);

  /** The entry of the world that is changed for this round. */
  readonly entry = input.required<EntryRef>();

  private readonly prefix = `round-change-${forms++}`;
  protected readonly kind = computed(() => SESSION_KINDS[this.entry().kind]);
  protected readonly fields = computed<ChangeField[]>(() => {
    const kind = this.kind();
    return kind ? CHANGE_FIELDS[kind] : [];
  });
  private readonly changes = computed<EntryChanges>(() => {
    const kind = this.kind();
    return (kind && this.session.state(kind, this.entry().id)?.changes) || {};
  });
  protected readonly changed = computed(() => Object.keys(this.changes()).length > 0);
  /** The entry as the world wrote it; a character's description lives in the character itself and is loaded. */
  private readonly written = computed(() => this.world.asWritten(this.entry()) as Record<string, unknown> | null);
  private readonly npc = signal<Npc | null>(null);

  constructor() {
    effect(() => this.loadNpc(this.entry()));
  }

  /** The id of a field, unique on the page. */
  protected idOf(key: string): string {
    return `${this.prefix}-${key}`;
  }

  /** What a text says in the world. */
  protected inWorld(key: TextKey): string {
    if (this.entry().kind === 'npcs' && key === 'description') {
      return this.npc()?.description ?? '';
    }
    const value = this.written()?.[key];
    return typeof value === 'string' ? value : '';
  }

  /** What a text says in this round right now. */
  protected now(key: TextKey): string {
    return changedText(this.changes(), key) ?? this.inWorld(key);
  }

  /** Whether the round has its own text here. */
  protected isChanged(key: TextKey): boolean {
    return changedText(this.changes(), key) !== undefined;
  }

  /** The place, giver or scene a quest has in this round. */
  protected link(key: LinkKey): number | null {
    const changes = this.changes();
    return key in changes ? (changes[key] ?? null) : ((this.written()?.[key] as number | null | undefined) ?? null);
  }

  /** Save a text that was left; an emptied field shows the text of the world again. */
  protected setText(field: ChangeField, target: HTMLInputElement | HTMLTextAreaElement): void {
    const value = target.value.trim();
    if (!this.store(changeOne(this.changes(), field.key, value, this.inWorld(field.key)))) {
      target.value = this.now(field.key);
    }
  }

  /** Save a link of a quest as soon as it is chosen. */
  protected setLink(key: LinkKey, value: number | null): void {
    this.store(changeOne(this.changes(), key, value, this.written()?.[key] ?? null));
  }

  /** Take every change of this entry away. */
  protected reset(): void {
    this.store({});
  }

  /** Send the changes, unless they are what the round has already; tell whether something was sent. */
  private store(next: EntryChanges): boolean {
    const kind = this.kind();
    if (!kind || sameJson(next, this.changes())) {
      return false;
    }
    this.session.setChanges(kind, this.entry().id, next);
    return true;
  }

  private loadNpc(ref: EntryRef): void {
    this.npc.set(null);
    if (ref.kind === 'npcs') {
      this.characters.get<Npc>('npcs', ref.id).subscribe({ next: (npc) => this.npc.set(npc), error: () => undefined });
    }
  }
}
