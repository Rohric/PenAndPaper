import { Component, inject, input, output } from '@angular/core';

import { readError } from '../../core/api-error';
import { Chapter } from '../../core/models';
import { WorldStore } from '../../core/world-store';
import { ToastService } from '../../global/toast/toast.service';
import { LinkPicker } from './link-picker';

/**
 * The field "Kapitel" of every entry form: the chapters the entry is tagged with. An entry can carry several
 * chapters; one that hangs on a scene gets the chapter of that scene by itself. Like every link field it can
 * create a new chapter from the typed name.
 */
@Component({
  selector: 'app-chapter-field',
  imports: [LinkPicker],
  template: `
    <div class="field">
      <label [attr.for]="inputId()">Kapitel</label>
      <span class="soft">Der Eintrag kann in mehreren Kapiteln vorkommen. Hängt er an einer Szene, bekommt er deren Kapitel von selbst.</span>
      <app-link-picker
        label="Kapitel dieses Eintrags"
        emptyText="Kapitel suchen oder neu anlegen …"
        [inputId]="inputId()"
        [creatable]="true"
        [options]="store.chapterOptions()"
        [selected]="selected()"
        (selectedChange)="selectedChange.emit($event)"
        (create)="create($event)"
        (look)="look.emit($event)"
      />
    </div>
  `,
})
export class ChapterField {
  protected readonly store = inject(WorldStore);
  private readonly toast = inject(ToastService);

  readonly inputId = input('entry-chapters');
  /** The ids of the chapters the entry is tagged with. */
  readonly selected = input<number[]>([]);
  readonly selectedChange = output<number[]>();
  /** Fired with the id of a chapter whose tag was clicked; the form decides whether it may look it up. */
  readonly look = output<number>();

  /** Create a chapter with the typed name at the end and tag the entry with it. */
  protected create(name: string): void {
    this.store.add<Chapter>('chapters', { name }).subscribe({
      next: (chapter) => this.selectedChange.emit([...this.selected(), chapter.id]),
      error: (e: unknown) => this.toast.show(readError(e), 'danger'),
    });
  }
}
