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

/** One day on the timeline of a world. */
export interface TimelineEntry {
  id: number;
  day: number;
  title: string;
  text: string;
}

/** A chapter of the story with its quests and events. */
export interface Chapter {
  id: number;
  number: number;
  name: string;
  text: string;
  to_read: string;
  quests: number[];
  events: number[];
}

/** A scene of a chapter. Position is only the order in the list, not the order of play. */
export interface Scene {
  id: number;
  position: number;
  name: string;
  text: string;
  to_read: string;
  location: number | null;
  npcs: number[];
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
  phrases: string[];
}
