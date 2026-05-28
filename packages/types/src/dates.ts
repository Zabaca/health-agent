/**
 * Shared, dependency-free date helpers (usable by both web and mobile via
 * Metro/transpilePackages). The DB stores calendar dates as `YYYY-MM-DD`;
 * display layers convert to US `MM/DD/YYYY`. Timestamp helpers that need a
 * date library live in the web app (see `apps/web/src/lib/dates.ts`).
 */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function localYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Normalize a calendar date to `YYYY-MM-DD`. Accepts a Date, an ISO date or
 * timestamp (the calendar-date prefix is taken verbatim — no timezone shift),
 * or `MM/DD/YYYY`. Returns '' for blank/unparseable input.
 */
export function toIsoDate(input: string | Date | null | undefined): string {
  if (input == null) return '';
  if (input instanceof Date) return isNaN(input.getTime()) ? '' : localYmd(input);
  const s = input.trim();
  if (!s) return '';
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return `${us[3]}-${pad(Number(us[1]))}-${pad(Number(us[2]))}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : localYmd(d);
}

/**
 * Parse a stored calendar date into a Date at **local** midnight (no timezone
 * shift), suitable for binding to a date picker. Returns null for blank/
 * unparseable input.
 */
export function parseLocalDate(value: string | Date | null | undefined): Date | null {
  const iso = toIsoDate(value);
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a stored date/timestamp as `MM/DD/YYYY` for display. Uses the
 * calendar-date prefix verbatim (no timezone shift). Passes through blanks and
 * unparseable values unchanged.
 */
export function formatDateUS(value: string | Date | null | undefined): string {
  if (value == null) return '';
  if (value instanceof Date) return isNaN(value.getTime()) ? '' : `${pad(value.getMonth() + 1)}/${pad(value.getDate())}/${value.getFullYear()}`;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return value;
}

/** Today's date as a local `YYYY-MM-DD` string. */
export function todayIsoDate(): string {
  return localYmd(new Date());
}
