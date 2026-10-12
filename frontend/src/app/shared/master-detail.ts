import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, inject, input, output } from '@angular/core';

import { LayoutService } from '../core/layout.service';

/**
 * A list with one opened entry, in two views.
 * Desktop shows list and entry side by side, mobile shows one of them at a time.
 */
@Component({
  selector: 'app-master-detail',
  imports: [NgTemplateOutlet],
  templateUrl: './master-detail.html',
  styleUrl: './master-detail.scss',
})
export class MasterDetail {
  protected readonly layout = inject(LayoutService);

  readonly list = input.required<TemplateRef<unknown>>();
  readonly detail = input.required<TemplateRef<unknown>>();
  /** Whether an entry is opened; on mobile this decides which part is shown. */
  readonly open = input(false);
  /** Asked for on mobile to return from the entry to the list. */
  readonly back = output<void>();
}
