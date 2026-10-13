import { Injectable, signal } from '@angular/core';

const VISIBLE_MS = 3500;
const MAX_SHOWN = 3;

/** One short message at the bottom of the screen. */
export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'ok' | 'danger';
}

/** Short messages like "Gespeichert" or "Neue Quest: …" that fade away by themselves. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  /** Show a message for a moment; at most three are shown at once. */
  show(text: string, tone: Toast['tone'] = 'info'): void {
    const id = this.nextId++;
    this.toasts.update((all) => [...all.slice(1 - MAX_SHOWN), { id, text, tone }]);
    setTimeout(() => this.dismiss(id), VISIBLE_MS);
  }

  /** Take a message away. */
  dismiss(id: number): void {
    this.toasts.update((all) => all.filter((toast) => toast.id !== id));
  }
}
