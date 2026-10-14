import { DestroyRef, Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';

/** Let a textarea grow with its text, so writing feels like a page and not like a box with a scrollbar. */
@Directive({
  selector: 'textarea[appAutoGrow]',
  host: { '(input)': 'fit()' },
})
export class AutoGrow {
  private readonly area = inject<ElementRef<HTMLTextAreaElement>>(ElementRef).nativeElement;
  /** The width the field had when it was fitted last; text wraps anew when it changes. */
  private width = -1;

  /** The text of the field; the height is fitted again whenever it changes from outside. */
  readonly appAutoGrow = input('');

  constructor() {
    afterRenderEffect(() => {
      this.appAutoGrow();
      this.fit();
    });
    // A field drawn while it is not on the screen, like one in a tab that is not open yet, has nothing to measure.
    // It is fitted as soon as it shows, and again whenever its width changes; in the next frame, because changing
    // the height while the observer reports would make it report again at once.
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => requestAnimationFrame(() => this.refit()));
      observer.observe(this.area);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  /** Make the field as high as its text; a field that is not shown keeps its height. */
  protected fit(): void {
    if (!this.area.clientWidth) {
      return;
    }
    const border = this.area.offsetHeight - this.area.clientHeight;
    this.area.style.height = 'auto';
    this.area.style.height = `${this.area.scrollHeight + border}px`;
  }

  private refit(): void {
    if (this.area.clientWidth !== this.width) {
      this.width = this.area.clientWidth;
      this.fit();
    }
  }
}
