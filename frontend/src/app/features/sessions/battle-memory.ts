const KEY = 'pnp.battle.last.';

/**
 * What a combatant picked the last time it attacked or parried.
 * The browser remembers it, so nobody has to pick everything again in the next turn.
 */
export interface BattleChoice {
  /** The combatant that was attacked. */
  defender: number | null;
  /** Names of skill and weapon on the sheet; empty when the value was typed by hand. */
  skill: string;
  weapon: string;
  parrySkill: string;
  /** Values the game master typed by hand. */
  value: number;
  dice: number;
  bonus: number;
  parryValue: number;
}

/** The name a combatant is remembered under on the game master's side: its character, or its bare name. */
export function combatantKey(combatant: { npc: number | null; player_character: number | null; name: string }): string {
  if (combatant.player_character) {
    return `gm.pc.${combatant.player_character}`;
  }
  return combatant.npc ? `gm.npc.${combatant.npc}` : `gm.name.${combatant.name}`;
}

/** The name a player's own character is remembered under. */
export function ownKey(characterId: number): string {
  return `own.${characterId}`;
}

/** What is remembered under a name; nothing when the browser has no memory of it. */
export function recall(key: string): Partial<BattleChoice> {
  try {
    return JSON.parse(localStorage.getItem(KEY + key) ?? '{}') as Partial<BattleChoice>;
  } catch {
    return {};
  }
}

/** Remember picks under a name, on top of what is remembered there already. */
export function remember(key: string, choice: Partial<BattleChoice>): void {
  localStorage.setItem(KEY + key, JSON.stringify({ ...recall(key), ...choice }));
}
