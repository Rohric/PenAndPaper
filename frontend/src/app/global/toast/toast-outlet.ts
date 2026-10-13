import { Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

/** The place where the short messages appear: at the top of the screen, read out by screen readers. */
@Component({
  selector: 'app-toast-outlet',
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of service.toasts(); track toast.id) {
        <button type="button" class="toast" [class]="'toast toast--' + toast.tone" (click)="service.dismiss(toast.id)">{{ toast.text }}</button>
      }
    </div>
  `,
  styleUrl: './toast-outlet.scss',
})
export class ToastOutlet {
  protected readonly service = inject(ToastService);
}
