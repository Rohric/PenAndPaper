import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { readError } from '../../core/api-error';
import { AnyCharacter, Npc, Option } from '../../core/models';
import { damageText, skillValue, talentValue } from '../../core/rules';
import { Battle, Combatant, Status } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { IdSelect } from '../../shared/id-select';
import { CharacterService } from '../characters/character.service';
import { WorldStore } from '../worlds/world-store';
import { BattleExchange } from './battle-exchange';
import { combatantKey, recall, remember } from './battle-memory';
import { BattleTimeline, TimelineEntry } from './battle-timeline';
import { SessionStore } from './session-store';
import { SessionService } from './session.service';

const REFRESH_MS = 3000;
const DEFAULT_VALUE = 50;
const ACTION = 'Handeln';

/** A value a combatant can roll on, taken from its character sheet. */
interface Choice {
  label: string;
  value: number;
}

/** A weapon of a combatant with the dice and the bonus of its damage. */
interface Weapon {
  name: string;
  label: string;
  dice: number;
  bonus: number;
}

/**
 * A fight by the rules of How to be a Hero as the game master runs it: the timeline with the order
 * and the statuses, the attack or another action, the parry of the target and the log. A rolled attack stays open
 * until the game master closes the turn; only then it counts. The server rolls all dice.
 * What a combatant attacked and parried with last time is remembered in the browser.
 */
@Component({
  selector: 'app-battle-view',
  imports: [FormsModule, Icon, IdSelect, BattleExchange, BattleTimeline],
  templateUrl: './battle-view.html',
  styleUrl: './battle-view.scss',
})
export class BattleView {
  private readonly api = inject(SessionService);
  private readonly characterApi = inject(CharacterService);
  private readonly session = inject(SessionStore);
  private readonly world = inject(WorldStore);

  readonly battleId = input.required<number>();
  /** Fired when the game master goes back to the session. */
  readonly closed = output<void>();

  protected readonly battle = signal<Battle | null>(null);
  protected readonly error = signal('');
  /** The sheets of the NPCs that fight, loaded once per NPC. */
  private readonly npcs = signal<Record<number, Npc>>({});

  // The attack that is being prepared. Skill and weapon are picked by name; without a name the typed numbers count.
  protected readonly attackerId = signal<number | null>(null);
  protected readonly defenderId = signal<number | null>(null);
  protected readonly skill = signal('');
  protected readonly weapon = signal('');
  private readonly typedValue = signal(DEFAULT_VALUE);
  private readonly typedDice = signal(1);
  private readonly typedBonus = signal(0);
  // Instead of an attack a combatant can do something else, with or without a roll on the picked value.
  protected readonly mode = signal<'attack' | 'action'>('attack');
  protected readonly actionLabel = signal('');
  protected readonly actionRolls = signal(false);
  // The parry of the target of the open hit, picked the same way.
  protected readonly parrySkill = signal('');
  private readonly typedParry = signal(DEFAULT_VALUE);

  // A combatant that is added by hand.
  protected readonly newNpc = signal<number | null>(null);
  protected readonly newName = signal('');
  protected readonly newAction = signal(10);
  protected readonly newLife = signal(100);

