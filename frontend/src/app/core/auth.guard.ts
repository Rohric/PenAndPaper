import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Let only logged-in accounts in; everyone else goes to the login page. */
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn() || inject(Router).parseUrl('/login');
};

/** Keep logged-in accounts away from the login and registration pages. */
export const guestGuard: CanActivateFn = () => {
  return !inject(AuthService).isLoggedIn() || inject(Router).parseUrl('/');
};

/** Let only game masters into the game master area. */
export const gameMasterGuard: CanActivateFn = () => {
  return inject(AuthService).isGameMaster() || inject(Router).parseUrl('/player');
};
