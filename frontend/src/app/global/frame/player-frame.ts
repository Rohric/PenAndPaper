import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { TutorialService } from '../core/tutorial.service';
import { Mode, ShellNav } from './shell-nav.service';

/** Mobile frame: bar on top with a menu that folds out, page below. */
@Component({
  selector: 'app-shell-mobile',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './shell-mobile.html',
  styleUrl: './shell-mobile.scss',
})
export class ShellMobile {
  protected readonly nav = inject(ShellNav);
  protected readonly auth = inject(AuthService);
  private readonly tutorial = inject(TutorialService);
  protected readonly open = signal(false);

  /** Open the general tutorial and close the menu. */
  protected openHelp(): void {
    this.tutorial.open('start');
    this.close();
  }

  /** Open or close the menu. */
  protected toggle(): void {
    this.open.update((value) => !value);
  }

  /** Close the menu after a link was chosen. */
  protected close(): void {
    this.open.set(false);
  }

  /** Change the area and close the menu. */
  protected switchTo(mode: Mode): void {
    this.nav.switchTo(mode);
    this.close();
  }
}
