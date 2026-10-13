import { CanDeactivateFn } from '@angular/router';

/** A page that asks before it is left with unsaved changes. */
export interface Leavable {
  canLeave(): boolean;
}

/** Let the user leave unless the page wants to keep them. */
export const leaveGuard: CanDeactivateFn<Leavable> = (page) => page.canLeave();
