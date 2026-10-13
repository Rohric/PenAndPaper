import { HttpErrorResponse } from '@angular/common/http';

const FALLBACK = 'Das hat nicht geklappt. Bitte versuch es noch einmal.';
const OFFLINE = 'Keine Verbindung zum Server. Prüfe dein WLAN und versuch es noch einmal.';
/** What the user reads for a status when the server has nothing better to say. */
const STATUS_TEXTS: Record<number, string> = {
  401: 'Du bist nicht angemeldet. Melde dich bitte neu an.',
  403: 'Das darfst du nicht.',
  404: 'Das gibt es nicht (mehr). Lade die Seite neu.',
  413: 'Die Datei ist zu groß.',
};
const SERVER_ERROR = 'Auf dem Server ist etwas schiefgelaufen. Versuch es gleich noch einmal.';
/** The names of fields as the user knows them; fields not listed here show their message without a name. */
const FIELDS: Record<string, string> = {
  name: 'Name', username: 'Name', password: 'Passwort', image: 'Bild', text: 'Text', title: 'Titel', characters: 'Charaktere',
  inventory: 'Inventar', special_abilities: 'Besondere Fähigkeiten', date: 'Datum', world: 'Welt', chapter: 'Kapitel',
};
/** Messages the framework writes in English; they are replaced by a text of ours. */
const ENGLISH = /permission|credentials|not found|authentication/i;

/** Collect every message of the nested error data of the backend, each on its own line, with the name of its field. */
function collectMessages(value: unknown, field: string, out: string[]): string[] {
  if (typeof value === 'string') {
    out.push(FIELDS[field] ? `${FIELDS[field]}: ${value}` : value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectMessages(item, field, out));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => collectMessages(item, key, out));
  }
  return out;
}

/** Turn a failed request into a readable text for the user; several problems stand on separate lines. */
export function readError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return FALLBACK;
  }
  if (error.status === 0) {
    return OFFLINE;
  }
  const messages = collectMessages(error.error?.error ?? error.error, '', []).filter((message) => !ENGLISH.test(message));
  if (messages.length) {
    return messages.join('\n');
  }
  return STATUS_TEXTS[error.status] ?? (error.status >= 500 ? SERVER_ERROR : FALLBACK);
}