  protected readonly combatants = computed(() => this.battle()?.combatants ?? []);
  /** The combatants as the timeline shows them, in the order of their initiative. */
  protected readonly timeline = computed<TimelineEntry[]>(() =>
    this.combatants().map((c) => ({
      id: c.id, name: c.name, symbol: c.symbol, isPlayer: c.player_character !== null, initiative: c.initiative,
      out: c.life_points <= 0, statuses: c.statuses,
    })),
  );
  /** The attack that is rolled but not closed yet. */
  protected readonly open = computed(() => this.battle()?.pending ?? null);
  /** Whether the target of the open hit is a player character; then its player can decide the parry himself. */
  protected readonly playerDefends = computed(() => !!this.combatant(this.open()?.defender ?? null)?.player_character);
  protected readonly combatantOptions = computed<Option[]>(() =>
    this.combatants().filter((c) => c.life_points > 0).map((c) => ({ id: c.id, label: c.name, hint: `LP ${c.life_points}` })),
  );
  protected readonly npcOptions = computed<Option[]>(() => {
    const fighting = new Set(this.combatants().map((combatant) => combatant.npc));
    return this.world.npcOptions().filter((option) => !fighting.has(option.id));
  });
  protected readonly attackChoices = computed(() => this.choices(this.attackerId()));
  protected readonly parryChoices = computed(() => this.choices(this.open()?.defender ?? null));
  protected readonly weapons = computed<Weapon[]>(() =>
    (this.sheet(this.attackerId())?.inventory ?? [])
      .filter((item) => item.damage_dice > 0)
      .map((item) => ({ name: item.name, label: `${item.name} · ${damageText(item)}`, dice: item.damage_dice, bonus: item.damage_bonus })),
  );
  // What is rolled: the numbers of the picked skill and weapon, otherwise the typed ones.
  protected readonly value = computed(() => this.attackChoices().find((c) => c.label === this.skill())?.value ?? this.typedValue());
  protected readonly damage = computed(
    () => this.weapons().find((w) => w.name === this.weapon()) ?? { dice: this.typedDice(), bonus: this.typedBonus() },
  );
  protected readonly parryValue = computed(() => this.parryChoices().find((c) => c.label === this.parrySkill())?.value ?? this.typedParry());
  // What the three selects show: the picked name when the sheet has it, otherwise "typed by hand".
  protected readonly shownSkill = computed(() => (this.attackChoices().some((c) => c.label === this.skill()) ? this.skill() : ''));
  protected readonly shownWeapon = computed(() => (this.weapons().some((w) => w.name === this.weapon()) ? this.weapon() : ''));
  protected readonly shownParry = computed(() => (this.parryChoices().some((c) => c.label === this.parrySkill()) ? this.parrySkill() : ''));

