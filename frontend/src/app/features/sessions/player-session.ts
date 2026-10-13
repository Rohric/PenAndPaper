import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';

import { readError } from '../../core/api-error';
import { PlayerCharacter } from '../../core/models';
import { Message, Note, PlayerBattle, PlayerView, Roll, RollOrder, Session } from '../../core/session-models';
import { Icon, IconName } from '../../shared/icon';
import { SidePanel } from '../../shared/side-panel';
import { TutorialButton } from '../../shared/tutorial-button';
import { CharacterSheet, RollWish } from '../characters/character-sheet';
import { CharacterService } from '../characters/character.service';
import { DiceRoll } from './dice-roll';
import { NoteDetail } from './note-detail';
import { PlayerBattlePanel } from './player-battle';
import { PlayerPanels } from './player-panels';
import { RollPanel } from './roll-panel';
import { SessionNotes } from './session-notes';
import { SessionThread } from './session-thread';
import { SessionService } from './session.service';

type Tab = 'character' | 'roll' | 'battle' | 'quests' | 'glossary' | 'notes' | 'messages' | 'group';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'character', label: 'Charakter', icon: 'sheet' },
  { id: 'roll', label: 'Würfeln', icon: 'dice' },
  { id: 'battle', label: 'Kampf', icon: 'sword' },
  { id: 'quests', label: 'Quests', icon: 'quest' },
  { id: 'glossary', label: 'Glossar', icon: 'book' },
  { id: 'notes', label: 'Notizen', icon: 'note' },
  { id: 'messages', label: 'Nachrichten', icon: 'mail' },
  { id: 'group', label: 'Gruppe', icon: 'group' },
];
const REFRESH_MS = 5000;

/**
 * A session as a player sees it: the own character with its rolls, the battle the group fights,
 * the shared quests, the glossary, the notes, the secret messages of the game master and the group.
 */
@Component({
  selector: 'app-player-session',
  imports: [
    RouterLink, Icon, SidePanel, TutorialButton, CharacterSheet, DiceRoll, NoteDetail, PlayerBattlePanel, PlayerPanels, RollPanel,
    SessionNotes, SessionThread,
  ],
  templateUrl: './player-session.html',
})
export class PlayerSession {
  private readonly api = inject(SessionService);
  private readonly characterApi = inject(CharacterService);

  /** From the URL: /player/sessions/:sessionId */
  readonly sessionId = input.required<string>();

  protected readonly tabs = TABS;
  protected readonly tab = signal<Tab>('character');
  protected readonly view = signal<PlayerView | null>(null);
  protected readonly notes = signal<Note[]>([]);
  protected readonly messages = signal<Message[]>([]);
  /** The own character that plays in this session. */
  protected readonly character = signal<PlayerCharacter | null>(null);
  protected readonly lastRoll = signal<Roll | null>(null);
  /** The latest rolls of the whole group; secret rolls of the game master are not among them. */
  protected readonly rolls = signal<Roll[]>([]);
  /** The own character as the only one the player rolls for. */
  protected readonly own = computed(() => {
    const character = this.character();
    return character ? [character] : [];
  });
  /** The battle the session fights right now. */
  protected readonly battle = signal<PlayerBattle | null>(null);
  /** What the tab of the battle says: whether it runs, and whether the player has to act. */
  protected readonly battleHint = computed(() => this.hintFor(this.battle()));
  /** The note in the window at the side: an id, null for a new note, undefined when the window is closed. */
  protected readonly noteId = signal<number | null | undefined>(undefined);
  protected readonly openNote = computed(() => this.notes().find((note) => note.id === this.noteId()) ?? null);
  protected readonly error = signal('');
  protected readonly unread = computed(() => this.messages().filter((message) => message.from_gm && !message.read).length);
  protected readonly id = computed(() => Number(this.sessionId()));

  constructor() {
    effect(() => this.refresh(this.id()));
    const timer = setInterval(() => this.refresh(this.id()), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Open a tab; opening the messages marks them as read. */
  protected open(tab: Tab): void {
    this.tab.set(tab);
    const character = this.character();
    if (tab === 'messages' && character && this.unread()) {
      this.run(this.api.markRead(this.id(), character.id), () => this.refresh(this.id()));
    }
  }

  /** Roll a check on a skill or a talent of the own character. */
  protected roll(wish: RollWish): void {
    this.order({ character: this.character()?.id ?? null, who: '', label: wish.label, value: wish.value, sides: 100, count: 1, secret: false });
  }

  /** Roll what was asked for and show it. */
  protected order(order: RollOrder): void {
    this.run(this.api.roll(this.id(), order), (roll) => {
      this.lastRoll.set(roll);
      this.refresh(this.id());
    });
  }

  /** Answer the game master in the secret thread. */
  protected send(text: string): void {
    const character = this.character();
    if (character) {
      this.run(this.api.sendMessage(this.id(), character.id, text), () => this.refresh(this.id()));
    }
  }

  protected addNote(note: Partial<Note>): void {
    this.run(this.api.addNote(this.id(), note), () => this.refresh(this.id()));
    this.noteId.set(undefined);
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

  /** Load again what changes while the group plays. */
  private refresh(id: number): void {
    const parts = {
      view: this.api.playerView(id),
      notes: this.api.notes(id),
      messages: this.api.messages(id),
      rolls: this.api.rolls(id),
      battle: this.api.playerBattle(id),
      sessions: this.api.mine(),
      characters: this.characterApi.list<PlayerCharacter>('player-characters'),
    };
    this.run(forkJoin(parts), (data) => this.fill(id, data));
  }

  private fill(
    id: number,
    data: {
      view: PlayerView; notes: Note[]; messages: Message[]; rolls: Roll[]; battle: PlayerBattle | null; sessions: Session[];
      characters: PlayerCharacter[];
    },
  ): void {
    const inSession = data.sessions.find((session) => session.id === id)?.characters ?? [];
    this.view.set(data.view);
    this.notes.set(data.notes);
    this.messages.set(data.messages);
    this.rolls.set(data.rolls);
    this.battle.set(data.battle);
    this.character.set(data.characters.find((character) => inSession.includes(character.id)) ?? null);
    this.error.set('');
  }

  private hintFor(battle: PlayerBattle | null): string {
    const own = battle?.combatants.find((combatant) => combatant.mine);
    if (!battle || !own) {
      return battle ? 'läuft' : '';
    }
    if (battle.pending) {
      return battle.pending.stage === 'parry' && battle.pending.defender === own.id ? 'Parade?' : 'läuft';
    }
    return battle.current === own.id && !own.out ? 'du bist dran' : 'läuft';
  }

  private run<T>(request: Observable<T>, then: (value: T) => void): void {
    request.subscribe({ next: then, error: (e: unknown) => this.error.set(readError(e)) });
  }
}
