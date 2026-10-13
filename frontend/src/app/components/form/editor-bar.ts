import { Component, input, output } from '@angular/core';

/** The save and delete buttons every editor shows, with the state of the draft. */
@Component({
  selector: 'app-editor-bar',
  template: `
    <div class="row">
      <button type="button" class="btn btn--primary" [disabled]="!dirty() || busy()" (click)="save.emit()">Speichern</button>
      <button type="button" class="btn btn--danger" (click)="remove.emit()">Löschen</button>
      @if (dirty()) {
        <span class="soft" role="status">Ungespeicherte Änderungen</span>
      }
    </div>
    @if (error()) {
      <p class="notice notice--error" role="alert">{{ error() }}</p>
    }
  `,
  styleUrl: './editor-bar.scss',
})
export class EditorBar {
  readonly dirty = input(false);
  readonly busy = input(false);
  readonly error = input('');
  readonly save = output<void>();
  readonly remove = output<void>();
}
