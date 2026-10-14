import { Component, computed, inject, input, output } from '@angular/core';

import { EntryRef } from '../../core/models';
import { ChapterEditor } from '../chapters/chapter-editor';
import { SceneForm } from '../chapters/scene-form';
import { EventEditor } from './event-editor';
import { LocationEditor } from './location-editor';
import { QuestEditor } from './quest-editor';
import { TriviaEditor } from './trivia-editor';
import { WorldNpcEditor } from './world-npc-editor';
import { WorldStore } from '../../core/world-store';

/**
 * The form that fits an entry of any kind, so every page and the window at the side edit entries the same way.
 * A scene saves itself while it is written, so it never reports "saved".
 */
@Component({
  selector: 'app-entry-form',
  imports: [LocationEditor, WorldNpcEditor, QuestEditor, EventEditor, TriviaEditor, ChapterEditor, SceneForm],
  template: `
    @switch (entry().kind) {
      @case ('locations') {
        @if (location(); as found) {
          <app-location-editor [entry]="found" (saved)="saved.emit()" (closed)="closed.emit()" />
        }
      }
      @case ('npcs') {
        @if (npcLink(); as link) {
          <app-world-npc-editor [link]="link" (saved)="saved.emit()" (closed)="closed.emit()" />
        }
      }
      @case ('quests') {
        @if (quest(); as found) {
          <app-quest-editor [entry]="found" (saved)="saved.emit()" (closed)="closed.emit()" />
        }
      }
      @case ('events') {
        @if (event(); as found) {
          <app-event-editor [entry]="found" (saved)="saved.emit()" (closed)="closed.emit()" />
        }
      }
      @case ('trivia') {
        @if (trivia(); as found) {
          <app-trivia-editor [entry]="found" (saved)="saved.emit()" (closed)="closed.emit()" />
        }
      }
      @case ('chapters') {
        @if (chapter(); as found) {
          <app-chapter-editor [entry]="found" (saved)="saved.emit()" (closed)="closed.emit()" />
        }
      }
      @case ('scenes') {
        @if (scene(); as found) {
          <app-scene-form [entry]="found" (closed)="closed.emit()" />
        }
      }
    }
  `,
})
export class EntryForm {
  private readonly store = inject(WorldStore);

  readonly entry = input.required<EntryRef>();
  /** Fired after the entry was saved. */
  readonly saved = output<void>();
  /** Fired after the entry was deleted. */
  readonly closed = output<void>();

  protected readonly location = computed(() => this.find(this.store.locations()));
  /** An NPC is named by the id of the character, not of its link to the world. */
  protected readonly npcLink = computed(() => this.store.npcs().find((link) => link.npc === this.entry().id) ?? null);
  protected readonly quest = computed(() => this.find(this.store.quests()));
  protected readonly event = computed(() => this.find(this.store.events()));
  protected readonly trivia = computed(() => this.find(this.store.trivia()));
  protected readonly chapter = computed(() => this.find(this.store.chapters()));
  protected readonly scene = computed(() => this.find(this.store.scenes()));

  private find<T extends { id: number }>(entries: T[]): T | null {
    return entries.find((entry) => entry.id === this.entry().id) ?? null;
  }
}
