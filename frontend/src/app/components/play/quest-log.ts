import { Component, computed, input, output, signal } from '@angular/core';

import { QuestLog, QuestStep, logOf } from '../../core/session-models';
import { Icon } from '../basic/icon';
import { tagColour } from '../entry/tag-colour';

let logs = 0;

/** One line of the checklist: a point of the game master or a point of the group, with its key in the order. */
interface Line {
  key: string;
  /** Whether the group wrote the point itself. */
  own: boolean;
  /** Position in the checklist of the game master, or place among the own points. */
  index: number;
  text: string;
  done: boolean;
}

/**
 * The log a group keeps about a quest: the checklist in the order of the group, tags and notes.
 * Points of the game master can only be moved and checked. Points of the group itself can be
 * written, changed and deleted; they carry their own mark and colour. The game master and the
 * players see and edit the same log.
 */
@Component({
  selector: 'app-quest-log',
  imports: [Icon],
  templateUrl: './quest-log.html',
  styleUrl: './quest-log.scss',
})
export class QuestLogView {
  /** The points of the game master that are shown to the group. */
  readonly steps = input.required<QuestStep[]>();
  readonly log = input<Partial<QuestLog> | undefined>(undefined);
  /** Whether the log can be changed; the view the game master takes of the players only reads. */
  readonly editable = input(true);
  /** Fired with the whole log after a change. */
  readonly logChange = output<QuestLog>();
  /** Fired with the position of a point of the game master that was checked or unchecked. */
  readonly stepToggle = output<number>();

  /** Id of the notes field, so its label points to it; unique when several logs are on the page. */
  protected readonly notesId = `quest-notes-${logs++}`;
  protected readonly newPoint = signal('');
  protected readonly newTag = signal('');
  protected readonly colourOf = tagColour;
  protected readonly full = computed(() => logOf(this.log()));
  /** All points in the order of the group; points that are not placed yet come last. */
  protected readonly lines = computed<Line[]>(() => {
    const log = this.full();
    const given = this.steps().map((step): Line => ({ key: `g${step.position}`, own: false, index: step.position, text: step.text, done: step.done }));
    const own = log.points.map((point, index): Line => ({ key: `p${index}`, own: true, index, text: point.text, done: point.done }));
    const all = [...given, ...own];
    const place = (line: Line) => (log.order.includes(line.key) ? log.order.indexOf(line.key) : log.order.length + all.indexOf(line));
    return [...all].sort((a, b) => place(a) - place(b));
  });

  /** Check or uncheck a point: the group saves its own points, a given point is checked at the quest. */
  protected check(line: Line): void {
    if (line.own) {
      this.change({ points: this.full().points.map((point, index) => (index === line.index ? { ...point, done: !point.done } : point)) });
    } else {
      this.stepToggle.emit(line.index);
    }
  }

  /** Change the text of a point the group wrote itself. */
  protected rename(line: Line, text: string): void {
    this.change({ points: this.full().points.map((point, index) => (index === line.index ? { ...point, text: text.trim() } : point)) });
  }

  /** Add the typed point at the end of the list. */
  protected add(): void {
    const text = this.newPoint().trim();
    if (text) {
      const points = [...this.full().points, { text, done: false }];
      this.change({ points, order: [...this.keys(), `p${points.length - 1}`] });
      this.newPoint.set('');
    }
  }

  /** Delete a point the group wrote itself; the own points after it move up by one. */
  protected remove(line: Line): void {
    const moved = (key: string) => (key.startsWith('p') && Number(key.slice(1)) > line.index ? `p${Number(key.slice(1)) - 1}` : key);
    const order = this.keys().filter((key) => key !== line.key).map(moved);
    this.change({ points: this.full().points.filter((_, index) => index !== line.index), order });
  }

  /** Move a point one place up (-1) or down (1). */
  protected move(line: Line, by: number): void {
    const order = this.keys();
    const from = order.indexOf(line.key);
    const to = from + by;
    if (to >= 0 && to < order.length) {
      order.splice(to, 0, ...order.splice(from, 1));
      this.change({ order });
    }
  }

  /** Add the typed tag, unless the quest carries it already. */
  protected addTag(): void {
    const tag = this.newTag().trim();
    const tags = this.full().tags;
    if (tag && !tags.some((other) => other.toLowerCase() === tag.toLowerCase())) {
      this.change({ tags: [...tags, tag] });
    }
    this.newTag.set('');
  }

  protected removeTag(tag: string): void {
    this.change({ tags: this.full().tags.filter((other) => other !== tag) });
  }

  protected setNotes(notes: string): void {
    this.change({ notes });
  }

  /** The keys of all points in the order they are shown. */
  private keys(): string[] {
    return this.lines().map((line) => line.key);
  }

  /** Send the log with the given parts changed; the order is always written out in full. */
  private change(changes: Partial<QuestLog>): void {
    this.logChange.emit({ ...this.full(), order: this.keys(), ...changes });
  }
}
