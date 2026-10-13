import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';

import { readError } from '../../core/api-error';
import { PlayerCharacter, TALENTS, Talent } from '../../core/models';
import { inspirationLeft, inspirationPoints } from '../../core/rules';
import {
  ChatMessage, Message, Note, PlayerBattle, PlayerView, QuestLog, Roll, RollOrder, Session,
} from '../../core/session-models';
import { TutorialService } from '../../core/tutorial.service';
import { Icon, IconName } from '../../shared/icon';
import { Portrait } from '../../shared/portrait';
import { SidePanel } from '../../shared/side-panel';
import { ToastService } from '../../shared/toast.service';
import { TutorialButton } from '../../shared/tutorial-button';
import { CharacterEditor, EditorSection } from '../characters/character-editor';
import { CharacterSheet, RollWish } from '../characters/character-sheet';
import { CharacterService } from '../characters/character.service';
import { ChatThread, groupBubbles } from './chat-thread';
import { DiceRoll } from './dice-roll';
import { NoteDetail } from './note-detail';
import { FeedItem, FeedTarget, Snapshot, feedOf, snapshotOf } from './player-feed';
import { PlayerBattlePanel } from './player-battle';
import { PlayerPanels } from './player-panels';
import { RollPanel } from './roll-panel';
import { SessionNotes } from './session-notes';
import { SessionRolls } from './session-rolls';
import { SessionThread } from './session-thread';
import { SessionService } from './session.service';

/** Every page of the session; the bar at the bottom leads to five of them, "Mehr" to the rest. */
type Page = 'round' | 'character' | 'roll' | 'quests' | 'chat' | 'more' | 'glossary' | 'notes' | 'group' | 'battle';
type BarId = 'round' | 'character' | 'quests' | 'chat' | 'more';

const BAR: { id: BarId; label: string; icon: IconName }[] = [
  { id: 'round', label: 'Runde', icon: 'flag' },
  { id: 'character', label: 'Charakter', icon: 'sheet' },
  { id: 'quests', label: 'Quests', icon: 'quest' },
  { id: 'chat', label: 'Chat', icon: 'speech' },
  { id: 'more', label: 'Mehr', icon: 'expand' },
];
const MORE_TILES: { id: Page; label: string; icon: IconName; hint: string }[] = [
  { id: 'glossary', label: 'Glossar', icon: 'book', hint: 'Orte, Figuren, Wissen und Gegenstände.' },
  { id: 'notes', label: 'Notizen', icon: 'note', hint: 'Deine Notizen und der Gruppenblock.' },
  { id: 'group', label: 'Gruppe', icon: 'group', hint: 'Wer mitspielt und wie es ihnen geht.' },
  { id: 'battle', label: 'Kampf', icon: 'sword', hint: 'Zeitleiste und dein Zug.' },
];
const SUB_PAGES: Page[] = ['glossary', 'notes', 'group', 'battle'];
const REFRESH_MS = 5000;
const FEED_KEY = 'pnp.feed.';
const CHAT_KEY = 'pnp.chat.seen.';
const TOASTED = 3;

/**
 * A session as a player sees it, built for the phone: the round with what is new, the own character
 * with its rolls, the quest log, the chat, and under "Mehr" the glossary, the notes, the group and the battle.
 * A bar with five symbols stays at the bottom. Short messages tell what changed while the group plays.
 */
@Component({
  selector: 'app-player-session',
  imports: [
    NgTemplateOutlet, RouterLink, Icon, Portrait, SidePanel, TutorialButton, CharacterEditor, CharacterSheet, ChatThread, DiceRoll,
    NoteDetail, PlayerBattlePanel, PlayerPanels, RollPanel, SessionNotes, SessionRolls, SessionThread,
  ],
  templateUrl: './player-session.html',
  styleUrl: './player-session.scss',
})
export class PlayerSession {
  private readonly api = inject(SessionService);
  private readonly characterApi = inject(CharacterService);
  private readonly toast = inject(ToastService);
  private readonly tutorial = inject(TutorialService);

  /** From the URL: /player/sessions/:sessionId */
  readonly sessionId = input.required<string>();

