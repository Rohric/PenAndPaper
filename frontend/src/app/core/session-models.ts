import { Knowledge } from './models';

/** One group that plays a world over several evenings. */
export interface Session {
  id: number;
  name: string;
  date: string;
  world: number;
  world_name: string;
  /** Ids of the player characters in the group. */
  characters: number[];
  /** The chapter the group is in. */
  chapter: number | null;
  finished: boolean;
}

/** The kinds of world entries a session keeps a state for. An NPC is named by the id of the character. */
export type SessionEntryKind = 'scene' | 'quest' | 'event' | 'location' | 'npc' | 'trivia';

/** What a session did with one entry of the world. */
export interface SessionEntry {
  id: number;
  kind: SessionEntryKind;
  entry_id: number;
  done: boolean;
  /** Players see name and description of a revealed entry. */
  revealed: boolean;
  pinned: boolean;
  /** Positions of the checked steps of a quest's checklist. */
  steps: number[];
  /** Positions of the pieces of player knowledge the group knows. */
  known: number[];
}

export interface NoteComment {
  id: number;
  author: string;
  text: string;
  created_at: string;
}

/** A note of a session: personal for its author, or shared in the notepad of the group. */
export interface Note {
  id: number;
  title: string;
  text: string;
  shared: boolean;
  author: string;
  /** Whether the reader wrote the note himself. */
  mine: boolean;
  comments: NoteComment[];
  created_at: string;
}

/** A secret message between the game master and one player character. */
export interface Message {
  id: number;
  character: number;
  from_gm: boolean;
  text: string;
  read: boolean;
  created_at: string;
}

export type RollResult = 'critical' | 'success' | 'failure' | 'fumble';

export const ROLL_RESULTS: Record<RollResult, string> = {
  critical: 'Kritischer Erfolg',
  success: 'Erfolg',
  failure: 'Fehlschlag',
  fumble: 'Patzer',
};

/** A check: a W100 rolled against a value. */
export interface Check {
  value: number;
  rolled: number;
  result: RollResult;
}

/** A check rolled in a session, with who rolled it and on what. */
export interface Roll extends Check {
  who: string;
  label: string;
}

/** A character as the whole group sees it. */
export interface GroupMember {
  id: number;
  name: string;
  player: string;
  life_points: number;
  max_life_points: number;
}

/** A revealed entry of the world as the players see it. */
export interface SharedEntry {
  kind: SessionEntryKind;
  id: number;
  name: string;
  category: string;
  description: string;
  /** The pieces of knowledge the group has found out. */
  knowledge: Knowledge[];
}

/** A quest shared with the players. */
export interface SharedQuest extends SharedEntry {
  main: boolean;
  /** The number of a main quest. */
  number: number | null;
  goal: string;
  checklist: { text: string; done: boolean }[];
  giver: string;
  done: boolean;
}

/** Everything the players of a session may see. */
export interface PlayerView {
  id: number;
  name: string;
  world: string;
  date: string;
  chapter: string;
  finished: boolean;
  group: GroupMember[];
  quests: SharedQuest[];
  glossary: SharedEntry[];
}

/** An item the game master hands to a character. */
export interface ItemGift {
  character: number;
  name: string;
  quantity: number;
  damage_dice: number;
  damage_bonus: number;
  description: string;
}

/** One participant of a battle. */
export interface Combatant {
  id: number;
  npc: number | null;
  player_character: number | null;
  name: string;
  action_value: number;
  initiative: number;
  life_points: number;
  surprised: boolean;
  has_parried: boolean;
}

/**
 * An attack that is rolled but does not count yet. First it waits for the parry of the defender,
 * then for the game master to close the turn. Only then the damage is taken off.
 */
export interface Exchange {
  stage: 'parry' | 'close';
  attacker: number;
  defender: number;
  attacker_name: string;
  defender_name: string;
  attack: Check;
  parry: Check | null;
  damage: { dice: number[]; total: number } | null;
}

/** A fight: round 0 means it has not begun, current is the combatant whose turn it is. */
export interface Battle {
  id: number;
  name: string;
  session: number | null;
  round: number;
  current: number | null;
  finished: boolean;
  /** The attack that is open right now. */
  pending: Exchange | null;
  created_at: string;
  combatants: Combatant[];
  /** What happened in the battle, newest first. */
  log: string[];
}

/** What an attack looks like when it is sent to the server. */
export interface Attack {
  attacker: number;
  defender: number;
  value: number;
  damage_dice: number;
  damage_bonus: number;
}

/** A combatant as the players see it: the group with life points, enemies without. */
export interface PlayerCombatant {
  id: number;
  name: string;
  initiative: number;
  is_player: boolean;
  /** Whether it is the reader's own character. */
  mine: boolean;
  life_points: number | null;
  /** Whether the combatant cannot act anymore. */
  out: boolean;
  has_parried: boolean;
}

/** The running battle of a session as its players see it. */
export interface PlayerBattle {
  id: number;
  name: string;
  round: number;
  current: number | null;
  combatants: PlayerCombatant[];
  /** The attack that is open right now. */
  pending: Exchange | null;
  log: string[];
}
