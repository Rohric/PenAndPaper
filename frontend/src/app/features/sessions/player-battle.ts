import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { readError } from '../../core/api-error';
import { PlayerCharacter } from '../../core/models';
import { damageText, skillValue, talentValue } from '../../core/rules';
import { PlayerBattle } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { BattleExchange } from './battle-exchange';
import { ownKey, recall, remember } from './battle-memory';
import { BattleTimeline, TimelineEntry } from './battle-timeline';
import { SessionService } from './session.service';

/**
 * The running battle of a session as a player takes part in it: the timeline with the order and
 * the statuses, the attack or another action of the own character when it is its turn, and the
 * parry when it is hit.
 * Skill, weapon and target of the last turn are remembered in the browser.
 */
@Component({
  selector: 'app-player-battle',
  imports: [FormsModule, Icon, BattleExchange, BattleTimeline],
  templateUrl: './player-battle.html',
})
export class PlayerBattlePanel {
  private readonly api = inject(SessionService);

  readonly sessionId = input.required<number>();
  readonly battle = input<PlayerBattle | null>(null);
  /** The own character with its sheet; skills and weapons are picked from it. */
  readonly character = input<PlayerCharacter | null>(null);
  /** Fired with the battle as it is after an own roll. */
  readonly changed = output<PlayerBattle>();

  protected readonly error = signal('');
  protected readonly defenderId = signal<number | null>(null);
  // Names on the own sheet; an empty skill means the talent Handeln, an empty weapon bare hands.
  protected readonly skill = signal('');
  protected readonly weapon = signal('');
  protected readonly parrySkill = signal('');
  // Instead of an attack the own character can do something else, with or without a roll on the picked skill.
  protected readonly mode = signal<'attack' | 'action'>('attack');
  protected readonly actionLabel = signal('');
  protected readonly actionRolls = signal(false);

  protected readonly own = computed(() => this.battle()?.combatants.find((combatant) => combatant.mine) ?? null);
  protected readonly open = computed(() => this.battle()?.pending ?? null);
  /** The combatants as the timeline shows them, in the order of their initiative. */
  protected readonly timeline = computed<TimelineEntry[]>(() =>
    (this.battle()?.combatants ?? []).map((c) => ({
      id: c.id, name: c.mine ? `${c.name} (du)` : c.name, symbol: c.symbol, isPlayer: c.is_player, initiative: c.initiative,
      out: c.out, statuses: c.statuses,
    })),
  );
  protected readonly myTurn = computed(() => {
    const own = this.own();
    return !!own && !own.out && this.battle()?.current === own.id;
  });
  /** Whether a hit on the own character waits for the decision to parry. */
  protected readonly mustParry = computed(() => this.open()?.stage === 'parry' && this.open()?.defender === this.own()?.id);
  protected readonly targets = computed(() => (this.battle()?.combatants ?? []).filter((c) => !c.out && !c.mine));
  /** The target that is picked, as long as it still fights. */
  protected readonly target = computed(() => this.targets().find((combatant) => combatant.id === this.defenderId())?.id ?? null);
  protected readonly actionValue = computed(() => talentValue(this.character()?.skills ?? [], 'action'));
  protected readonly skills = computed(() => {
    const skills = this.character()?.skills ?? [];
    return skills.map((skill) => ({ name: skill.name, value: skillValue(skill, skills) }));
  });
  protected readonly weapons = computed(() =>
    (this.character()?.inventory ?? []).filter((item) => item.damage_dice > 0).map((item) => ({ name: item.name, label: `${item.name} · ${damageText(item)}` })),
  );
  private readonly characterId = computed(() => this.character()?.id ?? null);

  constructor() {
    // Fill in what the own character picked the last time, once it is known which character plays.
    effect(() => this.recallChoice(this.characterId()));
  }

  /** Roll the attack of the own character. */
  protected attack(): void {
    const defender = this.target();
    if (defender !== null) {
      this.keep({ defender, skill: this.skill(), weapon: this.weapon() });
      this.run(this.api.playerAttack(this.sessionId(), { defender, skill: this.skill(), weapon: this.weapon() }));
    }
  }

  /** Do something else than an attack; with a roll it goes against the picked skill. */
  protected act(): void {
    const label = this.actionLabel().trim();
    if (label) {
      this.run(this.api.playerAction(this.sessionId(), { label, rolls: this.actionRolls(), skill: this.skill() }));
      this.actionLabel.set('');
    }
  }

  /** Parry the hit that waits with the picked skill, or take it. */
  protected parry(parries: boolean): void {
    this.keep({ parrySkill: this.parrySkill() });
    this.run(this.api.playerParry(this.sessionId(), { parry: parries, skill: this.parrySkill() }));
  }

  private recallChoice(characterId: number | null): void {
    const last = characterId === null ? {} : recall(ownKey(characterId));
    this.defenderId.set(last.defender ?? null);
    this.skill.set(last.skill ?? '');
    this.weapon.set(last.weapon ?? '');
    this.parrySkill.set(last.parrySkill ?? '');
  }

  private keep(choice: Parameters<typeof remember>[1]): void {
    const characterId = this.characterId();
    if (characterId !== null) {
      remember(ownKey(characterId), choice);
    }
  }

  private run(request: Observable<PlayerBattle>): void {
    request.subscribe({
      next: (battle) => {
        this.error.set('');
        this.changed.emit(battle);
      },
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }
}
