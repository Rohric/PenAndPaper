import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { readError } from '../../core/api-error';
import { BATTLE_MS, Poller, ROUND_MS } from '../../core/poll';
import { sameJson } from '../../core/same';
import { PlayerCharacter, TALENTS, Talent } from '../../core/models';
import { inspirationLeft, inspirationPoints } from '../../core/rules';
import {
  ChatMessage, Message, Note, PlayerBattle, PlayerState, PlayerView, QuestLog, QuestStatus, Roll, RollOrder,
} from '../../core/session-models';
import { Icon, IconName } from '../../components/basic/icon';
import { Portrait } from '../../components/basic/portrait';
import { PointBar } from '../../components/character/point-bar';
import { SideWindow } from '../../components/window/side-window';
import { NavService } from '../../global/frame/nav.service';
import { ToastService } from '../../global/toast/toast.service';
import { CharacterEditor, EditorSection } from '../../components/character/character-editor';
import { CharacterSheet, RollWish } from '../../components/character/character-sheet';
import { PlayerTools } from '../../global/tool-bar/player-tools';
import { Tool } from '../../global/tool-bar/tools.service';
import { ChatThread, groupBubbles } from '../../components/play/chat-thread';
import { DiceRoll } from '../../components/play/dice-roll';
import { NoteDetail } from '../../components/play/note-detail';
import { FeedItem, FeedTarget, Snapshot, feedOf, snapshotOf } from './player-feed';
import { PlayerBattlePanel } from './player-battle';
import { PlayerPanels } from '../../components/play/player-panels';
import { RollPanel } from '../../components/play/roll-panel';
import { SessionNotes } from '../../components/play/session-notes';
import { SessionRolls } from '../../components/play/session-rolls';
import { SessionThread } from '../../components/play/session-thread';
import { SessionService } from '../../core/session.service';

/** Every page of the session. The main row of the bar leads to the main ones; the round has three side pages in the row above. */
type Page = 'round' | 'character' | 'roll' | 'quests' | 'chat' | 'glossary' | 'notes' | 'group' | 'battle';

/** The side pages of the round: they stand in the row above the main row while the round is open. */
const ROUND_PAGES: { id: Page; label: string; icon: IconName }[] = [
  { id: 'glossary', label: 'Glossar', icon: 'book' },
  { id: 'notes', label: 'Notizen', icon: 'note' },
  { id: 'group', label: 'Gruppe', icon: 'group' },
];
const FEED_KEY = 'pnp.feed.';
const CHAT_KEY = 'pnp.chat.seen.';
const TOASTED = 3;

/**
 * A session as a player sees it, built for the phone: the round with what is new, the own character
 * with its rolls, the quest log and the chat in the bar at the bottom; the glossary, the notes and the group
 * belong to the round and stand in the row above. Short messages tell what changed while the group plays.
 */
@Component({
  selector: 'app-player-session',
  imports: [
    NgTemplateOutlet, Icon, Portrait, PointBar, SideWindow, CharacterEditor, CharacterSheet, ChatThread, DiceRoll,
    NoteDetail, PlayerBattlePanel, PlayerPanels, RollPanel, SessionNotes, SessionRolls, SessionThread,
  ],
  templateUrl: './player-session.html',
  styleUrl: './player-session.scss',
})
export class PlayerSession {
  private readonly api = inject(SessionService);
  private readonly toast = inject(ToastService);
  private readonly tools = inject(PlayerTools);

  /** From the URL: /player/sessions/:sessionId */
  readonly sessionId = input.required<string>();

