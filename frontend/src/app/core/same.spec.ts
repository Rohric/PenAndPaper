import { describe, expect, it } from 'vitest';

import { sameJson } from './same';

describe('sameJson', () => {
  it('finds equal data equal, also in new objects', () => {
    expect(sameJson({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toBe(true);
    expect(sameJson([{ id: 1, text: 'x' }], [{ id: 1, text: 'x' }])).toBe(true);
  });

  it('finds changed data different, also deep inside', () => {
    expect(sameJson({ a: 1 }, { a: 2 })).toBe(false);
    expect(sameJson({ a: { b: [1, 2] } }, { a: { b: [1, 3] } })).toBe(false);
    expect(sameJson([1, 2], [2, 1])).toBe(false);
  });

  it('handles null and the same object', () => {
    const value = { a: 1 };
    expect(sameJson(value, value)).toBe(true);
    expect(sameJson(null, null)).toBe(true);
    expect(sameJson(null, { a: 1 })).toBe(false);
  });
});
