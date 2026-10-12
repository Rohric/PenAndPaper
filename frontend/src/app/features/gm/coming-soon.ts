import { Component, input } from '@angular/core';

/** Stand-in for a game master page that is not built yet. */
@Component({
  selector: 'app-coming-soon',
  template: `
    <section class="stack">
      <header>
        <span class="kicker">Spielleiter</span>
        <h1 class="title">{{ title() }}</h1>
      </header>
      <div class="empty">
        <p>{{ text() }}</p>
      </div>
    </section>
  `,
})
export class ComingSoon {
  /** Set by the route data. */
  readonly title = input('');
  readonly text = input('');
}
