import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { ApiService } from './api.service';
import { Account, Credentials, LoginResponse, Registration } from './models';

const TOKEN_KEY = 'pnp.token';
const ACCOUNT_KEY = 'pnp.account';

/** Read the account that was stored at the last login, if any. */
function readStoredAccount(): Account | null {
  const raw = localStorage.getItem(ACCOUNT_KEY);
  return raw ? (JSON.parse(raw) as Account) : null;
}

/** Hold the logged-in account and talk to the auth endpoints. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly accountState = signal<Account | null>(readStoredAccount());

  readonly account = this.accountState.asReadonly();
  readonly isLoggedIn = computed(() => this.accountState() !== null);
  readonly isGameMaster = computed(() => this.accountState()?.is_game_master ?? false);

  /** Return the stored token for the auth header. */
  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Log in with name and password. */
  login(credentials: Credentials): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login/', credentials).pipe(tap((res) => this.store(res)));
  }

  /** Create an account; it starts as a player and is logged in right away. */
  register(data: Registration): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/registration/', data).pipe(tap((res) => this.store(res)));
  }

  /** Reload the account, so a new game master switch shows up without a new login. */
  refresh(): Observable<Account> {
    return this.api.get<Account>('auth/me/').pipe(tap((account) => this.setAccount(account)));
  }

  /** Log out on the server and forget the session locally in any case. */
  logout(): void {
    this.api.post('auth/logout/', {}).subscribe({ complete: () => this.clear(), error: () => this.clear() });
  }

  /** Forget token and account and show the login page. */
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
    this.accountState.set(null);
    void this.router.navigateByUrl('/login');
  }

  private store(response: LoginResponse): void {
    const { token, ...account } = response;
    localStorage.setItem(TOKEN_KEY, token);
    this.setAccount(account);
  }

  private setAccount(account: Account): void {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    this.accountState.set(account);
  }
}
