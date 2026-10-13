import { Component, inject, input, output } from '@angular/core';

import { WorldStore } from '../../core/world-store';
import { LinkPicker } from './link-picker';

/**
 * The field "Kapitel" of every entry form: the chapters the entry is tagged with. An entry can carry several
 * chapters; one that hangs on a scene gets the chapter of that scene by itself.
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
        emptyText="Kapitel suchen …"
        [inputId]="inputId()"
        [options]="store.chapterOptions()"
        [selected]="selected()"
        (selectedChange)="selectedChange.emit($event)"
      />
    </div>
  `,
})
export class ChapterField {
  protected readonly store = inject(WorldStore);

  readonly inputId = input('entry-chapters');
  /** The ids of the chapters the entry is tagged with. */
  readonly selected = input<number[]>([]);
  readonly selectedChange = output<number[]>();
}
