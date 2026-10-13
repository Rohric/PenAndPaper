/** Account data the backend returns for the logged-in user. */
export interface Account {
  user_id: number;
  username: string;
  is_game_master: boolean;
}

/** Answer of the login and registration endpoints. */
export interface LoginResponse extends Account {
  token: string;
}

/** Input of the login form. */
export interface Credentials {
  username: string;
  password: string;
}

/** Input of the registration form. */
export interface Registration extends Credentials {
  repeated_password: string;
}

/** The three talents of the rule set. */
export type Talent = 'action' | 'knowledge' | 'social';

export const TALENTS: { id: Talent; label: string }[] = [
  { id: 'action', label: 'Handeln' },
  { id: 'knowledge', label: 'Wissen' },
  { id: 'social', label: 'Soziales' },
];

/** One skill of a character: base points from creation, bonus points from leveling. */
export interface Skill {
  /** Fixed number of the skill, given by the server. */
  id?: number;
  name: string;
  talent: Talent;
  points: number;
  bonus_points: number;
  /** Points bought with the credit of the talent (house rule); missing in old data. */
  credit_points?: number;
  description: string;
}

/** One inventory entry; it is a weapon when damage_dice is above 0. */
export interface InventoryItem {
  name: string;
  quantity: number;
  damage_dice: number;
  damage_bonus: number;
  description: string;
  /** Id of the item of the world this line comes from, when the game master handed it over. */
  item?: number | null;
  /** A hidden line is seen only by its owner and the game master. */
  hidden?: boolean;
}

/** One choice in a select or in the list of a link picker; the hint says a little more about it. */
export interface Option {
  id: number;
  label: string;
  hint?: string;
  /** The kind of entry behind the choice, like "npcs"; it gives the choice its colour. */
  tone?: string;
}

/** One piece of knowledge about an entry: a text with an optional title. */
export interface Knowledge {
  title: string;
  text: string;
}

/** One line of a dialogue: what is said and, if wanted, which character says it. */
export interface DialogueLine {
  npc: number | null;
  text: string;
}

/** What is said in a scene, a quest or an event: one statement, or several that form a conversation. */
export interface Dialogue {
  title: string;
  lines: DialogueLine[];
}

/**
 * What every entry of a world says. Players see the description once a session revealed the entry,
 * the knowledge for players piece by piece, the knowledge of the game master never.
 */
export interface EntryTexts {
  description: string;
  /** Whether a new session shows the entry to its players right away. */
  visible_from_start: boolean;
  player_knowledge: Knowledge[];
  gm_knowledge: Knowledge[];
}

/** A world, which is one adventure. */
export interface World {
  id: number;
  name: string;
  lore: string;
  created_at: string;
}

/** A place in a world; parent is the place it lies in. */
export interface Location extends EntryTexts {
  id: number;
  /** The ids of the chapters the entry is tagged with. */
  chapters: number[];
  parent: number | null;
  name: string;
  /** Key of the symbol the entry carries; empty means the usual symbol of its kind. */
  symbol: string;
  /** When it was written and when it was changed last. */
  created_at: string;
  updated_at: string;
}

/** The link between a world and one of its NPCs. `npc` is the id of the character itself. */
export interface WorldNpc {
  id: number;
  npc: number;
  /** The ids of the chapters the entry is tagged with. */
  chapters: number[];
  name: string;
  profession: string;
  symbol: string;
  location: number | null;
  /** What the character carries. Read only here; it is changed at the character itself. */
  inventory: InventoryItem[];
  /** When it was written and when it was changed last. */
  created_at: string;
  updated_at: string;
}

export type QuestKind = 'main' | 'side';

export const QUEST_KINDS: { id: QuestKind; label: string }[] = [
  { id: 'main', label: 'Hauptquest' },
  { id: 'side', label: 'Nebenquest' },
];

/** How a quest is called by its kind; a main quest with its number, like "Hauptquest 3". */
export function questLabel(quest: { kind: QuestKind; number: number | null }): string {
  const label = QUEST_KINDS.find((kind) => kind.id === quest.kind)?.label ?? 'Quest';
  return quest.kind === 'main' && quest.number ? `${label} ${quest.number}` : label;
}

/** A quest; giver and npcs hold ids of characters. Players see description, goal and checklist. */
export interface Quest extends EntryTexts {
  id: number;
  /** The ids of the chapters the entry is tagged with. */
  chapters: number[];
  name: string;
  symbol: string;
  dialogues: Dialogue[];
  kind: QuestKind;
  /** The number of a main quest; side quests have none. */
  number: number | null;
  goal: string;
  checklist: string[];
  /** The place where the quest starts. */
  location: number | null;
  giver: number | null;
  /** The scene in which the quest comes up. */
  scene: number | null;
  npcs: number[];
  /** When it was written and when it was changed last. */
  created_at: string;
  updated_at: string;
}

/** Something that can happen in a world. */
export interface WorldEvent extends EntryTexts {
  id: number;
  /** The ids of the chapters the entry is tagged with. */
  chapters: number[];
  name: string;
  symbol: string;
  /** What sets the event off. */
  trigger: string;
  /** What happens once it is set off. */
  happening: string;
  dialogues: Dialogue[];
  location: number | null;
  /** When it was written and when it was changed last. */
  created_at: string;
  updated_at: string;
}

