const TONES = 8;
const ITEM = 'gegenstand';

/**
 * The colour of a category or a tag: one of eight tones, always the same for the same name,
 * whatever its upper and lower case. The category "Gegenstand" keeps the colour of items.
 */
export function tagColour(name: string): string {
  const key = name.trim().toLowerCase();
  if (!key) {
    return 'var(--muted)';
  }
  if (key === ITEM) {
    return 'var(--kind-item)';
  }
  let sum = 0;
  for (const letter of key) {
    sum = (sum * 31 + letter.charCodeAt(0)) % 9973;
  }
  return `var(--tag-${(sum % TONES) + 1})`;
}