  protected readonly page = signal<Page>('round');
  protected readonly channel = signal<'group' | 'gm'>('group');
  // What the state address fills only fires when its data really changed.
  protected readonly data = signal<PlayerView | null>(null, { equal: sameJson });
  protected readonly notes = signal<Note[]>([], { equal: sameJson });
  protected readonly messages = signal<Message[]>([], { equal: sameJson });
  protected readonly chat = signal<ChatMessage[]>([], { equal: sameJson });
  /** The own character that plays in this session. */
  protected readonly character = signal<PlayerCharacter | null>(null, { equal: sameJson });
  protected readonly lastRoll = signal<Roll | null>(null);
  /** The latest rolls of the whole group; secret rolls of the game master are not among them. */
  protected readonly rolls = signal<Roll[]>([], { equal: sameJson });
  protected readonly battle = signal<PlayerBattle | null>(null, { equal: sameJson });
  protected readonly offline = signal(false);
  protected readonly error = signal('');
  /** The note in the window at the side: an id, null for a new note, undefined when the window is closed. */
  protected readonly noteId = signal<number | null | undefined>(undefined);
  /** The character in the editor; a copy from the moment it was opened, so the reloads do not wipe the changes. */
  protected readonly editing = signal<PlayerCharacter | null>(null);
  protected readonly editSection = signal<EditorSection>('profile');
  protected readonly editDirty = signal(false);

