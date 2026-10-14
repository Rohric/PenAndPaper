import { InventoryItem, Knowledge, PlayerCharacter } from './models';

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
  /** What this session has different about the entry than the world ("In dieser Runde ändern"). */
  changes: EntryChanges;
  /** A quest the group has accepted and is working on. */
  started: boolean;
  /** Whether the entry lies on the table of the master mode, and in which group of the game master's own. */
  on_table: boolean;
  table_group: string;
  /** What the players see of the entry piece by piece, like "description", "goal" or "step:2". */
  shown: string[];
  /** What the group wrote about a quest. */
  log: Partial<QuestLog>;
  /** What the game master noted about the entry in this session; the players never see it. */
  gm_note: string;
}

/** What a group writes about a quest: notes, tags, points of its own, and the order of all points. */
export interface QuestLog {
  notes: string;
  tags: string[];
  points: { text: string; done: boolean }[];
  /** Keys of all points in the order of the group: "g0" is a point of the game master, "p0" one of its own. */
  order: string[];
}

/** A log with every part filled, also when nothing was written yet. */
export function logOf(log: Partial<QuestLog> | undefined): QuestLog {
  return { notes: log?.notes ?? '', tags: log?.tags ?? [], points: log?.points ?? [], order: log?.order ?? [] };
}

/** One point of a quest's checklist as it is shown: its place in the list of the game master, its text, its check. */
export interface QuestStep {
  position: number;
  text: string;
  done: boolean;
}

/** Where a quest stands: not accepted yet, accepted and running, or over. */
export type QuestStatus = 'running' | 'open' | 'done';

export const QUEST_STATUSES: { id: QuestStatus; label: string }[] = [
  { id: 'running', label: 'Laufend' },
  { id: 'open', label: 'Offen' },
  { id: 'done', label: 'Beendet' },
];

/** Read the status of a quest from what a session knows about it. */
export function questStatus(state: { started?: boolean; done?: boolean } | undefined): QuestStatus {
  if (state?.done) {
    return 'done';
  }
  return state?.started ? 'running' : 'open';
}

/** The texts a round may change about an entry of the world. */
export type TextKey = 'name' | 'description' | 'to_read' | 'goal' | 'trigger' | 'happening';
/** The links a round may change about a quest of the world. */
export type LinkKey = 'giver' | 'location' | 'scene';

/**
 * What a session has different about an entry of the world, without changing the world: texts, and for a quest its
 * links. Which keys a kind allows stands in core/round.ts; null takes a link away.
 */
export type EntryChanges = Partial<Record<TextKey, string | null>> & Partial<Record<LinkKey, number | null>>;

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
  /**
   * The group of the table of the master mode an own note of the game master lies in; empty when it lies on no
   * table. Only its author ever reads anything here.
   */
  table_group: string;
  author: string;
  /** Whether the reader wrote the note himself. */
  mine: boolean;
  comments: NoteComment[];
  created_at: string;
  updated_at: string;
}

/** A message in the chat of the whole group. */
export interface ChatMessage {
  id: number;
  text: string;
  created_at: string;
  author_name: string;
  /** Whether the reader wrote it, and whether the game master did. */
  mine: boolean;
  from_gm: boolean;
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
  /** The character and the talent of a check, so a failed one can be rolled again with an inspiration point. */
  character?: number;
  talent?: string;
  inspired?: boolean;
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
  /** The talent a check belongs to. */
  talent?: string;
  /** Roll the last failed check of the own character again with an inspiration point. */
  inspiration?: boolean;
}

/** A character as the whole group sees it. */
export interface GroupMember {
  id: number;
  name: string;
  player: string;
  life_points: number;
  max_life_points: number;
  second_bar_points: number;
  max_second_bar_points: number;
}

/** A revealed entry of the world as the players see it. */
export interface SharedEntry {
  kind: SessionEntryKind;
  id: number;
  name: string;
  category: string;
  symbol: string;
  description: string;
  /** What sets an event off and what happens then, when the game master shows it. */
  trigger: string;
  happening: string;
  /** The pieces of knowledge the group has found out. */
  knowledge: Knowledge[];
}

/** A quest shared with the players. */
export interface SharedQuest extends SharedEntry {
  main: boolean;
  /** The number of a main quest. */
  number: number | null;
  goal: string;
  /** The points of the checklist the game master shows. */
  checklist: QuestStep[];
  giver: string;
  /** The place where the quest starts. */
  location: string;
  started: boolean;
  done: boolean;
  log: Partial<QuestLog>;
}

/** Everything the players of a session may see. */
export interface PlayerView {
  id: number;
  name: string;
  world: string;
  date: string;
  chapter: string;
  finished: boolean;
  /** The name of the second bar of the world; empty when it has none. */
  second_bar: string;
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

/** Everything the page of a player shows during a session, in one answer; tag names this state. */
export interface PlayerState {
  tag: string;
  view: PlayerView;
  notes: Note[];
  messages: Message[];
  chat: ChatMessage[];
  rolls: Roll[];
  battle: PlayerBattle | null;
  character: PlayerCharacter | null;
}

/** Everything the cockpit of the game master shows during a session, in one answer; tag names this state. */
export interface GameMasterState {
  tag: string;
  entries: SessionEntry[];
  notes: Note[];
  messages: Message[];
  chat: ChatMessage[];
  rolls: Roll[];
  characters: PlayerCharacter[];
}
