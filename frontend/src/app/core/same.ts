/**
 * Whether two values hold the same data. Signals that a reload fills use it as their "equal" function,
 * so a reload that brings the same data again changes nothing on the screen.
 */
export function sameJson(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}