  protected readonly bar = BAR;
  protected readonly moreTiles = MORE_TILES;
  protected readonly page = signal<Page>('round');
  protected readonly channel = signal<'group' | 'gm'>('group');
  protected readonly data = signal<PlayerView | null>(null);
  protected readonly notes = signal<Note[]>([]);
  protected readonly messages = signal<Message[]>([]);
  protected readonly chat = signal<ChatMessage[]>([]);
  /** The own character that plays in this session. */
  protected readonly character = signal<PlayerCharacter | null>(null);
  protected readonly lastRoll = signal<Roll | null>(null);
  /** The latest rolls of the whole group; secret rolls of the game master are not among them. */
  protected readonly rolls = signal<Roll[]>([]);
  protected readonly battle = signal<PlayerBattle | null>(null);
  protected readonly offline = signal(false);
  protected readonly error = signal('');
  /** The note in the window at the side: an id, null for a new note, undefined when the window is closed. */
  protected readonly noteId = signal<number | null | undefined>(undefined);
  /** The character in the editor; a copy from the moment it was opened, so the reloads do not wipe the changes. */
  protected readonly editing = signal<PlayerCharacter | null>(null);
  protected readonly editSection = signal<EditorSection>('profile');
  protected readonly editDirty = signal(false);

  private readonly current = signal<Snapshot | null>(null);
  private readonly seen = signal<Snapshot | null>(null);
  private readonly chatSeen = signal(0);

  protected readonly id = computed(() => Number(this.sessionId()));
  protected readonly own = computed(() => {
    const character = this.character();
    return character ? [character] : [];
  });
  protected readonly openNote = computed(() => this.notes().find((note) => note.id === this.noteId()) ?? null);
  protected readonly unread = computed(() => this.messages().filter((message) => message.from_gm && !message.read).length);
  protected readonly chatUnread = computed(() => this.chat().filter((message) => !message.mine && message.id > this.chatSeen()).length);
  protected readonly bubbles = computed(() => groupBubbles(this.chat()));
  protected readonly battleHint = computed(() => this.hintFor(this.battle()));
  protected readonly isSub = computed(() => SUB_PAGES.includes(this.page()));
  protected readonly barOf = computed<BarId>(() => {
    const page = this.page();
    if (page === 'roll') {
      return 'character';
    }
    return SUB_PAGES.includes(page) ? 'more' : (page as BarId);
  });
  protected readonly feed = computed(() => feedOf(this.seen(), this.current()));
  protected readonly freshQuests = computed(() => this.feed().flatMap((item) => (item.quest !== undefined ? [item.quest] : [])));
  protected readonly recentRolls = computed(() => this.rolls().slice(0, 5));
  protected readonly lifePercent = computed(() => {
    const own = this.character();
    return own?.max_life_points ? Math.min(100, Math.max(0, (own.life_points / own.max_life_points) * 100)) : 0;
  });
  /** The inspiration points of each talent: left and in all. */
  protected readonly sparks = computed(() => {
    const own = this.character();
    return TALENTS.map((talent) => ({
      label: talent.label,
      total: own ? inspirationPoints(own.skills, talent.id) : 0,
      left: own ? inspirationLeft(own.skills, talent.id, own.inspiration_used) : 0,
    }));
  });
  /** The offer to roll the last failed check again, when the talent still has an inspiration point. */
  protected readonly inspiration = computed(() => {
    const roll = this.lastRoll();
    const own = this.character();
    if (!roll || !own || roll.result !== 'failure' || roll.inspired || !roll.talent || roll.character !== own.id) {
      return null;
    }
    const left = inspirationLeft(own.skills, roll.talent as Talent, own.inspiration_used);
    return left > 0 ? { label: TALENTS.find((talent) => talent.id === roll.talent)?.label ?? '', left } : null;
  });