  /** The tag of the last state; the server answers without content while it is still the same. */
  private tag: string | null = null;
  /** Asks every few seconds, quicker while the group fights. */
  private readonly poller = new Poller(() => this.poll(), () => (this.battle() ? BATTLE_MS : ROUND_MS));
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
  /** The place of a page in the main row: rolling belongs to the character, the side pages to the round. */
  private readonly barPage = computed(() => {
    const page = this.page();
    if (ROUND_PAGES.some((item) => item.id === page)) {
      return 'round';
    }
    return page === 'roll' ? 'character' : page;
  });
  private readonly rollsPop = viewChild<TemplateRef<unknown>>('rollsPop');
  private readonly sparkPop = viewChild<TemplateRef<unknown>>('sparkPop');
  private readonly logPop = viewChild<TemplateRef<unknown>>('logPop');
  protected readonly feed = computed(() => feedOf(this.seen(), this.current()));
  protected readonly freshQuests = computed(() => this.feed().flatMap((item) => (item.quest !== undefined ? [item.quest] : [])));
  protected readonly recentRolls = computed(() => this.rolls().slice(0, 5));
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
    return items;
  });
  /** The tutorial that explains the open page. */
  private readonly topic = computed(() => [this.page() === 'battle' ? 'rules#initiative' : this.page() === 'character' || this.page() === 'roll' ? 'rules#check' : 'my-sessions']);
  /** The side pages of the round as switches in the row above the main row. */
  private readonly roundPages = computed<Tool[]>(() =>
    ROUND_PAGES.map((item) => ({ id: item.id, word: item.label, icon: item.icon, pressed: this.page() === item.id, click: () => this.open(item.id) })),
  );
  /** The row of the open page above the main row; the help of the page stands at its end. */
  private readonly pageTools = computed<Tool[]>(() => {
    const help = (topic: string, step: number | string = 0) => this.tools.help(topic, step);
    switch (this.page()) {
      case 'round':
        return [
          { id: 'seen', word: 'Gesehen', icon: 'check', disabled: !this.feed().length, click: () => this.markSeen() },
          { id: 'rolls', word: 'Würfe', icon: 'dice', popup: this.rollsPop(), popupTitle: 'Letzte Würfe' },
          ...this.roundPages(),
          help('my-sessions'),
        ];
      case 'notes':
        return [{ id: 'note-new', word: 'Neu', icon: 'plus', click: () => this.noteId.set(null) }, ...this.roundPages(), help('my-sessions', 6)];
      case 'glossary':
        return [...this.roundPages(), help('my-sessions', 5)];
      case 'group':
        return [...this.roundPages(), help('my-sessions')];
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
      default:
        return [];
    }
  });

  constructor() {
    this.tools.provide('always', this.mainTools);
    this.tools.provide('view', this.pageTools);
    const nav = inject(NavService);
    nav.topic.provide(this.topic);
    // When the fight is over the page of the fight has nothing left to show.
    effect(() => {
      if (!this.battle() && this.page() === 'battle') {
        this.page.set('round');
      }
    });
    effect(() => {
      this.loadSeen(this.id());
      this.tag = null;
      untracked(() => this.poller.now());
    });
    // While the group chat is open, everything in it counts as read.
    effect(() => {
      if (this.page() === 'chat' && this.channel() === 'group') {
        this.markChatSeen();
      }
    });
    this.poller.start(false);
  }

  /** Open a page of the bar; opening the secret messages marks them as read. */
  protected open(page: Page, channel?: 'group' | 'gm'): void {
    this.page.set(page);
    if (channel) {
      this.channel.set(channel);
    }
    const character = this.character();
    if (page === 'chat' && this.channel() === 'gm' && character && this.unread()) {
      this.run(this.api.markRead(this.id(), character.id), () => this.reload());
    }
  }

  /** Go to the place a piece of news is about. */
  protected go(target: FeedTarget): void {
    this.open(target);
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
      this.reload();
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
    this.reload();
  }

  /** The character was deleted. */
  protected editDeleted(): void {
    this.editDirty.set(false);
    this.editing.set(null);
    this.reload();
  }

  /** Save what the group wrote into the log of a quest. */
  protected saveLog(change: { quest: number; log: QuestLog }): void {
    this.run(this.api.questLog(this.id(), change.quest, { log: change.log }), () => {
      this.toast.show('Questlog gespeichert', 'ok');
      this.reload();
    });
  }

  /** Save which points of a quest are checked. */
  protected saveSteps(change: { quest: number; steps: number[] }): void {
    this.run(this.api.questLog(this.id(), change.quest, { steps: change.steps }), () => this.reload());
  }

  /** Answer the game master in the secret thread. */
  protected send(text: string): void {
    const character = this.character();
    if (character) {
      this.run(this.api.sendMessage(this.id(), character.id, text), () => this.reload());
    }
  }

  /** Write into the chat of the group. */
  protected sendChat(text: string): void {
    this.run(this.api.sendChat(this.id(), text), () => this.reload());
  }

  protected addNote(note: Partial<Note>): void {
    this.run(this.api.addNote(this.id(), note), () => {
      this.toast.show('Notiz gespeichert', 'ok');
      this.reload();
    });
    this.noteId.set(undefined);
  }

  /** Make a note from a title alone, just for the player. */
  protected quickNote(title: string): void {
    this.run(this.api.addNote(this.id(), { title, text: '', shared: false }), () => {
      this.toast.show('Notiz gespeichert', 'ok');
      this.reload();
    });
  }

  protected saveNote(change: { id: number; changes: Partial<Note> }): void {
    this.run(this.api.updateNote(change.id, change.changes), () => this.reload());
  }

  protected removeNote(noteId: number): void {
    this.run(this.api.removeNote(noteId), () => this.reload());
    this.noteId.set(undefined);
  }

  protected comment(comment: { id: number; text: string }): void {
    this.run(this.api.addComment(comment.id, comment.text), () => this.reload());
  }

  /** Ask for the state at once, for example after an own action. */
  private reload(): void {
    this.poller.now();
  }

  /** Ask the state address; it answers without content while nothing has changed. A failure only shows that the connection is gone. */
  private poll(): Observable<unknown> {
    return this.api.state<PlayerState>(this.id(), this.tag).pipe(tap({ next: (state) => this.fill(state), error: () => this.offline.set(true) }));
  }

  private fill(state: PlayerState | null): void {
    this.offline.set(false);
    if (!state) {
      return;
    }
    this.tag = state.tag;
    this.data.set(state.view);
    this.notes.set(state.notes);
    this.messages.set(state.messages);
    this.chat.set(state.chat);
    this.rolls.set(state.rolls);
    this.battle.set(state.battle);
    this.character.set(state.character);
    this.error.set('');
    this.noticeNews(snapshotOf(state.view, state.notes, state.messages, state.chat, state.character));
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
      .filter((item) => item.always || item.target !== here)
      .slice(0, TOASTED)
      .forEach((item: FeedItem) => this.toast.show(item.text, item.tone ?? 'info'));
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
