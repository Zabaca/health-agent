import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// Calendar-date helpers are shared with mobile via @health-agent/types.
export { toIsoDate, parseLocalDate, formatDateUS, todayIsoDate } from '@health-agent/types';

/**
 * Normalize a timestamp to full ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
 * Accepts a Date, epoch-ms (number or numeric string), an existing ISO string,
 * a `YYYY-MM-DD HH:MM:SS` value (the external fax provider's format — treated
 * as **UTC**, since it carries no offset), or a date-only string (→ midnight
 * UTC). Returns '' for blank input; passes through unparseable strings.
 */
export function toIsoTimestamp(input: string | number | Date | null | undefined): string {
  if (input == null) return '';
  if (input instanceof Date) return input.toISOString();
  if (typeof input === 'number') return new Date(input).toISOString();
  const s = input.trim();
  if (!s) return '';
  if (/^\d+$/.test(s)) return new Date(Number(s)).toISOString();
  // Fax provider: `YYYY-MM-DD HH:MM:SS` (no offset) → interpret as UTC.
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/);
  if (m) return `${m[1]}T${m[2]}.000Z`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00.000Z`;
  const d = dayjs(s);
  return d.isValid() ? d.toISOString() : s;
}

/**
 * Format a stored ISO timestamp as `MM/DD/YYYY h:mm A` in the viewer's local
 * time. Passes through blanks and unparseable values unchanged.
 */
export function formatDateTimeUS(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '';
  const d = dayjs(value);
  return d.isValid() ? d.format('MM/DD/YYYY h:mm A') : String(value);
}
