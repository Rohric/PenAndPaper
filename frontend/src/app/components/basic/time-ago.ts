const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Say in words how long ago a moment was: "gerade eben", "vor 5 Min.", "gestern", and after a week the date. */
export function timeAgo(moment: string, now = Date.now()): string {
  const passed = now - new Date(moment).getTime();
  if (passed < MINUTE) {
    return 'gerade eben';
  }
  if (passed < HOUR) {
    return `vor ${Math.floor(passed / MINUTE)} Min.`;
  }
  if (passed < DAY) {
    return `vor ${Math.floor(passed / HOUR)} Std.`;
  }
  if (passed < 7 * DAY) {
    return passed < 2 * DAY ? 'gestern' : `vor ${Math.floor(passed / DAY)} Tagen`;
  }
  return new Date(moment).toLocaleDateString('de-DE');
}
