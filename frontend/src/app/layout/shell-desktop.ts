import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { ShellNav } from './shell-nav.service';

/** Desktop frame: menu on the left, page on the right. */
@Component({
  selector: 'app-shell-desktop',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './shell-desktop.html',
  styleUrl: './shell-desktop.scss',
})
export class ShellDesktop {
  protected readonly nav = inject(ShellNav);
  protected readonly auth = inject(AuthService);
}
