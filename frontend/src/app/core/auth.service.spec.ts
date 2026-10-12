import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from './auth.service';

const LOGIN_RESPONSE = { token: 'abc', user_id: 1, username: 'player_one', is_game_master: false };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    // clear() sends the user to /login, so the test router needs that route.
    const routes = [{ path: 'login', children: [] }];
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('starts logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.token()).toBeNull();
  });

  it('stores token and account after login', () => {
    service.login({ username: 'player_one', password: 'x' }).subscribe();
    http.expectOne('/api/auth/login/').flush(LOGIN_RESPONSE);

    expect(service.token()).toBe('abc');
    expect(service.account()?.username).toBe('player_one');
    expect(service.isGameMaster()).toBe(false);
  });

  it('picks up the game master switch on refresh', () => {
    service.login({ username: 'player_one', password: 'x' }).subscribe();
    http.expectOne('/api/auth/login/').flush(LOGIN_RESPONSE);
    service.refresh().subscribe();
    http.expectOne('/api/auth/me/').flush({ user_id: 1, username: 'player_one', is_game_master: true });

    expect(service.isGameMaster()).toBe(true);
  });

  it('forgets everything on clear', () => {
    service.login({ username: 'player_one', password: 'x' }).subscribe();
    http.expectOne('/api/auth/login/').flush(LOGIN_RESPONSE);
    service.clear();

    expect(service.isLoggedIn()).toBe(false);
    expect(service.token()).toBeNull();
  });
});
