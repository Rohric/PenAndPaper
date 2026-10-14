import { DestroyRef } from '@angular/core';
import { Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_WAIT_MS, Poller } from './poll';

/** A DestroyRef the test destroys by hand. */
function destroyRef(): { ref: DestroyRef; destroy: () => void } {
  const callbacks: (() => void)[] = [];
  const ref = { onDestroy: (callback: () => void) => (callbacks.push(callback), () => undefined) } as unknown as DestroyRef;
  return { ref, destroy: () => callbacks.forEach((callback) => callback()) };
}

describe('Poller', () => {
  let hidden: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    hidden = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads at once and then at every interval', () => {
    const load = vi.fn(() => of(null));
    new Poller(load, () => 1000, () => hidden).start(true, destroyRef().ref);
    expect(load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(load).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1000);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('waits for the first tick without "immediately"', () => {
    const load = vi.fn(() => of(null));
    new Poller(load, () => 1000, () => hidden).start(false, destroyRef().ref);
    expect(load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('never runs two loads at once and loads once more after now() during a load', () => {
    const answers: Subject<null>[] = [];
    const load = vi.fn((): Observable<null> => {
      answers.push(new Subject<null>());
      return answers.at(-1)!;
    });
    const poller = new Poller(load, () => 1000, () => hidden);
    poller.start(true, destroyRef().ref);
    vi.advanceTimersByTime(5000);
    poller.now();
    poller.now();
    expect(load).toHaveBeenCalledTimes(1);
    answers[0].complete();
    expect(load).toHaveBeenCalledTimes(2);
    answers[1].complete();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not load while the screen is hidden and loads at once when it shows again', () => {
    hidden = true;
    const load = vi.fn(() => of(null));
    new Poller(load, () => 1000, () => hidden).start(true, destroyRef().ref);
    vi.advanceTimersByTime(5000);
    expect(load).not.toHaveBeenCalled();
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('waits longer after every error and normal again after a success', () => {
    let calls = 0;
    const load = vi.fn(() => (++calls <= 2 ? throwError(() => new Error('weg')) : of(null)));
    new Poller(load, () => 1000, () => hidden).start(true, destroyRef().ref);
    vi.advanceTimersByTime(1999);
    expect(load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(load).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(3999);
    expect(load).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(load).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(1000);
    expect(load).toHaveBeenCalledTimes(4);
  });

  it('never waits longer than the longest wait', () => {
    const load = vi.fn(() => throwError(() => new Error('weg')));
    new Poller(load, () => 1000, () => hidden).start(true, destroyRef().ref);
    // The waits double (2 s, 4 s, 8 s, 16 s) until they reach the longest wait.
    vi.advanceTimersByTime(30000 + 3 * MAX_WAIT_MS);
    const calls = load.mock.calls.length;
    vi.advanceTimersByTime(MAX_WAIT_MS - 1);
    expect(load).toHaveBeenCalledTimes(calls);
    vi.advanceTimersByTime(1);
    expect(load).toHaveBeenCalledTimes(calls + 1);
  });

  it('stops when its owner is destroyed', () => {
    const load = vi.fn(() => of(null));
    const owner = destroyRef();
    const poller = new Poller(load, () => 1000, () => hidden);
    poller.start(true, owner.ref);
    owner.destroy();
    vi.advanceTimersByTime(5000);
    poller.now();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
