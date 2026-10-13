import { Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

/** The place where the short messages appear: above the bar at the bottom, read out by screen readers. */
@Component({
  selector: 'app-toast-outlet',
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of service.toasts(); track toast.id) {
        <button type="button" class="toast" [class]="'toast toast--' + toast.tone" (click)="service.dismiss(toast.id)">{{ toast.text }}</button>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 12px;
      bottom: 84px;
      left: 12px;
      z-index: 60;
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      pointer-events: none;
    }

    .toast {
      max-width: 520px;
      padding: 10px 16px;
      border: 1px solid var(--line-2);
      border-radius: 999px;
      background: var(--surface-2);
      color: var(--text);
      font-weight: 600;
      box-shadow: 0 4px 16px rgb(0 0 0 / 40%);
      pointer-events: auto;
    }

    .toast--ok {
      border-color: var(--ok);
    }

    .toast--danger {
      border-color: var(--danger);
    }
  `,
})
export class ToastOutlet {
  protected readonly service = inject(ToastService);
}
