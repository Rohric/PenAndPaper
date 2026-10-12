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
  name: string;
  talent: Talent;
  points: number;
  bonus_points: number;
  description: string;
}

/** One inventory entry; it is a weapon when damage_dice is above 0. */
export interface InventoryItem {
  name: string;
  quantity: number;
  damage_dice: number;
  damage_bonus: number;
  description: string;
}

/** One choice in a select or a pill group. */
export interface Option {
  id: number;
  label: string;
}

/** A world, which is one adventure. */
export interface World {
  id: number;
  name: string;
  lore: string;
  created_at: string;
}

/** A place in a world; parent is the place it lies in. */
export interface Location {
  id: number;
  parent: number | null;
  name: string;
  lore: string;
}

/** The link between a world and one of its NPCs. `npc` is the id of the character itself. */
export interface WorldNpc {
  id: number;
  npc: number;
  name: string;
  profession: string;
  location: number | null;
}

export type QuestKind = 'main' | 'side';

export const QUEST_KINDS: { id: QuestKind; label: string }[] = [
  { id: 'main', label: 'Hauptquest' },
  { id: 'side', label: 'Nebenquest' },
];

/** A quest; giver and npcs hold ids of characters. */
export interface Quest {
  id: number;
  name: string;
  kind: QuestKind;
  text: string;
  goal: string;
  checklist: string[];
  location: number | null;
  giver: number | null;
  npcs: number[];
}

/** Something that can happen in a world. */
export interface WorldEvent {
  id: number;
  name: string;
  text: string;
  location: number | null;
}

/** A piece of knowledge about the world, on its own or attached to other entries. */
export interface Trivia {
  id: number;
  name: string;
  category: string;
  text: string;
  locations: number[];
  npcs: number[];
  quests: number[];
  events: number[];
}

/** A chapter of the story with its quests and events; its scenes form the thread of the story. */
export interface Chapter {
  id: number;
  number: number;
  name: string;
  text: string;
  to_read: string;
  quests: number[];
  events: number[];
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
  text: string;
  to_read: string;
  location: number | null;
  npcs: number[];
  leads_to: number[];
  quests: number[];
  events: number[];
  trivia: number[];
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

/** A pointer to an entry together with the text shown for it. */
export interface EntryLink extends EntryRef {
  label: string;
}

/** A character the game master writes. */
export interface Npc {
  id: number;
  name: string;
  age: string;
  gender: string;
  profession: string;
  description: string;
  life_points: number;
  skill_points_total: number;
  bonus_points_total: number;
  skills: Skill[];
  inventory: InventoryItem[];
  phrases: Phrase[];
}