  constructor() {
    effect(() => this.run(this.api.battle(this.battleId()), (battle) => this.show(battle)));
    // The players roll on their own pages, so the fight is loaded again every few seconds.
    const timer = setInterval(() => this.reload(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Do one step of the fight and show the battle as it is afterwards. */
  protected step(step: 'start' | 'next' | 'close' | 'discard' | 'finish'): void {
    this.run(this.api.step(this.battleId(), step), (battle) => this.afterStep(battle));
  }

  /** Pick who attacks; what this combatant attacked with last time is filled in again. */
  protected pickAttacker(id: number | null): void {
    this.attackerId.set(id);
    const attacker = this.combatant(id);
    const last = attacker ? recall(combatantKey(attacker)) : {};
    const target = this.combatant(last.defender ?? null);
    this.defenderId.set(target && target.life_points > 0 ? target.id : null);
    this.skill.set(last.skill ?? ACTION);
    this.weapon.set(last.weapon ?? '');
    this.typedValue.set(last.value ?? DEFAULT_VALUE);
    this.typedDice.set(last.dice ?? 1);
    this.typedBonus.set(last.bonus ?? 0);
  }

  /** Roll the prepared attack; it stays open until the turn is closed. */
  protected attack(): void {
    const attacker = this.combatant(this.attackerId());
    const defender = this.defenderId();
    if (!attacker || defender === null) {
      return;
    }
    const { dice, bonus } = this.damage();
    remember(combatantKey(attacker), { defender, skill: this.skill(), weapon: this.weapon(), value: this.value(), dice, bonus });
    const attack = { attacker: attacker.id, defender, value: this.value(), damage_dice: dice, damage_bonus: bonus };
    this.run(this.api.attack(this.battleId(), attack), (battle) => this.afterStep(battle));
  }

  /** Keep what a combatant does instead of an attack; with a roll it goes against the picked value. */
  protected act(): void {
    const actor = this.attackerId();
    const label = this.actionLabel().trim();
    if (actor === null || !label) {
      return;
    }
    const action = { actor, label, value: this.actionRolls() ? this.value() : null };
    this.run(this.api.action(this.battleId(), action), (battle) => this.afterStep(battle));
    this.actionLabel.set('');
  }

  /** Give or take statuses of a combatant. */
  protected setStatuses(change: { id: number; statuses: Status[] }): void {
    this.run(this.api.updateCombatant(change.id, { statuses: change.statuses }), () => this.afterChange());
  }

  /** Decide the parry of the open hit: roll it, or take the hit. */
  protected parry(parries: boolean): void {
    const defender = this.combatant(this.open()?.defender ?? null);
    if (defender && parries) {
      remember(combatantKey(defender), { parrySkill: this.parrySkill(), parryValue: this.parryValue() });
    }
    this.run(this.api.parry(this.battleId(), parries ? this.parryValue() : null), (battle) => this.afterStep(battle));
  }

  /** Type the value of the attack by hand instead of picking a skill. */
  protected typeValue(value: number): void {
    this.skill.set('');
    this.typedValue.set(value);
  }

  /** Type dice or bonus of the damage by hand instead of picking a weapon. */
  protected typeDamage(dice: number, bonus: number): void {
    this.weapon.set('');
    this.typedDice.set(dice);
    this.typedBonus.set(bonus);
  }

  /** Type the value of the parry by hand instead of picking a skill. */
  protected typeParry(value: number): void {
    this.parrySkill.set('');
    this.typedParry.set(value);
  }

  /** Change a value of a combatant by hand: life points or whether it is surprised. */
  protected change(combatant: Combatant, changes: Partial<Combatant>): void {
    this.run(this.api.updateCombatant(combatant.id, changes), () => this.afterChange());
  }

  protected remove(combatant: Combatant): void {
    this.run(this.api.removeCombatant(combatant.id), () => this.afterChange());
  }

  /** Add an NPC of the world to the fight. */
  protected addNpc(): void {
    const npc = this.newNpc();
    if (npc !== null) {
      this.run(this.api.addCombatant(this.battleId(), { npc }), () => this.afterChange());
      this.newNpc.set(null);
    }
  }

  /** Add a combatant that is just a name with a Handeln value and life points. */
  protected addFree(): void {
    const combatant = { name: this.newName().trim(), action_value: this.newAction(), life_points: this.newLife() };
    this.run(this.api.addCombatant(this.battleId(), combatant), () => this.afterChange());
    this.newName.set('');
  }

  /** Load the fight again while it runs. */
  private reload(): void {
    if (!this.battle()?.finished) {
      this.run(this.api.battle(this.battleId()), (battle) => this.show(battle));
    }
  }

  /** After a change by hand: load the fight again, and the group, whose life points may have changed. */
  private afterChange(): void {
    this.error.set('');
    this.reload();
    this.session.refresh();
  }

  private afterStep(battle: Battle): void {
    this.error.set('');
    this.show(battle);
    this.session.refresh();
  }

  /** Show the battle; a new turn preselects its attacker, a new open hit the last parry of its target. */
  private show(battle: Battle): void {
    const before = this.battle();
    this.battle.set(battle);
    battle.combatants.filter((c) => c.npc !== null && !this.npcs()[c.npc]).forEach((c) => this.loadNpc(c.npc as number));
    if (battle.current !== before?.current) {
      this.pickAttacker(battle.current);
    }
    if (battle.pending?.defender && !before?.pending) {
      this.recallParry(battle.pending.defender);
    }
  }

  private recallParry(defenderId: number): void {
    const defender = this.combatant(defenderId);
    const last = defender ? recall(combatantKey(defender)) : {};
    this.parrySkill.set(last.parrySkill ?? ACTION);
    this.typedParry.set(last.parryValue ?? DEFAULT_VALUE);
  }

  private loadNpc(id: number): void {
    this.run(this.characterApi.get<Npc>('npcs', id), (npc) => this.npcs.update((all) => ({ ...all, [id]: npc })));
  }

  private combatant(id: number | null): Combatant | null {
    return this.combatants().find((combatant) => combatant.id === id) ?? null;
  }

  /** The character sheet behind a combatant, when it is an NPC or a player character. */
  private sheet(combatantId: number | null): AnyCharacter | null {
    const combatant = this.combatant(combatantId);
    if (combatant?.npc) {
      return this.npcs()[combatant.npc] ?? null;
    }
    return this.session.characters().find((character) => character.id === combatant?.player_character) ?? null;
  }

  /** What a combatant can roll on: the talent Handeln and every skill with its value. */
  private choices(combatantId: number | null): Choice[] {
    const sheet = this.sheet(combatantId);
    if (!sheet) {
      return [];
    }
    const skills = sheet.skills.map((skill) => ({ label: skill.name, value: skillValue(skill, sheet.skills) }));
    return [{ label: ACTION, value: talentValue(sheet.skills, 'action') }, ...skills];
  }

  private run<T>(request: Observable<T>, then: (value: T) => void): void {
    request.subscribe({ next: then, error: (e: unknown) => this.error.set(readError(e)) });
  }
}
