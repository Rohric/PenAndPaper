import { Component, DestroyRef, TemplateRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { readError } from '../../core/api-error';
import { EntryKind, EntryLink, EntryRef, Option, Scene, Trivia, itemDamage } from '../../core/models';
import { Battle, ItemGift, Note, PlayerView, ROLL_RESULTS, SessionEntryKind } from '../../core/session-models';
import { Icon, IconName } from '../../shared/icon';
import { IdSelect } from '../../shared/id-select';
import { SidePanel } from '../../shared/side-panel';
import { timeAgo } from '../../shared/time-ago';
import { TutorialButton } from '../../shared/tutorial-button';
import { CharacterSheet } from '../characters/character-sheet';
import { EntryPeek } from '../worlds/entry-peek';
import { Eyes, isItem } from '../worlds/entry-views';
import { GLOSSARY_SECTIONS, GlossaryTiles, SectionId } from '../worlds/glossary-tiles';
import { Carrier } from '../worlds/item-rows';
import { SceneThread } from '../worlds/scene-thread';
import { WorldSearch } from '../worlds/world-search';
import { WorldStore } from '../worlds/world-store';
import { BattleView } from './battle-view';
import { ChapterCloseForm } from './chapter-close-form';
import { ChatThread, groupBubbles } from './chat-thread';
import { CockpitTools, Tool } from './cockpit-tools';
import { CharacterPanel } from './character-tile';
import { ItemGiftForm, ItemTemplate } from './item-gift-form';
import { MasterTable } from './master-table';
import { NoteDetail } from './note-detail';
import { PlayerPanels } from './player-panels';
import { QuestBoard } from './quest-board';
import { RollPanel } from './roll-panel';
import { SessionArchive } from './session-archive';
import { SessionEntryActions } from './session-entry-actions';
import { SessionGroup } from './session-group';
import { SessionMembers } from './session-members';
import { SessionNotes } from './session-notes';
import { SessionRolls } from './session-rolls';
import { SESSION_KINDS, SessionStore } from './session-store';
import { SessionStory } from './session-story';
import { SessionThread } from './session-thread';
import { SessionService } from './session.service';
import { ToolBar } from './tool-bar';

const REFRESH_MS = 5000;
const SEEN_KEY = 'pnp.notes.seen.';
const CHAT_KEY = 'pnp.chat.seen.gm.';

/** What the window at the side shows. Only one is open at a time. */
type Panel =
  | { kind: CharacterPanel; characterId: number }
  | { kind: 'note'; noteId: number | null }
  | { kind: 'archive' }
  | { kind: 'rolls' }
  | { kind: 'roll' }
  | { kind: 'level' }
  | { kind: 'members' }
  | { kind: 'chat' };

/** What fills the page between the two bars. */
type View = 'story' | 'master' | 'quests' | 'glossary' | 'notes' | 'players';

/** The views in the bar on top. */
const VIEWS: { id: View; label: string; icon: IconName; tone?: string }[] = [
  { id: 'story', label: 'Story', icon: 'book', tone: 'kind--scenes' },
  { id: 'master', label: 'Master', icon: 'flag' },
  { id: 'quests', label: 'Quests', icon: 'quest', tone: 'kind--quests' },
  { id: 'glossary', label: 'Glossar', icon: 'search' },
  { id: 'notes', label: 'Notizen', icon: 'note' },
  { id: 'players', label: 'Spieleransicht', icon: 'eye' },
];

/** The kinds of pins in the bar at the bottom, in this order. */
const PIN_KINDS: { kind: SessionEntryKind; word: string; icon: IconName }[] = [
  { kind: 'scene', word: 'Szenen', icon: 'book' },
  { kind: 'quest', word: 'Quests', icon: 'quest' },
  { kind: 'event', word: 'Ereignisse', icon: 'flag' },
  { kind: 'location', word: 'Orte', icon: 'pin' },
  { kind: 'npc', word: 'Figuren', icon: 'sheet' },
  { kind: 'trivia', word: 'Wissen', icon: 'note' },
];

const RECENT = 12;

const PANEL_TITLES: Record<Panel['kind'], string> = {
  sheet: 'Charakterbogen',
  messages: 'Geheime Nachrichten',
  item: 'Gegenstand übergeben',
  note: 'Notiz',
  archive: 'Archiv',
  rolls: 'Letzte Würfe',
  roll: 'Würfeln',
  level: 'Kapitel abschließen',
  members: 'Gruppe bearbeiten',
  chat: 'Chat der Gruppe',
};

/** How the kinds of a session are called among the entries of a world. */
const WORLD_KINDS: Record<SessionEntryKind, EntryKind> = {
  scene: 'scenes',
  quest: 'quests',
  event: 'events',
  location: 'locations',
  npc: 'npcs',
  trivia: 'trivia',
};

/**
 * The cockpit of the game master for a running session. Two bars: on top the views (story, master mode,
 * quests, glossary, notes, view of the players) with the search; at the bottom the tools as symbols with word
 * and number, which open popups above themselves. The middle of the bottom bar changes with the view.
 * Everything else opens in a window at the side. It is built for the desktop only.
 */
@Component({
  selector: 'app-session-cockpit',
  imports: [
    RouterLink, Icon, IdSelect, SidePanel, TutorialButton, CharacterSheet, EntryPeek, SceneThread, BattleView,
    ChapterCloseForm, ChatThread, GlossaryTiles, ItemGiftForm, NoteDetail, PlayerPanels, QuestBoard, RollPanel, SessionArchive, SessionEntryActions,
    SessionGroup, SessionMembers, SessionNotes, SessionRolls, SessionStory, SessionThread, WorldSearch, MasterTable, ToolBar,
  ],
  providers: [WorldStore, SessionStore, CockpitTools],
  templateUrl: './session-cockpit.html',
  styleUrl: './session-cockpit.scss',
})
export class SessionCockpit {
  protected readonly world = inject(WorldStore);
  protected readonly store = inject(SessionStore);
  private readonly api = inject(SessionService);
  private readonly tools = inject(CockpitTools);

  /** From the URL: /gm/sessions/:sessionId */
  readonly sessionId = input.required<string>();

  protected readonly views = VIEWS;
  protected readonly ago = timeAgo;
  protected readonly view = signal<View>('story');
  protected readonly panel = signal<Panel | null>(null);
  protected readonly sceneId = signal<number | null>(null);
  protected readonly battleId = signal<number | null>(null);
  /** What the players see; it is loaded when the game master switches to their view. */
  protected readonly playerView = signal<PlayerView | null>(null);
  protected readonly error = signal('');
  protected readonly results = ROLL_RESULTS;
  protected readonly sections = GLOSSARY_SECTIONS;
  /** The part of the glossary that is open. */
  protected readonly sectionId = signal<SectionId>('locations');
  protected readonly section = computed(() => GLOSSARY_SECTIONS.find((part) => part.id === this.sectionId()) ?? GLOSSARY_SECTIONS[0]);
  /** The characters of the group as carriers of items, so the glossary lists their equipment. */
  protected readonly carriers = computed<Carrier[]>(() =>
    this.store.characters().map((character) => ({ id: character.id, name: character.name, isPlayer: true, inventory: character.inventory })),
  );

  protected readonly chapterId = computed(() => this.store.session()?.chapter ?? this.world.chapters()[0]?.id ?? null);
  protected readonly chapterOptions = computed<Option[]>(() =>
    this.world.chapters().map((chapter) => ({ id: chapter.id, label: `Kapitel ${chapter.number} · ${chapter.name}` })),
  );
  protected readonly scenes = computed(() => this.world.scenesOf(this.chapterId() ?? 0));
  protected readonly scene = computed(() => this.world.scenes().find((scene) => scene.id === this.sceneId()) ?? null);
  protected readonly playedScenes = computed(() =>
    this.store.entries().filter((entry) => entry.kind === 'scene' && entry.done).map((entry) => entry.entry_id),
  );
  protected readonly pins = computed(() =>
    this.store.pinned().map((pin) => ({ session: pin.kind, kind: WORLD_KINDS[pin.kind], id: pin.entry_id, label: this.nameOf(pin.kind, pin.entry_id) })),
  );
  /** What the players see of the entry in the window at the side; null for an entry a session does not track. */
  protected readonly eyes = computed<Eyes | null>(() => {
    const peek = this.world.peek();
    const kind = peek && SESSION_KINDS[peek.kind];
    if (!peek || !kind) {
      return null;
    }
    const state = this.store.state(kind, peek.id);
    return { revealed: !!state?.revealed, shown: state?.shown ?? [], known: state?.known ?? [], steps: state?.steps ?? [] };
  });
  protected readonly lastRoll = computed(() => this.store.rolls()[0] ?? null);

  // What the window at the side needs.
  protected readonly panelTitle = computed(() => PANEL_TITLES[this.panel()?.kind ?? 'note']);
  protected readonly panelCharacter = computed(() => {
    const panel = this.panel();
    const id = panel && 'characterId' in panel ? panel.characterId : null;
    return this.store.characters().find((character) => character.id === id) ?? null;
  });
  protected readonly panelNote = computed(() => {
    const panel = this.panel();
    const id = panel?.kind === 'note' ? panel.noteId : null;
    return this.store.notes().find((note) => note.id === id) ?? null;
  });
  protected readonly thread = computed(() => this.store.messages().filter((m) => m.character === this.panelCharacter()?.id));
  /** Prepared items: the items of the world; those that belong to the opened scene come first. */
  protected readonly items = computed<ItemTemplate[]>(() =>
    this.world
      .trivia()
      .filter(isItem)
      .map((entry) => ({
        id: entry.id, name: entry.name, description: entry.description, here: this.inScene(entry), ...itemDamage(entry),
      }))
      .sort((a, b) => Number(b.here) - Number(a.here)),
  );

  /** Notes and comments in the notepad of the group, and how many of them the game master has seen. */
  private readonly groupActivity = computed(() =>
    this.store.notes().filter((note) => note.shared).reduce((sum, note) => sum + 1 + note.comments.length, 0),
  );
  private readonly seen = signal(0);
  protected readonly fresh = computed(() => Math.max(0, this.groupActivity() - this.seen()));
  /** The id of the last chat message the game master has read. */
  private readonly chatSeen = signal(0);
  protected readonly chatUnread = computed(() => this.store.chat().filter((m) => !m.mine && m.id > this.chatSeen()).length);
  protected readonly chatBubbles = computed(() => groupBubbles(this.store.chat()));
  /** The notes of the notepad of the group. */
  protected readonly groupNotes = computed<Note[]>(() => this.store.notes().filter((note) => note.shared));
  /** The secret messages of the players that nobody has read yet. */
  private readonly unreadMessages = computed(() => this.store.characters().reduce((sum, character) => sum + this.store.unread(character.id), 0));
  /** Entries of the world that were written or changed last, newest first. */
  protected readonly recent = computed(() => {
    const world = this.world;
    const items: { ref: EntryRef; name: string; created: string; when: string }[] = [
      ...world.locations().map((entry) => ({ ref: { kind: 'locations', id: entry.id } as EntryRef, name: entry.name, created: entry.created_at, when: entry.updated_at })),
      ...world.npcs().map((entry) => ({ ref: { kind: 'npcs', id: entry.npc } as EntryRef, name: entry.name, created: entry.created_at, when: entry.updated_at })),
      ...world.quests().map((entry) => ({ ref: { kind: 'quests', id: entry.id } as EntryRef, name: entry.name, created: entry.created_at, when: entry.updated_at })),
      ...world.events().map((entry) => ({ ref: { kind: 'events', id: entry.id } as EntryRef, name: entry.name, created: entry.created_at, when: entry.updated_at })),
      ...world.trivia().map((entry) => ({ ref: { kind: 'trivia', id: entry.id } as EntryRef, name: entry.name, created: entry.created_at, when: entry.updated_at })),
    ];
    return items
      .sort((a, b) => b.when.localeCompare(a.when))
      .slice(0, RECENT)
      .map((item) => ({ ...item, fresh: item.created === item.when }));
  });
  /** What the players were shown last: the entries that are revealed, the newest marks first. */
  protected readonly lastShared = computed(() =>
    this.store
      .entries()
      .filter((entry) => entry.revealed)
      .sort((a, b) => b.id - a.id)
      .slice(0, RECENT)
      .map((entry) => ({ ref: { kind: WORLD_KINDS[entry.kind], id: entry.entry_id } as EntryRef, name: this.nameOf(entry.kind, entry.entry_id) })),
  );

  // The popups behind the symbols that belong to the whole cockpit.
  private readonly groupPop = viewChild<TemplateRef<unknown>>('groupPop');
  private readonly pinPop = viewChild<TemplateRef<unknown>>('pinPop');
  private readonly rollPop = viewChild<TemplateRef<unknown>>('rollPop');
  private readonly recentPop = viewChild<TemplateRef<unknown>>('recentPop');
  private readonly sharedPop = viewChild<TemplateRef<unknown>>('sharedPop');
  private readonly groupNotesPop = viewChild<TemplateRef<unknown>>('groupNotesPop');

  /** The symbols that are there in every view. */
  private readonly alwaysTools = computed<Tool[]>(() => [
    { id: 'group', word: 'Gruppe', icon: 'group', tone: 'kind--npcs', count: this.unreadMessages(), popup: this.groupPop(), popupTitle: 'Gruppe', wide: true },
    { id: 'roll', word: 'Würfeln', icon: 'dice', click: () => this.openPanel({ kind: 'roll' }) },
    { id: 'chat', word: 'Chat', icon: 'speech', count: this.chatUnread(), click: () => this.openPanel({ kind: 'chat' }) },
    { id: 'fight', word: 'Kampf', icon: 'sword', pressed: this.battleId() !== null, click: () => this.openBattle() },
    { id: 'archive', word: 'Archiv', icon: 'archive', click: () => this.openPanel({ kind: 'archive' }) },
    { id: 'level', word: 'Kapitel abschließen', icon: 'flag', click: () => this.openPanel({ kind: 'level' }) },
  ]);
  /** The symbols on the right: one for every kind of pin that exists, and the last roll. */
  private readonly rightTools = computed<Tool[]>(() => {
    const pins: Tool[] = PIN_KINDS.map((part) => ({
      id: `pins-${part.kind}`, word: part.word, icon: part.icon, tone: `kind--${WORLD_KINDS[part.kind]}`,
      count: this.pins().filter((pin) => pin.session === part.kind).length, data: part.kind, popup: this.pinPop(), popupTitle: `Stecknadeln · ${part.word}`,
    })).filter((tool) => tool.count);
    const roll = this.lastRoll();
    return [...pins, { id: 'last-roll', word: 'Letzter Wurf', icon: 'dice', count: roll?.rolled ?? roll?.total ?? null, popup: this.rollPop(), popupTitle: 'Letzter Wurf' }];
  });
  /** The symbols of the views the cockpit draws itself; the other views and the battle report their own. */
  private readonly viewTools = computed<Tool[]>(() => {
    if (this.battleId() !== null) {
      return [];
    }
    switch (this.view()) {
      case 'glossary':
        return [
          { id: 'glossary-recent', word: 'Zuletzt', icon: 'clock', popup: this.recentPop(), popupTitle: 'Zuletzt angelegt und bearbeitet' },
          ...this.sections.map((part): Tool => ({
            id: `glossary-${part.id}`, word: part.label, icon: part.icon, tone: `kind--${part.id}`, pressed: part.id === this.sectionId(), click: () => this.sectionId.set(part.id),
          })),
        ];
      case 'notes':
        return [
          { id: 'notes-new', word: 'Neue Notiz', icon: 'plus', click: () => this.openPanel({ kind: 'note', noteId: null }) },
          { id: 'notes-group', word: 'Gruppenblock', icon: 'group', count: this.fresh(), popup: this.groupNotesPop(), popupTitle: 'Gruppenblock' },
        ];
      case 'players':
        return [
          { id: 'players-reload', word: 'Neu laden', icon: 'undo', click: () => this.loadPlayerView() },
          { id: 'players-shared', word: 'Zuletzt geteilt', icon: 'eye', popup: this.sharedPop(), popupTitle: 'Zuletzt geteilt' },
        ];
      default:
        return [];
    }
  });

  constructor() {
    effect(() => this.store.load(Number(this.sessionId())));
    effect(() => this.seen.set(Number(localStorage.getItem(SEEN_KEY + this.sessionId())) || 0));
    effect(() => this.chatSeen.set(Number(localStorage.getItem(CHAT_KEY + this.sessionId())) || 0));
    // While the chat is open, everything in it counts as read.
    effect(() => {
      const last = this.store.chat().at(-1)?.id ?? 0;
      if (this.panel()?.kind === 'chat' && last > this.chatSeen()) {
        this.chatSeen.set(last);
        localStorage.setItem(CHAT_KEY + this.sessionId(), String(last));
      }
    });
    // Load the world of the session once the session is known.
    effect(() => {
      const world = this.store.session()?.world;
      if (world && this.world.worldId() !== world) {
        this.world.load(world);
      }
    });
    // Only one window at the side: looking an entry up closes the other one.
    effect(() => {
      if (this.world.peek()) {
        this.panel.set(null);
        this.tools.dismiss();
      }
    });
    effect(() => this.world.activeScene.set(this.sceneId()));
    this.tools.provide('always', this.alwaysTools);
    this.tools.provide('view', this.viewTools);
    this.tools.provide('right', this.rightTools);
    // While the notes are open, everything in the notepad of the group counts as seen.
    effect(() => {
      if (this.view() === 'notes') {
        this.markSeen(this.groupActivity());
      }
    });
    // Links to scenes stay in the cockpit instead of leading to the writing tool.
    this.world.openScene = (sceneId) => this.sceneId.set(sceneId);
    // Quests are shown as this session has them, without changing the world.
    this.world.questChanges = (questId) => this.store.state('quest', questId)?.changes ?? {};
    const timer = setInterval(() => this.store.refresh(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Switch to a view; a battle that is open is left. */
  protected show(view: View): void {
    this.battleId.set(null);
    this.view.set(view);
    if (view === 'players') {
      this.loadPlayerView();
    }
  }

  /** Open a window at the side; opening the messages of a character marks its answers as read. */
  protected openPanel(panel: Panel): void {
    this.world.peek.set(null);
    this.tools.dismiss();
    this.panel.set(panel);
    if (panel.kind === 'messages' && this.store.unread(panel.characterId)) {
      this.store.markRead(panel.characterId);
    }
  }

  /** The pins of one kind, for the popup behind its symbol. */
  protected pinsOf(kind: unknown): EntryLink[] {
    return this.pins().filter((pin) => pin.session === kind);
  }

  /** The eye of a tile was clicked: show the entry to the players or hide it, without opening it. */
  protected toggleShared(ref: EntryRef): void {
    const kind = SESSION_KINDS[ref.kind];
    if (kind) {
      this.store.toggle(kind, ref.id, 'revealed');
    }
  }

  /** Whether the players see an entry of the world; the eyes of the tiles ask this. */
  protected readonly isShared = (ref: EntryRef): boolean => {
    const kind = SESSION_KINDS[ref.kind];
    return !!kind && !!this.store.state(kind, ref.id)?.revealed;
  };

  /** An eye in the window at the side was clicked: the name, a part, a point of the checklist or a piece of knowledge. */
  protected onEye(part: string): void {
    const peek = this.world.peek();
    const kind = peek && SESSION_KINDS[peek.kind];
    if (!peek || !kind) {
      return;
    }
    if (part === 'name') {
      this.store.toggle(kind, peek.id, 'revealed');
    } else if (part.startsWith('known:')) {
      this.store.toggleIn(kind, peek.id, 'known', Number(part.slice('known:'.length)));
    } else {
      this.store.toggleShown(kind, peek.id, part);
    }
  }

  /** A point of the checklist in the window at the side was ticked. */
  protected onStep(position: number): void {
    const peek = this.world.peek();
    if (peek?.kind === 'quests') {
      this.store.toggleIn('quest', peek.id, 'steps', position);
    }
  }

  /** Open a pinned entry: a scene in the story, everything else in the window at the side. */
  protected openPin(pin: EntryLink): void {
    if (pin.kind === 'scenes') {
      this.show('story');
      this.sceneId.set(pin.id);
    } else {
      this.world.peek.set({ kind: pin.kind, id: pin.id });
    }
  }

  /** Give all characters their inspiration points back, after asking. */
  protected newEvening(): void {
    if (confirm('Neuer Abend: Alle Charaktere der Gruppe bekommen ihre Geistesblitzpunkte zurück. Weiter?')) {
      this.store.refillInspiration();
    }
  }

  /** Hand an item to the character whose window is open. */
  protected give(item: Omit<ItemGift, 'character'>): void {
    const character = this.panelCharacter();
    if (character) {
      this.store.giveItem({ ...item, character: character.id });
      this.panel.set(null);
    }
  }

  /**
   * Open the battle of the session. The button on top continues the running one or starts one with the group.
   * The button in a scene also brings the characters of that scene into the fight.
   */
  protected openBattle(scene: Scene | null = null): void {
    this.api.battles(Number(this.sessionId())).subscribe({
      next: (battles) => {
        const running = battles.find((battle) => !battle.finished);
        return running ? this.joinBattle(running, scene) : this.startBattle(scene);
      },
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Close the chapter with the bonus points of every character. */
  protected closeChapter(points: Record<number, number>): void {
    this.store.level(points);
    this.panel.set(null);
  }

  /** Whether an item belongs to the opened scene: to the scene itself, its place, its characters or its quests. */
  private inScene(item: Trivia): boolean {
    const scene = this.scene();
    if (!scene) {
      return false;
    }
    const linked = item.npcs.some((npc) => scene.npcs.includes(npc)) || item.quests.some((quest) => scene.quests.includes(quest));
    return scene.trivia.includes(item.id) || (scene.location !== null && item.locations.includes(scene.location)) || linked;
  }

  private loadPlayerView(): void {
    this.api.playerView(Number(this.sessionId())).subscribe({
      next: (view) => this.playerView.set(view),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  private markSeen(activity: number): void {
    this.seen.set(activity);
    localStorage.setItem(SEEN_KEY + this.sessionId(), String(activity));
  }

  /** Open a running battle; the characters of the scene that do not fight yet join it first. */
  private joinBattle(battle: Battle, scene: Scene | null): void {
    const fighting = new Set(battle.combatants.map((combatant) => combatant.npc));
    const joining = (scene?.npcs ?? []).filter((npc) => !fighting.has(npc)).map((npc) => this.api.addCombatant(battle.id, { npc }));
    if (!joining.length) {
      this.battleId.set(battle.id);
      return;
    }
    forkJoin(joining).subscribe({
      next: () => this.battleId.set(battle.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Start a battle with the group; a scene brings its characters along. */
  private startBattle(scene: Scene | null): void {
    const name = scene ? `Kampf: ${scene.name}` : 'Kampf';
    this.api.createBattle(name, Number(this.sessionId()), scene?.id ?? null).subscribe({
      next: (battle) => this.battleId.set(battle.id),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  private nameOf(kind: SessionEntryKind, id: number): string {
    if (kind === 'npc') {
      return this.world.npcs().find((link) => link.npc === id)?.name ?? 'Figur';
    }
    const lists = {
      scene: this.world.scenes(), quest: this.world.quests(), event: this.world.events(),
      location: this.world.locations(), trivia: this.world.trivia(),
    };
    return lists[kind].find((entry) => entry.id === id)?.name ?? 'Eintrag';
  }
}
