import { Component, signal } from '@angular/core';

/**
 * The QR code that leads a phone to the login page. The picture is drawn when the frontend is
 * started for the network ("npm run start:lan"), with the address this computer has at that moment.
 */
@Component({
  selector: 'app-login-qr',
  template: `
    @if (missing()) {
      <p class="soft">Noch kein QR-Code. Starte das Frontend mit <code>npm run start:lan</code>, dann wird er erzeugt.</p>
    } @else {
      <img class="qr" src="login-qr.svg" alt="QR-Code zur Anmeldeseite" (error)="missing.set(true)" />
      <p class="soft">Mit dem Handy scannen, im selben WLAN wie dieser Rechner. Der Code führt zur Anmeldung.</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      text-align: center;
    }

    .qr {
      width: 100%;
      max-width: 320px;
      border-radius: var(--radius-sm);
    }
  `,
})
export class LoginQr {
  /** Whether the picture could not be loaded, because it was never drawn. */
  protected readonly missing = signal(false);
}
