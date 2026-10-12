import { Injectable, signal } from '@angular/core';

/** Below this width the app shows its mobile views, from here on the desktop views. */
const MOBILE_QUERY = '(max-width: 767px)';

/** Tell the app which of its two views fits the screen. */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly query = window.matchMedia(MOBILE_QUERY);
  private readonly mobileState = signal(this.query.matches);

  readonly isMobile = this.mobileState.asReadonly();

  constructor() {
    // Both events are needed: some browsers skip the media query event while a tab is in the background.
    const update = () => this.mobileState.set(this.query.matches);
    this.query.addEventListener('change', update);
    window.addEventListener('resize', update);
  }
}
