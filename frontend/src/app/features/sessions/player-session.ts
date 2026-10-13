import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, TemplateRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';

import { readError } from '../../core/api-error';
import { PlayerCharacter, TALENTS, Talent } from '../../core/models';
import { inspirationLeft, inspirationPoints } from '../../core/rules';
import {
  ChatMessage, Message, Note, PlayerBattle, PlayerView, QuestLog, QuestStatus, Roll, RollOrder, Session,
} from '../../core/session-models';
import { AuthService } from '../../core/auth.service';
import { TutorialService } from '../../core/tutorial.service';
import { Icon, IconName } from '../../shared/icon';
import { Portrait } from '../../shared/portrait';
import { SidePanel } from '../../shared/side-panel';
import { ToastService } from '../../shared/toast.service';
import { CharacterEditor, EditorSection } from '../characters/character-editor';
import { CharacterSheet, RollWish } from '../characters/character-sheet';
import { CharacterService } from '../characters/character.service';
import { PlayerBar } from '../player/player-bar';
import { PlayerTools } from '../player/player-tools';
import { Tool } from './cockpit-tools';
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

/** Every page of the session. The bar leads to six; "Mehr" is a popup with the others. */
type Page = 'round' | 'character' | 'roll' | 'quests' | 'chat' | 'glossary' | 'notes' | 'group' | 'battle';

/** The pages that "Mehr" opens. */
const MORE_PAGES: { id: Page; label: string; icon: IconName }[] = [
  { id: 'glossary', label: 'Glossar', icon: 'book' },
  { id: 'notes', label: 'Notizen', icon: 'note' },
  { id: 'group', label: 'Gruppe', icon: 'group' },
];
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
    NgTemplateOutlet, RouterLink, Icon, Portrait, SidePanel, CharacterEditor, CharacterSheet, ChatThread, DiceRoll,
    NoteDetail, PlayerBar, PlayerBattlePanel, PlayerPanels, RollPanel, SessionNotes, SessionRolls, SessionThread,
  ],
  templateUrl: './player-session.html',
  styleUrl: './player-session.scss',
})
export class PlayerSession {
  private readonly api = inject(SessionService);
  private readonly characterApi = inject(CharacterService);
  private readonly toast = inject(ToastService);
  private readonly tutorial = inject(TutorialService);
  private readonly tools = inject(PlayerTools);
  protected readonly auth = inject(AuthService);

  /** From the URL: /player/sessions/:sessionId */
  readonly sessionId = input.required<string>();

  protected readonly morePages = MORE_PAGES;
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
  /** The status of the quests that the bar of the quest page chose. */
  protected readonly questStatus = signal<'all' | QuestStatus>('all');
  /** The place of a page in the bar: the pages behind "Mehr" count as "more". */
  private readonly barPage = computed(() => {
    const page = this.page();
    return page === 'roll' ? 'character' : page;
  });
  private readonly morePop = viewChild<TemplateRef<unknown>>('morePop');
  private readonly rollsPop = viewChild<TemplateRef<unknown>>('rollsPop');
  private readonly sparkPop = viewChild<TemplateRef<unknown>>('sparkPop');
  private readonly logPop = viewChild<TemplateRef<unknown>>('logPop');
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

