/**
 * Generates a short, unique, time-based release code.
 * Format: base36(unix_seconds) + 2 random chars — e.g. "LMQ3X8K2" (~8-9 chars)
 * Time component ensures monotonically increasing codes with low collision probability.
 */
export function generateReleaseCode(): string {
  const timePart = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 4).toUpperCase();
  return timePart + randomPart;
}
