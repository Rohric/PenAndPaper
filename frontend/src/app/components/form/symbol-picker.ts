import { Component, input, output, signal } from '@angular/core';

import { Icon, IconName } from './icon';
import { Portrait } from './portrait';
import { SYMBOL_GROUPS } from './symbols';

/**
 * Pick the symbol an entry or a character carries. Closed it shows the symbol in its frame,
 * open it shows all symbols in groups. Without a pick the usual symbol of the kind is used.
 */
@Component({
  selector: 'app-symbol-picker',
  imports: [Icon, Portrait],
  template: `
    <div class="row">
      <app-portrait [symbol]="value()" [fallback]="fallback()" />
      <button type="button" class="btn btn--small" [attr.aria-expanded]="open()" (click)="open.set(!open())">
        {{ open() ? 'Symbole schließen' : 'Symbol wählen' }}
      </button>
      @if (value()) {
        <button type="button" class="btn btn--small" (click)="pick('')"><app-icon name="undo" [size]="16" /> Standard-Symbol</button>
      }
      <ng-content />
    </div>

    @if (open()) {
      @for (group of groups; track group.label) {
        <div class="field">
          <span class="label">{{ group.label }}</span>
          <div class="picks">
            @for (choice of group.symbols; track choice.id) {
              <button
                type="button"
                class="pick"
                [class.is-active]="choice.id === value()"
                [attr.aria-label]="choice.label"
                [attr.aria-pressed]="choice.id === value()"
                [title]="choice.label"
                (click)="pick(choice.id)"
              >
                <app-icon [name]="fallback()" [symbol]="choice.id" [size]="22" />
              </button>
            }
          </div>
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .picks {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .pick {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: 1px solid var(--line-2);
      border-radius: var(--radius-sm);
      background: var(--bg);
      color: var(--soft);
    }

    .pick:hover,
    .pick.is-active {
      border-color: var(--accent);
      color: var(--accent);
    }
  `,
})
export class SymbolPicker {
  /** Key of the picked symbol; empty means the usual symbol. */
  readonly value = input('');
  /** The usual symbol of this kind of entry. */
  readonly fallback = input<IconName>('note');
  readonly valueChange = output<string>();

  protected readonly groups = SYMBOL_GROUPS;
  protected readonly open = signal(false);

  /** Take a symbol and close the list. */
  protected pick(id: string): void {
    this.valueChange.emit(id);
    this.open.set(false);
  }
}
