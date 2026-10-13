import {
  Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, linkedSignal, output, signal, untracked,
  viewChild,
} from '@angular/core';

import { map } from 'rxjs';

import { readError } from '../../core/api-error';
import { EntryKind, Option, Scene, WorldNpc } from '../../core/models';
import { AutoGrow } from '../../shared/auto-grow';
import { DialogueListEditor } from '../../shared/dialogue-list-editor';
import { Icon } from '../../shared/icon';
import { LinkPicker } from '../../shared/link-picker';
import { WorldStore } from './world-store';

type LinkField = 'npcs' | 'quests' | 'events' | 'trivia';
type Status = 'idle' | 'unsaved' | 'saving' | 'saved' | 'failed';

/** What was typed for a scene and is not sent yet. */
interface Unsent {
  id: number;
  changes: Partial<Scene>;
}

const SAVE_AFTER_MS = 700;
// What is written word by word: it stays as typed while the form is open, even after it was saved.
const WRITTEN: string[] = ['name', 'description', 'to_read', 'dialogues'];
const STATUS_TEXT: Record<Status, string> = {
  idle: '',
  unsaved: 'Wird gleich gespeichert …',
  saving: 'Speichert …',
  saved: 'Gespeichert',
  failed: 'Nicht gespeichert',
};

/**
 * Write one scene like a page of text: its name, where it plays, who appears, what is read aloud,
 * what happens, what is said and what it points to, one below the other in the order of the Tab key.
 * There is no save button: a moment after typing, the changed fields are saved.
 */
@Component({
  selector: 'app-scene-form',
  imports: [Icon, LinkPicker, AutoGrow, DialogueListEditor],
  templateUrl: './scene-form.html',
  styleUrl: './scene-form.scss',
})
export class SceneForm {
  protected readonly store = inject(WorldStore);

  readonly entry = input.required<Scene>();
  /** Fired when the writer is done and wants to read the scene again. */
  readonly saved = output<void>();
  /** Fired after the scene was deleted. */
  readonly closed = output<void>();

  private readonly sceneId = computed(() => this.entry().id);
  /** What is typed here. It counts before what the store has, so saving never changes the text under the cursor. */
  private readonly typed = linkedSignal<number, Partial<Scene>>({ source: this.sceneId, computation: () => ({}) });
  protected readonly draft = computed<Scene>(() => ({ ...this.entry(), ...this.typed() }));
  protected readonly status = signal<Status>('idle');
  protected readonly statusText = computed(() => STATUS_TEXT[this.status()]);
  protected readonly error = signal('');
  /** A scene can lead to every other scene of its chapter. */
  protected readonly otherScenes = computed<Option[]>(() =>
    this.store
      .scenesOf(this.entry().chapter)
      .filter((scene) => scene.id !== this.entry().id)
      .map((scene) => ({ id: scene.id, label: scene.name, hint: scene.optional ? 'optionale Szene' : 'am roten Faden', tone: 'scenes' })),
  );

  /** Create a character of the world from a typed name, for a line of a dialogue. */
  protected readonly newSpeaker = (name: string) => this.store.add<WorldNpc>('world-npcs', { name }).pipe(map((link) => link.npc));

  private readonly title = viewChild.required<ElementRef<HTMLInputElement>>('title');
  private unsent: Unsent | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // When another scene is opened, what was typed for the one before is saved first.
    effect(() => {
      this.sceneId();
      untracked(() => this.flush());
    });
    inject(DestroyRef).onDestroy(() => this.flush());
    afterNextRender(() => this.title().nativeElement.focus());
  }

  /** Change one field; it is saved a moment after the last change. */
  protected set<K extends keyof Scene>(key: K, value: Scene[K]): void {
    this.typed.update((typed) => ({ ...typed, [key]: value }));
    this.unsent = { id: this.sceneId(), changes: { ...this.unsent?.changes, [key]: value } };
    this.status.set('unsaved');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), SAVE_AFTER_MS);
  }

  /** Save what is left and go back to reading. */
  protected finish(): void {
    this.flush();
    this.saved.emit();
  }

  /** Delete the scene after the user confirmed. */
  protected remove(): void {
    if (!confirm(`„${this.entry().name}“ wirklich löschen?`)) {
      return;
    }
    clearTimeout(this.timer);
    this.unsent = null;
    this.store.remove('scenes', this.sceneId()).subscribe({
      next: () => this.closed.emit(),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Create a new entry in the glossary from the typed name and link it to the scene. */
  protected addNew(field: LinkField, name: string): void {
    const kind = field === 'npcs' ? 'world-npcs' : field;
    this.store.add<{ id: number; npc?: number }>(kind, { name }).subscribe({
      next: (created) => this.set(field, [...this.draft()[field], created.npc ?? created.id]),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Look a linked entry up in the window at the side. */
  protected lookUp(kind: EntryKind, id: number): void {
    this.store.peek.set({ kind, id });
  }

  /** Send what is typed but not saved yet. */
  private flush(): void {
    clearTimeout(this.timer);
    const sending = this.unsent;
    if (!sending) {
      return;
    }
    this.unsent = null;
    this.status.set('saving');
    this.store.save<Scene>('scenes', sending.id, sending.changes).subscribe({
      next: () => this.sent(''),
      error: (e: unknown) => this.failed(sending, readError(e)),
    });
  }

  /** After a save: show how it went; once everything is saved the links follow the store again. */
  private sent(error: string): void {
    this.error.set(error);
    this.status.set(error ? 'failed' : this.unsent ? 'unsaved' : 'saved');
    if (!error && !this.unsent) {
      this.keepTexts();
    }
  }

  /** Forget the typed links, so they follow the store again; what was written stays as it was typed. */
  private keepTexts(): void {
    const written = Object.entries(this.typed()).filter(([key]) => WRITTEN.includes(key));
    this.typed.set(Object.fromEntries(written) as Partial<Scene>);
  }

  /** Keep what could not be saved, so the next change sends it again. */
  private failed(lost: Unsent, error: string): void {
    if (lost.id === this.sceneId()) {
      this.unsent = { id: lost.id, changes: { ...lost.changes, ...this.unsent?.changes } };
    }
    this.sent(error);
  }
}
