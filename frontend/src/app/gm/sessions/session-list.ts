import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { readError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { Option, PlayerCharacter, World } from '../../core/models';
import { Session } from '../../core/session-models';
import { IdSelect } from '../../components/form/id-select';
import { LinkPicker } from '../../components/form/link-picker';
import { LoginQr } from '../../components/basic/login-qr';
import { Dialog } from '../../components/window/dialog';
import { NavService } from '../../global/frame/nav.service';
import { Tool, Tools } from '../../global/tool-bar/tools.service';
import { CharacterService } from '../../core/character.service';
import { SessionService } from '../../core/session.service';

/** The sessions of the game master; "Neu" in the bar at the bottom opens the form that starts one. */
@Component({
  selector: 'app-session-list',
  imports: [FormsModule, RouterLink, IdSelect, LinkPicker, LoginQr, Dialog],
  templateUrl: './session-list.html',
})
export class SessionList {
  private readonly api = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly sessions = signal<Session[]>([]);
  protected readonly worlds = signal<World[]>([]);
  protected readonly characters = signal<PlayerCharacter[]>([]);
  protected readonly error = signal('');
  protected readonly creating = signal(false);
  private readonly qrPop = viewChild<TemplateRef<unknown>>('qrPop');
  /** The QR code that brings the phones of the players to the login. */
  private readonly listTools = computed<Tool[]>(() => [
    { id: 'new', word: 'Neu', title: 'Neue Runde starten', icon: 'plus', click: () => this.creating.set(true) },
    { id: 'qr', word: 'QR-Code', title: 'QR-Code für die Handys der Spieler', icon: 'expand', popup: this.qrPop(), popupTitle: 'Mit dem Handy dabei' },
  ]);

  protected readonly name = signal('');
  protected readonly date = signal(new Date().toISOString().slice(0, 10));
  protected readonly world = signal<number | null>(null);
  protected readonly chosen = signal<number[]>([]);

  protected readonly worldOptions = computed<Option[]>(() => this.worlds().map((w) => ({ id: w.id, label: w.name })));
  protected readonly characterOptions = computed<Option[]>(() =>
    this.characters().filter((c) => !c.adventure).map((c) => ({ id: c.id, label: c.name, hint: `Spieler: ${c.player}` })),
  );

  constructor() {
    const nav = inject(NavService);
    nav.crumbs.provide(signal([{ label: 'Runden' }]));
    nav.topic.provide(signal(['sessions']));
    inject(Tools).provide('view', this.listTools);
    const parts = {
      sessions: this.api.list(),
      worlds: inject(ApiService).get<World[]>('worlds/'),
      characters: inject(CharacterService).list<PlayerCharacter>('gm/player-characters'),
    };
    forkJoin(parts).subscribe({
      next: (data) => this.fill(data),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  /** Start a session with the chosen world and characters and open it. */
  protected create(): void {
    const session = { name: this.name().trim(), date: this.date(), world: this.world() ?? 0, characters: this.chosen() };
    this.api.create(session).subscribe({
      next: (created) => void this.router.navigate(['/gm/sessions', created.id]),
      error: (e: unknown) => this.error.set(readError(e)),
    });
  }

  private fill(data: { sessions: Session[]; worlds: World[]; characters: PlayerCharacter[] }): void {
    this.sessions.set(data.sessions);
    this.worlds.set(data.worlds);
    this.characters.set(data.characters);
  }
}
