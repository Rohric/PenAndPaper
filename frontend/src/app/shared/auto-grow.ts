import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';

/** Let a textarea grow with its text, so writing feels like a page and not like a box with a scrollbar. */
@Directive({
  selector: 'textarea[appAutoGrow]',
  host: { '(input)': 'fit()' },
})
export class AutoGrow {
  private readonly area = inject<ElementRef<HTMLTextAreaElement>>(ElementRef).nativeElement;

  /** The text of the field; the height is fitted again whenever it changes from outside. */
  readonly appAutoGrow = input('');

  constructor() {
    afterRenderEffect(() => {
      this.appAutoGrow();
      this.fit();
    });
  }

  /** Make the field as high as its text. */
  protected fit(): void {
    const border = this.area.offsetHeight - this.area.clientHeight;
    this.area.style.height = 'auto';
    this.area.style.height = `${this.area.scrollHeight + border}px`;
  }
}
