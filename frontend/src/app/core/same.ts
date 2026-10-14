/**
 * Whether two values hold the same data. Signals that a reload fills use it as their "equal" function,
 * so a reload that brings the same data again changes nothing on the screen.
 */
export function sameJson(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Whether two lists hold the very same objects in the same order. A list built from other signals uses it as its
 * "equal" function, so building it again from the same entries changes nothing on the screen.
 */
export function sameItems<T>(a: readonly T[], b: readonly T[]): boolean {
  return a === b || (a.length === b.length && a.every((item, index) => item === b[index]));
}