  constructor() {
    effect(() => {
      this.loadSeen(this.id());
      this.refresh(this.id());
    });
    // While the group chat is open, everything in it counts as read.
    effect(() => {
      if (this.page() === 'chat' && this.channel() === 'group') {
        this.markChatSeen();
      }
    });
    const timer = setInterval(() => this.refresh(this.id()), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** The number on a symbol of the bar: what is waiting there. */
  protected badge(id: BarId): number {
    const counts: Record<BarId, number> = {
      round: this.feed().length, character: 0, quests: this.freshQuests().length, chat: this.chatUnread() + this.unread(), more: 0,
    };
    return counts[id];
  }

  /** Open a page of the bar; opening the secret messages marks them as read. */
  protected open(page: Page, channel?: 'group' | 'gm'): void {
    this.page.set(page);
    if (channel) {
      this.channel.set(channel);
    }
    const character = this.character();
    if (page === 'chat' && this.channel() === 'gm' && character && this.unread()) {
      this.run(this.api.markRead(this.id(), character.id), () => this.refresh(this.id()));
    }
  }

  /** Go to the place a piece of news is about. */
  protected go(target: FeedTarget): void {
    this.open(target);
  }

  /** Open a help topic. */
  protected help(topic: string): void {
    this.tutorial.open(topic);
  }

  /** Remember that the player has seen all that is new. */
  protected markSeen(): void {
    this.seen.set(this.current());
    try {
      localStorage.setItem(FEED_KEY + this.id(), JSON.stringify(this.current()));
    } catch {
      // Without storage the news just show again after a reload.
    }
  }

  /** Roll a check on a skill or a talent of the own character. */
  protected roll(wish: RollWish): void {
    this.order({
      character: this.character()?.id ?? null, who: '', label: wish.label, value: wish.value, sides: 100, count: 1, secret: false,
      talent: wish.talent,
    });
  }

  /** Roll again with an inspiration point. */
  protected inspire(): void {
    this.order({ character: this.character()?.id ?? null, who: '', label: '', value: null, sides: 100, count: 1, secret: false, inspiration: true });
  }

  /** Roll what was asked for and show it. */
  protected order(order: RollOrder): void {
    this.run(this.api.roll(this.id(), order), (roll) => {
      this.lastRoll.set(roll);
      this.refresh(this.id());
    });
  }

  /** Open the editor with the character, at a section. */
  protected startEdit(section: EditorSection): void {
    this.editSection.set(section);
    this.editDirty.set(false);
    this.editing.set(this.character() ? structuredClone(this.character()) : null);
  }

  /** Close the editor, after asking when there are unsaved changes. */
  protected closeEditor(): void {
    if (!this.editDirty() || confirm('Du hast ungespeicherte Änderungen. Wirklich schließen?')) {
      this.editing.set(null);
    }
  }

  /** The character was saved. */
  protected editSaved(): void {
    this.editDirty.set(false);
    this.editing.set(null);
    this.toast.show('Charakter gespeichert', 'ok');
    this.refresh(this.id());
  }

  /** The character was deleted. */
  protected editDeleted(): void {
    this.editDirty.set(false);
    this.editing.set(null);
    this.refresh(this.id());
  }

  /** Save what the group wrote into the log of a quest. */
  protected saveLog(change: { quest: number; log: QuestLog }): void {
    this.run(this.api.questLog(this.id(), change.quest, { log: change.log }), () => {
      this.toast.show('Questlog gespeichert', 'ok');
      this.refresh(this.id());
    });
  }

  /** Save which points of a quest are checked. */
  protected saveSteps(change: { quest: number; steps: number[] }): void {
    this.run(this.api.questLog(this.id(), change.quest, { steps: change.steps }), () => this.refresh(this.id()));
  }

  /** Answer the game master in the secret thread. */
  protected send(text: string): void {
    const character = this.character();
    if (character) {
      this.run(this.api.sendMessage(this.id(), character.id, text), () => this.refresh(this.id()));
    }
  }

  /** Write into the chat of the group. */
  protected sendChat(text: string): void {
    this.run(this.api.sendChat(this.id(), text), () => this.refresh(this.id()));
  }

  protected addNote(note: Partial<Note>): void {
    this.run(this.api.addNote(this.id(), note), () => {
      this.toast.show('Notiz gespeichert', 'ok');
      this.refresh(this.id());
    });
    this.noteId.set(undefined);
  }

  /** Make a note from a title alone, just for the player. */
  protected quickNote(title: string): void {
    this.run(this.api.addNote(this.id(), { title, text: '', shared: false }), () => {
      this.toast.show('Notiz gespeichert', 'ok');
      this.refresh(this.id());
    });
  }

  protected saveNote(change: { id: number; changes: Partial<Note> }): void {
    this.run(this.api.updateNote(change.id, change.changes), () => this.refresh(this.id()));
  }

  protected removeNote(noteId: number): void {
    this.run(this.api.removeNote(noteId), () => this.refresh(this.id()));
    this.noteId.set(undefined);
  }

  protected comment(comment: { id: number; text: string }): void {
    this.run(this.api.addComment(comment.id, comment.text), () => this.refresh(this.id()));
  }

  /** Load again what changes while the group plays; a failure only shows that the connection is gone. */
  private refresh(id: number): void {
    const parts = {
      view: this.api.playerView(id),
      notes: this.api.notes(id),
      messages: this.api.messages(id),
      chat: this.api.chat(id),
      rolls: this.api.rolls(id),
      battle: this.api.playerBattle(id),
      sessions: this.api.mine(),
      characters: this.characterApi.list<PlayerCharacter>('player-characters'),
    };
    forkJoin(parts).subscribe({ next: (data) => this.fill(id, data), error: () => this.offline.set(true) });
  }

  private fill(
    id: number,
    data: {
      view: PlayerView; notes: Note[]; messages: Message[]; chat: ChatMessage[]; rolls: Roll[]; battle: PlayerBattle | null;
      sessions: Session[]; characters: PlayerCharacter[];
    },
  ): void {
    const inSession = data.sessions.find((session) => session.id === id)?.characters ?? [];
    const character = data.characters.find((other) => inSession.includes(other.id)) ?? null;
    this.data.set(data.view);
    this.notes.set(data.notes);
    this.messages.set(data.messages);
    this.chat.set(data.chat);
    this.rolls.set(data.rolls);
    this.battle.set(data.battle);
    this.character.set(character);
    this.offline.set(false);
    this.error.set('');
    this.noticeNews(snapshotOf(data.view, data.notes, data.messages, data.chat, character));
  }

  /** Tell with short messages what is new since the last reload; the first load only sets the baseline. */
  private noticeNews(now: Snapshot): void {
    const before = this.current();
    this.current.set(now);
    if (!this.seen()) {
      this.seen.set(now);
      this.markSeen();
    }
    const here = this.barOf();
    feedOf(before, now)
      .filter((item) => item.target !== here)
      .slice(0, TOASTED)
      .forEach((item: FeedItem) => this.toast.show(item.text));
  }

  private loadSeen(id: number): void {
    this.current.set(null);
    try {
      this.seen.set(JSON.parse(localStorage.getItem(FEED_KEY + id) ?? 'null'));
      this.chatSeen.set(Number(localStorage.getItem(CHAT_KEY + id)) || 0);
    } catch {
      this.seen.set(null);
    }
  }

  private markChatSeen(): void {
    const last = this.chat().at(-1)?.id ?? 0;
    if (last > this.chatSeen()) {
      this.chatSeen.set(last);
      try {
        localStorage.setItem(CHAT_KEY + this.id(), String(last));
      } catch {
        // Without storage the badge shows again after a reload.
      }
    }
  }

  private hintFor(battle: PlayerBattle | null): string {
    const own = battle?.combatants.find((combatant) => combatant.mine);
    if (!battle || !own) {
      return battle ? 'läuft' : '';
    }
    if (battle.pending?.stage === 'close') {
      return battle.pending.attacker === own.id && battle.current === own.id && !own.out ? 'Zug abschließen' : 'läuft';
    }
    if (battle.pending) {
      return battle.pending.defender === own.id ? 'Parade?' : 'läuft';
    }
    return battle.current === own.id && !own.out ? 'du bist dran' : 'läuft';
  }

  private run<T>(request: Observable<T>, then: (value: T) => void): void {
    request.subscribe({ next: then, error: (e: unknown) => this.error.set(readError(e)) });
  }
}
