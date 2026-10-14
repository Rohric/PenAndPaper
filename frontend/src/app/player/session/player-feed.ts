import { PlayerCharacter } from '../../core/models';
import { ChatMessage, Message, Note, PlayerView } from '../../core/session-models';
import { IconName } from '../../components/basic/icon';
import { Toast } from '../../global/toast/toast.service';

/** Where a piece of news leads to. */
export type FeedTarget = 'quests' | 'glossary' | 'character' | 'notes' | 'chat' | 'round';

/** What a player has in front of him at one moment, boiled down to what can be new. */
export interface Snapshot {
  quests: Record<number, { name: string; sign: string }>;
  glossary: Record<string, string>;
  items: string[];
  life: number | null;
  notes: number;
  secret: number;
  chat: number;
  /** The bonus points the character got in all; missing in a state saved before they were counted. */
  bonus?: number | null;
  /** The inspiration points the character has spent, over all talents. */
  sparksUsed?: number | null;
  /** The second bar of the world: its name and the points of the character. */
  secondName?: string;
  second?: number | null;
}

/** One piece of news for the player. */
export interface FeedItem {
  key: string;
  text: string;
  icon: IconName;
  target: FeedTarget;
  /** The quest it is about, if it is about one. */
  quest?: number;
  /** Shown as a message even while the page it leads to is open. */
  always?: boolean;
  tone?: Toast['tone'];
}

/** Boil down what the player sees right now. */
export function snapshotOf(
  view: PlayerView, notes: Note[], messages: Message[], chat: ChatMessage[], character: PlayerCharacter | null,
): Snapshot {
  const sign = (quest: PlayerView['quests'][number]) =>
    [quest.started, quest.done, quest.checklist.length, quest.checklist.filter((step) => step.done).length].join('|');
  return {
    quests: Object.fromEntries(view.quests.map((quest) => [quest.id, { name: quest.name, sign: sign(quest) }])),
    glossary: Object.fromEntries(view.glossary.map((entry) => [`${entry.kind}:${entry.id}`, entry.name])),
    items: view.equipment.filter((line) => line.owner === character?.name).map((line) => line.name),
    life: character?.life_points ?? null,
    notes: notes.filter((note) => note.shared).reduce((sum, note) => sum + 1 + note.comments.length, 0),
    secret: messages.filter((message) => message.from_gm).length,
    chat: chat.filter((message) => !message.mine).length,
    bonus: character?.bonus_points_total ?? null,
    sparksUsed: character ? Object.values(character.inspiration_used ?? {}).reduce((sum, used) => sum + (used ?? 0), 0) : null,
    secondName: view.second_bar,
    second: view.second_bar && character ? character.second_bar_points : null,
  };
}

/** What is new in the second snapshot compared to the first; nothing when there is no first. */
export function feedOf(before: Snapshot | null, now: Snapshot | null): FeedItem[] {
  if (!before || !now) {
    return [];
  }
  return [...questNews(before, now), ...glossaryNews(before, now), ...personalNews(before, now), ...countNews(before, now)];
}

function questNews(before: Snapshot, now: Snapshot): FeedItem[] {
  return Object.entries(now.quests).flatMap(([id, quest]) => {
    const old = before.quests[+id];
    if (old?.sign === quest.sign) {
      return [];
    }
    const text = old ? `Quest geändert: ${quest.name}` : `Neue Quest: ${quest.name}`;
    return [{ key: `quest:${id}`, text, icon: 'quest' as const, target: 'quests' as const, quest: +id }];
  });
}

function glossaryNews(before: Snapshot, now: Snapshot): FeedItem[] {
  return Object.entries(now.glossary)
    .filter(([key]) => !(key in before.glossary))
    .map(([key, name]) => ({ key: `glossary:${key}`, text: `Neu im Glossar: ${name}`, icon: 'book' as const, target: 'glossary' as const }));
}

function personalNews(before: Snapshot, now: Snapshot): FeedItem[] {
  const items = now.items
    .filter((name) => !before.items.includes(name))
    .map((name) => ({ key: `item:${name}`, text: `Du hast „${name}“ erhalten`, icon: 'gift' as const, target: 'character' as const }));
  const life =
    before.life !== null && now.life !== null && before.life !== now.life
      ? [{ key: 'life', text: `Lebenspunkte: ${before.life} → ${now.life}`, icon: 'heart' as const, target: 'character' as const }]
      : [];
  return [...items, ...life, ...rewardNews(before, now), ...secondNews(before, now)];
}

/** Bonus points from the game master and inspiration points filled up again: always shown as a reward. */
function rewardNews(before: Snapshot, now: Snapshot): FeedItem[] {
  const reward = { icon: 'flag' as const, target: 'character' as const, always: true, tone: 'reward' as const };
  const got = (now.bonus ?? 0) - (before.bonus ?? 0);
  const bonus = before.bonus != null && now.bonus != null && got > 0 ? [{ ...reward, key: 'bonus', text: `Du hast ${got} Bonuspunkte bekommen` }] : [];
  const filled = (before.sparksUsed ?? 0) > 0 && now.sparksUsed === 0;
  return [...bonus, ...(filled ? [{ ...reward, key: 'sparks', text: 'Deine Geistesblitzpunkte sind wieder voll' }] : [])];
}

/** The second bar of the world changed, like the life points. */
function secondNews(before: Snapshot, now: Snapshot): FeedItem[] {
  if (before.second == null || now.second == null || before.second === now.second || !now.secondName) {
    return [];
  }
  return [{ key: 'second', text: `${now.secondName}: ${before.second} → ${now.second}`, icon: 'heart' as const, target: 'character' as const }];
}

function countNews(before: Snapshot, now: Snapshot): FeedItem[] {
  const news = (key: string, count: number, text: string, icon: IconName, target: FeedTarget): FeedItem[] =>
    count > 0 ? [{ key, text: `${count} ${text}`, icon, target }] : [];
  return [
    ...news('notes', now.notes - before.notes, 'neue Notizen oder Kommentare im Gruppenblock', 'note', 'notes'),
    ...news('secret', now.secret - before.secret, 'neue geheime Nachricht vom Spielleiter', 'mail', 'chat'),
    ...news('chat', now.chat - before.chat, 'neue Nachrichten im Gruppen-Chat', 'speech', 'chat'),
  ];
}
