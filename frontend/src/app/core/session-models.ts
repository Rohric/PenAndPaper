import { InventoryItem, Knowledge, Quest } from './models';

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
  /** What this session has different about the entry than the world; used for quests. */
  changes: QuestChanges;
}

/** What a session can have different about a quest, without changing the world. */
export type QuestChanges = Partial<Pick<Quest, 'name' | 'goal' | 'giver' | 'location' | 'scene'>>;

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

/**
 * A roll made in a session, with who rolled it and on what. A check has a value, the roll and a result;
 * free dice have every die and their sum. A secret roll is only shown to the game master.
 */
export interface Roll {
  who: string;
  label: string;
  secret: boolean;
  value?: number;
  rolled?: number;
  result?: RollResult;
  dice?: number[];
  total?: number;
}

/** What is asked to be rolled: a check against a value, or free dice when the value is null. */
export interface RollOrder {
  /** The own character of a player; the game master names nobody here. */
  character: number | null;
  /** Whoever the game master rolls for; empty for a roll of his own. */
  who: string;
  label: string;
  value: number | null;
  sides: 10 | 100;
  count: number;
  secret: boolean;
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
  symbol: string;
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
  /** What the characters of the group carry; hidden lines only reach their owner and the game master. */
  equipment: EquipmentLine[];
}

/** One line of the inventory of a character of the group, with the name of the character. */
export interface EquipmentLine extends InventoryItem {
  owner: string;
  hidden: boolean;
}

/** An item the game master hands to a character. */
export interface ItemGift {
  character: number;
  name: string;
  quantity: number;
  damage_dice: number;
  damage_bonus: number;
  description: string;
  /** Id of the item of the world it comes from, and whether the rest of the group does not see it. */
  item: number | null;
  hidden: boolean;
}

/** A running status of a combatant, like "gefroren". */
export interface Status {
  name: string;
  /** Own turns it still lasts; null until the game master takes it away. */
  rounds: number | null;
  /** Whether the combatant sits out while it lasts. */
  skips: boolean;
}

/** One participant of a battle. */
export interface Combatant {
  id: number;
  npc: number | null;
  player_character: number | null;
  name: string;
  /** Key of the symbol of the character behind the combatant. */
  symbol: string;
  action_value: number;
  initiative: number;
  life_points: number;
  surprised: boolean;
  has_parried: boolean;
  statuses: Status[];
}

/**
 * What a combatant did in its turn and does not count yet: an attack, or another action with or
 * without a roll. An attack first waits for the parry of the defender. Then everything waits for the
 * game master to close the turn; only then the damage is taken off.
 */
export interface Exchange {
  kind: 'attack' | 'action';
  /** What is done, for an action that is no attack. */
  label: string;
  stage: 'parry' | 'close';
  attacker: number;
  /** The combatant that is attacked; an action has none. */
  defender: number | null;
  attacker_name: string;
  defender_name: string;
  /** The roll of the attack, or the check of an action; null for an action without a roll. */
  attack: Check | null;
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
  statuses: Status[];
  symbol: string;
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