  /** The sparks of inspiration that are left, over all talents. */
  private readonly sparksLeft = computed(() => this.sparks().reduce((sum, talent) => sum + talent.left, 0));
  /** The main row: the six places of the session. */
  private readonly mainTools = computed<Tool[]>(() => {
    const here = this.barPage();
    const hint = this.battleHint();
    const items: Tool[] = [
      { id: 'round', word: 'Runde', icon: 'flag', count: this.feed().length, pressed: here === 'round', click: () => this.open('round') },
      { id: 'character', word: 'Charakter', icon: 'sheet', pressed: here === 'character', click: () => this.open('character') },
      { id: 'quests', word: 'Quests', icon: 'quest', count: this.freshQuests().length, pressed: here === 'quests', click: () => this.open('quests') },
      { id: 'chat', word: 'Chat', icon: 'speech', count: this.chatUnread() + this.unread(), pressed: here === 'chat', click: () => this.open('chat') },
    ];
    if (this.battle()) {
      items.push({ id: 'battle', word: 'Kampf', icon: 'sword', alert: !!hint && hint !== 'läuft', pressed: here === 'battle', click: () => this.open('battle') });
    }
    const behind = MORE_PAGES.some((item) => item.id === here);
    return [...items, { id: 'more', word: 'Mehr', icon: 'expand', pressed: behind, popup: this.morePop(), popupTitle: 'Mehr' }];
  });
  /** The row of the open page above the main row. */
  private readonly pageTools = computed<Tool[]>(() => {
    const help = (topic: string, step: number | string = 0) => this.tools.help(topic, step);
    switch (this.page()) {
      case 'round':
        return [
          { id: 'seen', word: 'Gesehen', icon: 'check', disabled: !this.feed().length, click: () => this.markSeen() },
          { id: 'rolls', word: 'Würfe', icon: 'dice', popup: this.rollsPop(), popupTitle: 'Letzte Würfe' },
          help('my-sessions'),
        ];
      case 'character':
      case 'roll':
        return [
          { id: 'sheet', word: 'Bogen', icon: 'sheet', pressed: this.page() === 'character', click: () => this.page.set('character') },
          { id: 'roll', word: 'Würfeln', icon: 'dice', pressed: this.page() === 'roll', click: () => this.page.set('roll') },
          { id: 'edit', word: 'Bearbeiten', icon: 'edit', disabled: !this.character(), click: () => this.startEdit('profile') },
          { id: 'spark', word: 'Blitz', icon: 'flag', count: this.sparksLeft(), popup: this.sparkPop(), popupTitle: 'Geistesblitz' },
          help('rules', 'check'),
        ];
      case 'quests':
        return [
          { id: 'status-all', word: 'Alle', icon: 'quest', pressed: this.questStatus() === 'all', click: () => this.questStatus.set('all') },
          { id: 'status-running', word: 'Laufend', icon: 'flag', pressed: this.questStatus() === 'running', click: () => this.questStatus.set('running') },
          { id: 'status-open', word: 'Offen', icon: 'pin', pressed: this.questStatus() === 'open', click: () => this.questStatus.set('open') },
          { id: 'status-done', word: 'Beendet', icon: 'check', pressed: this.questStatus() === 'done', click: () => this.questStatus.set('done') },
          help('my-sessions', 4),
        ];
      case 'chat':
        return [
          { id: 'channel-group', word: 'Gruppe', icon: 'group', count: this.chatUnread(), pressed: this.channel() === 'group', click: () => this.open('chat', 'group') },
          { id: 'channel-gm', word: 'Spielleiter', icon: 'mail', count: this.unread(), pressed: this.channel() === 'gm', click: () => this.open('chat', 'gm') },
          help('my-sessions', 7),
        ];
      case 'notes':
        return [{ id: 'note-new', word: 'Neu', icon: 'plus', click: () => this.noteId.set(null) }, help('my-sessions', 6)];
      case 'battle':
        return [];
      default:
        return [help('my-sessions')];
    }
  });

  constructor() {
    this.tools.provide('always', this.mainTools);
    this.tools.provide('view', this.pageTools);
    // When the fight is over the page of the fight has nothing left to show.
    effect(() => {
      if (!this.battle() && this.page() === 'battle') {
        this.page.set('round');
      }
    });
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

  /** Open a help topic and close the popup. */
  protected help(topic: string): void {
    this.tutorial.open(topic);
    this.tools.dismiss();
  }

  /** Open a page from the popup "Mehr". */
  protected openMore(page: Page): void {
    this.open(page);
    this.tools.dismiss();
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
    const here = this.barPage();
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
