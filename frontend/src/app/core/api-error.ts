import { HttpErrorResponse } from '@angular/common/http';

const FALLBACK = 'Das hat nicht geklappt. Bitte versuch es noch einmal.';
const OFFLINE = 'Der Server ist nicht erreichbar.';

/** Collect every message text from the nested error data of the backend. */
function collectMessages(value: unknown, out: string[]): string[] {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectMessages(item, out));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectMessages(item, out));
  }
  return out;
}

/** Turn a failed request into one readable sentence for the user. */
export function readError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return FALLBACK;
  }
  if (error.status === 0) {
    return OFFLINE;
  }
  const messages = collectMessages(error.error?.error ?? error.error, []);
  return messages.length ? messages.join(' ') : FALLBACK;
}
