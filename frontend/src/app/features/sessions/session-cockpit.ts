import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { readError } from '../../core/api-error';
import { EntryKind, EntryLink, Option, Scene, Trivia, itemDamage } from '../../core/models';
import { Battle, ItemGift, PlayerView, ROLL_RESULTS, SessionEntryKind } from '../../core/session-models';
import { Icon } from '../../shared/icon';
import { IdSelect } from '../../shared/id-select';
import { SidePanel } from '../../shared/side-panel';
import { TutorialButton } from '../../shared/tutorial-button';
import { CharacterSheet } from '../characters/character-sheet';
import { EntryPeek } from '../worlds/entry-peek';
import { isItem } from '../worlds/entry-views';
import { GLOSSARY_SECTIONS, GlossaryTiles, SectionId } from '../worlds/glossary-tiles';
import { Carrier } from '../worlds/item-rows';
import { SceneThread } from '../worlds/scene-thread';
import { WorldSearch } from '../worlds/world-search';
import { WorldStore } from '../worlds/world-store';
import { BattleView } from './battle-view';
import { ChapterCloseForm } from './chapter-close-form';
import { ChatThread, groupBubbles } from './chat-thread';
import { CharacterPanel } from './character-tile';
import { ItemGiftForm, ItemTemplate } from './item-gift-form';
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
import { SessionStore } from './session-store';
import { SessionStory } from './session-story';
import { SessionThread } from './session-thread';
import { SessionService } from './session.service';

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
type View = 'story' | 'quests' | 'notes' | 'players' | 'glossary';

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
 * The cockpit of the game master for a running session. A bar with the tools and a search on top,
 * the group as a row of tiles, below it the thread of the story beside the scene with its quests and
 * events, and a bar with pins and the last roll at the bottom. The glossary of the world, the notes
 * and the view of the players fill the page instead; everything else opens in a window at the side.
 * It is built for the desktop only.
 */
@Component({
  selector: 'app-session-cockpit',
  imports: [
    RouterLink, Icon, IdSelect, SidePanel, TutorialButton, CharacterSheet, EntryPeek, SceneThread, BattleView,
    ChapterCloseForm, ChatThread, GlossaryTiles, ItemGiftForm, NoteDetail, PlayerPanels, QuestBoard, RollPanel, SessionArchive, SessionEntryActions,
    SessionGroup, SessionMembers, SessionNotes, SessionRolls, SessionStory, SessionThread, WorldSearch,
  ],
  providers: [WorldStore, SessionStore],
  templateUrl: './session-cockpit.html',
  styleUrl: './session-cockpit.scss',
})
export class SessionCockpit {
  protected readonly world = inject(WorldStore);
  protected readonly store = inject(SessionStore);
  private readonly api = inject(SessionService);

  /** From the URL: /gm/sessions/:sessionId */
  readonly sessionId = input.required<string>();

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
  protected readonly pins = computed<EntryLink[]>(() =>
    this.store.pinned().map((pin) => ({ kind: WORLD_KINDS[pin.kind], id: pin.entry_id, label: this.nameOf(pin.kind, pin.entry_id) })),
  );
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
      }
    });
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

  /** Switch between the story, the notes and the view of the players; the same button leads back. */
  protected show(view: View): void {
    this.view.set(this.view() === view ? 'story' : view);
    if (this.view() === 'players') {
      this.loadPlayerView();
    }
  }

  /** Open a window at the side; opening the messages of a character marks its answers as read. */
  protected openPanel(panel: Panel): void {
    this.world.peek.set(null);
    this.panel.set(panel);
    if (panel.kind === 'messages' && this.store.unread(panel.characterId)) {
      this.store.markRead(panel.characterId);
    }
  }

  /** Open a pinned entry: a scene in the story, everything else in the window at the side. */
  protected openPin(pin: EntryLink): void {
    if (pin.kind === 'scenes') {
      this.view.set('story');
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
