import { Component, ElementRef, afterNextRender, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Dialog } from '../window/dialog';

/**
 * The dialog that starts something new from its name: a world, a chapter, an entry of the glossary.
 * Everything else about the new thing is written afterwards, in its own form.
 */
@Component({
  selector: 'app-name-dialog',
  imports: [FormsModule, Dialog],
  template: `
    <app-dialog kind="Neu anlegen" [title]="title()" [size]="460" (closed)="closed.emit()">
      <form id="name-dialog-form" class="field" (ngSubmit)="submit()">
        <label for="name-dialog-name">{{ label() }}</label>
        <input #field id="name-dialog-name" class="input" name="name" autocomplete="off" [(ngModel)]="name" />
      </form>
      @if (hint()) {
        <p class="soft">{{ hint() }}</p>
      }
      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }
      <button windowFoot type="button" class="btn" (click)="closed.emit()">Abbrechen</button>
      <button windowFoot type="submit" form="name-dialog-form" class="btn btn--primary" [disabled]="!name().trim()">Anlegen</button>
    </app-dialog>
  `,
})
export class NameDialog {
  /** What is created, like "Neue Welt". */
  readonly title = input.required<string>();
  readonly label = input('Name');
  /** A sentence about what happens next. */
  readonly hint = input('');
  /** Why the last try failed; the dialog stays open. */
  readonly error = input('');
  readonly create = output<string>();
  readonly closed = output<void>();

  protected readonly name = signal('');
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  constructor() {
    afterNextRender(() => this.field()?.nativeElement.focus());
  }

  /** Hand the typed name on; an empty name does nothing. */
  protected submit(): void {
    const name = this.name().trim();
    if (name) {
      this.create.emit(name);
    }
  }
}