/** A piece of knowledge about the world, on its own or attached to other entries. */
export interface Trivia extends EntryTexts {
  id: number;
  /** The ids of the chapters the entry is tagged with. */
  chapters: number[];
  name: string;
  symbol: string;
  category: string;
  locations: number[];
  npcs: number[];
  quests: number[];
  events: number[];
  /** When it was written and when it was changed last. */
  created_at: string;
  updated_at: string;
}

/** A chapter of the story with its quests and events; its scenes form the thread of the story. */
export interface Chapter {
  id: number;
  number: number;
  name: string;
  description: string;
  visible_from_start: boolean;
  to_read: string;
  /** The entries tagged with this chapter; an entry can carry several chapters. NPCs by the id of the character. */
  locations: number[];
  npcs: number[];
  quests: number[];
  events: number[];
  trivia: number[];
  /** When it was written and when it was changed last. */
  created_at: string;
  updated_at: string;
}

/**
 * A scene of a chapter. Scenes on the thread are numbered by position,
 * optional scenes stand beside it and can be used wherever they fit.
 */
export interface Scene {
  id: number;
  chapter: number;
  position: number;
  optional: boolean;
  name: string;
  description: string;
  visible_from_start: boolean;
  to_read: string;
  dialogues: Dialogue[];
  location: number | null;
  npcs: number[];
  leads_to: number[];
  quests: number[];
  events: number[];
  trivia: number[];
  /** When it was written and when it was changed last. */
  created_at: string;
  updated_at: string;
}

/** Something an NPC might say, with what makes the NPC say it. */
export interface Phrase {
  trigger: string;
  text: string;
}

/** The kinds of entries that can be linked and looked up. NPCs are named by the id of the character. */
export type EntryKind = 'locations' | 'npcs' | 'quests' | 'events' | 'trivia' | 'chapters' | 'scenes';

/** A pointer to one entry of the world. */
export interface EntryRef {
  kind: EntryKind;
  id: number;
}

/** The entry in the window at the side; "edit" opens its form instead of the reading view. */
export interface Peek extends EntryRef {
  edit?: boolean;
}

/** A pointer to an entry together with the text shown for it. */
export interface EntryLink extends EntryRef {
  label: string;
  /** Where the colour differs from the kind: an item is a knowledge entry, but has its own colour. */
  tone?: string;
}

/** Title of the game master knowledge piece of an item that holds its damage, written like "2W10+1". */
const DAMAGE_TITLE = 'schaden';
const DAMAGE_PATTERN = /(\d+)\s*W10\s*(?:\+\s*(\d+))?/i;

/** Read the damage of an item from its game master knowledge: the number of W10 and the bonus, 0 and 0 without one. */
export function itemDamage(item: EntryTexts): { dice: number; bonus: number } {
  const piece = item.gm_knowledge.find((knowledge) => knowledge.title.trim().toLowerCase() === DAMAGE_TITLE);
  const match = piece?.text.match(DAMAGE_PATTERN);
  return { dice: Number(match?.[1] ?? 0), bonus: Number(match?.[2] ?? 0) };
}

/** Whether a knowledge entry is an item: its category is "Gegenstand". */
export function isItem(trivia: { category: string }): boolean {
  return trivia.category.trim().toLowerCase() === 'gegenstand';
}

/** Something special a character can do, with the condition for its roll. */
export interface SpecialAbility {
  name: string;
  description: string;
  roll_condition: string;
}

/** What every character has, an NPC as well as a player character. */
export interface Character {
  id: number;
  name: string;
  age: string;
  gender: string;
  profession: string;
  description: string;
  /** Whether a new session shows an NPC to its players right away; player characters ignore it. */
  visible_from_start?: boolean;
  /** Key of the symbol the character carries; empty means the usual symbol. */
  symbol: string;
  /** Address of the picture of the character, and whether it is shown instead of the symbol. */
  image: string | null;
  shows_image: boolean;
  /** When it was written and when it was changed last. */
  created_at: string;
  updated_at: string;
  /** The life points right now, and the most the character can have. */
  life_points: number;
  max_life_points: number;
  skill_points_total: number;
  bonus_points_total: number;
  skills: Skill[];
  inventory: InventoryItem[];
  special_abilities: SpecialAbility[];
}

/** A character the game master writes. */
export interface Npc extends Character {
  phrases: Phrase[];
  player_knowledge: Knowledge[];
  gm_knowledge: Knowledge[];
}

/** A character a player writes and plays; player is the name of the account it belongs to. */
export interface PlayerCharacter extends Character {
  backstory: string;
  player: string;
  /** The running adventure the character plays in; null while it is free, also after a finished one. */
  adventure: { id: number; name: string; finished: boolean } | null;
  /** Spent inspiration points by talent. */
  inspiration_used: Partial<Record<Talent, number>>;
}

/** Either kind of character, for the parts of the app that handle both. */
export type AnyCharacter = Character & Partial<Omit<Npc, keyof Character>> & Partial<Omit<PlayerCharacter, keyof Character>>;
