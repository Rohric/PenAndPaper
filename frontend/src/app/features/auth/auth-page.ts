import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { readError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { LoginQr } from '../../shared/login-qr';

type AuthMode = 'login' | 'register';

/**
 * Login and registration share this page; the route decides which one it is.
 * On a large screen it also shows the QR code that brings a phone to this page.
 */
@Component({
  selector: 'app-auth-page',
  imports: [FormsModule, RouterLink, LoginQr],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Set by the route data. */
  readonly mode = input<AuthMode>('login');

  protected readonly isRegister = computed(() => this.mode() === 'register');
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly repeatedPassword = signal('');
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  /** Send the form and open the app when the server accepts it. */
  protected submit(): void {
    this.busy.set(true);
    this.error.set('');
    this.request().subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (error: unknown) => this.fail(error),
    });
  }

  private request() {
    const credentials = { username: this.username().trim(), password: this.password() };
    return this.isRegister()
      ? this.auth.register({ ...credentials, repeated_password: this.repeatedPassword() })
      : this.auth.login(credentials);
  }

  private fail(error: unknown): void {
    this.error.set(readError(error));
    this.busy.set(false);
  }
}
