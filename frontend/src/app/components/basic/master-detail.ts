import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, input } from '@angular/core';

/** A list with one opened entry side by side; the list stays in view while the entry scrolls. */
@Component({
  selector: 'app-master-detail',
  imports: [NgTemplateOutlet],
  templateUrl: './master-detail.html',
  styleUrl: './master-detail.scss',
})
export class MasterDetail {
  readonly list = input.required<TemplateRef<unknown>>();
  readonly detail = input.required<TemplateRef<unknown>>();
}
