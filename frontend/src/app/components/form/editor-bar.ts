import { Component, computed, input, output } from '@angular/core';

/**
 * Save and delete, at the end of the head of every form with a button. The save button says how things stand:
 * "Speichern" while something is changed, "Speichert …" while it is sent, "Gespeichert" otherwise. Strg + Enter
 * saves as well; how it went is told by a short message on top.
 */
@Component({
  selector: 'app-editor-bar',
  template: `
    <div class="row">
      <button type="button" class="btn btn--primary" [disabled]="!dirty() || busy()" (click)="save.emit()">{{ saveLabel() }}</button>
      <button type="button" class="btn btn--danger" (click)="remove.emit()">Löschen</button>
      @if (dirty()) {
        <span class="soft" role="status">Ungespeicherte Änderungen</span>
      }
    </div>
  `,
})
export class EditorBar {
  readonly dirty = input(false);
  readonly busy = input(false);
  readonly save = output<void>();
  readonly remove = output<void>();

  protected readonly saveLabel = computed(() => (this.busy() ? 'Speichert …' : this.dirty() ? 'Speichern' : 'Gespeichert'));
}
