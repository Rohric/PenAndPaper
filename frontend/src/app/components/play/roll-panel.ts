import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { AnyCharacter, Npc, Option, PlayerCharacter, TALENTS } from '../../core/models';
import { skillValue, talentValue } from '../../core/rules';
import { Roll, RollOrder } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { LinkPicker } from '../../shared/link-picker';
import { CharacterService } from '../characters/character.service';
import { DiceRoll } from './dice-roll';
import { SessionRolls } from './session-rolls';

const MAX_DICE = 10;

/** A value somebody can roll against: a talent or a skill of the sheet. */
interface Value {
  label: string;
  value: number;
  talent: string;
}

/**
 * Roll in a session. A player rolls on the values of the own character, or free dice without a
 * value. The game master picks any character of the group or any NPC of the world and rolls on
 * one of its values, secretly if wanted, or rolls free dice. The server rolls all dice.
 */
@Component({
  selector: 'app-roll-panel',
  imports: [Icon, LinkPicker, DiceRoll, SessionRolls],
  template: `
    @if (gameMaster()) {
      <div class="field">
        <label for="roll-who">Für wen würfelst du?</label>
        <app-link-picker
          single
          inputId="roll-who"
          label="Charakter oder Figur, für die gewürfelt wird"
          emptyText="Charakter oder Figur suchen, oder leer lassen …"
          [options]="options()"
          [value]="picked()"
          (valueChange)="picked.set($event)"
        />
      </div>
      <label class="check">
        <input type="checkbox" [checked]="secret()" (change)="secret.set($any($event.target).checked)" />
        Heimlich würfeln: die Spieler sehen diesen Wurf nicht
      </label>
    }

    @if (last(); as shown) {
      <app-dice-roll
        [label]="shown.who + ' · ' + shown.label"
        [check]="shown.result ? { value: shown.value ?? 0, rolled: shown.rolled ?? 0, result: shown.result } : null"
        [dice]="shown.dice ?? null"
        [total]="shown.total ?? null"
      />
    }

    <div class="field">
      <span class="label">Frei würfeln, ohne Wert</span>
      <div class="row">
        <button type="button" class="btn" (click)="free(100, 1)"><app-icon name="dice" /> W100</button>
        <button type="button" class="btn" (click)="free(10, count())"><app-icon name="dice" /> {{ count() }} W10</button>
        <label class="row">
          <span class="soft">Anzahl W10</span>
          <input
            class="input input--number"
            type="number"
            min="1"
            max="10"
            aria-label="Anzahl der W10"
            [value]="count()"
            (change)="setCount(+$any($event.target).value)"
          />
        </label>
      </div>
    </div>

    @if (sheet(); as figure) {
      <div class="field">
        <span class="label">Auf einen Wert von {{ figure.name }}</span>
        <div class="row">
          @for (value of values(); track value.label) {
            <button type="button" class="btn btn--small" (click)="check(figure, value)">{{ value.label }} · {{ value.value }}</button>
          }
        </div>
      </div>
    } @else if (gameMaster()) {
      <p class="soft">Wähle oben einen Charakter oder eine Figur, um auf einen ihrer Werte zu würfeln.</p>
    } @else {
      <p class="soft">Keiner deiner Charaktere spielt in dieser Runde. Frei würfeln kannst du trotzdem.</p>
    }

    <div class="field">
      <span class="label">Letzte Würfe der Runde</span>
      <app-session-rolls [rolls]="rolls()" />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
  `,
})
export class RollPanel {
  private readonly characterApi = inject(CharacterService);

  /** Whether the game master rolls here; a player rolls only for the own character. */
  readonly gameMaster = input(false);
  /** The characters to roll for: the whole group for the game master, the own one for a player. */
  readonly characters = input<PlayerCharacter[]>([]);
  /** The NPCs the game master can roll for, by the id of the character. */
  readonly npcs = input<Option[]>([]);
  /** The roll that was made last here. */
  readonly last = input<Roll | null>(null);
  readonly rolls = input<Roll[]>([]);
  /** Asks the page to roll. */
  readonly roll = output<RollOrder>();

  /** Who the game master rolls for: a player character by its negative id, an NPC by its id. */
  protected readonly picked = signal<number | null>(null);
  protected readonly secret = signal(true);
  protected readonly count = signal(1);
  private readonly npc = signal<Npc | null>(null);

  protected readonly options = computed<Option[]>(() => [
    ...this.characters().map((character) => ({
      id: -character.id, label: character.name, hint: `Spielercharakter von ${character.player}`, tone: 'npcs',
    })),
    ...this.npcs().map((npc) => ({ ...npc, hint: npc.hint || 'Figur der Welt' })),
  ]);
  /** The sheet of whoever is rolled for. */
  protected readonly sheet = computed<AnyCharacter | null>(() => {
    const picked = this.gameMaster() ? this.picked() : -(this.characters()[0]?.id ?? 0);
    if (!picked) {
      return null;
    }
    return picked < 0 ? (this.characters().find((character) => character.id === -picked) ?? null) : this.npc();
  });
  protected readonly values = computed<Value[]>(() => {
    const skills = this.sheet()?.skills ?? [];
    const talents = TALENTS.map((talent) => ({ label: talent.label, value: talentValue(skills, talent.id), talent: talent.id }));
    return [...talents, ...skills.map((skill) => ({ label: skill.name, value: skillValue(skill, skills), talent: skill.talent }))];
  });

  constructor() {
    // Load the sheet whenever the game master picks another NPC.
    effect(() => this.loadNpc(this.picked()));
  }

  /** Roll a check on a value of the picked sheet. */
  protected check(figure: AnyCharacter, value: Value): void {
    this.order({ who: figure.name, label: value.label, value: value.value, sides: 100, count: 1, talent: value.talent });
  }

  /** Roll free dice: one W100, or some W10. */
  protected free(sides: 10 | 100, count: number): void {
    this.order({ who: this.sheet()?.name ?? '', label: '', value: null, sides, count });
  }

  /** How many W10 are rolled at once: 1 to 10. */
  protected setCount(count: number): void {
    this.count.set(Math.min(MAX_DICE, Math.max(1, Math.floor(count) || 1)));
  }

  /** A player always rolls openly and for the own character. */
  private order(roll: Pick<RollOrder, 'who' | 'label' | 'value' | 'sides' | 'count' | 'talent'>): void {
    const own = this.gameMaster() ? null : (this.characters()[0]?.id ?? null);
    this.roll.emit({ ...roll, character: own, secret: this.gameMaster() && this.secret() });
  }

  private loadNpc(picked: number | null): void {
    this.npc.set(null);
    if (picked !== null && picked > 0) {
      this.characterApi.get<Npc>('npcs', picked).subscribe({ next: (npc) => this.npc.set(npc), error: () => undefined });
    }
  }
}
