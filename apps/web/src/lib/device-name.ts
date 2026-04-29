/**
 * Best-effort device-name extraction from a User-Agent string. Surfaced in
 * the "Active devices" UI to help users recognize their sessions.
 */
export function parseDeviceName(ua: string | null): string | null {
  if (!ua) return null;
  if (/iPad/i.test(ua)) return "iPad";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/Android/i.test(ua)) return "Android device";
  if (/Macintosh|Mac OS/i.test(ua)) {
    if (/Edg\//i.test(ua)) return "Edge on Mac";
    if (/Chrome/i.test(ua)) return "Chrome on Mac";
    if (/Firefox/i.test(ua)) return "Firefox on Mac";
    if (/Safari/i.test(ua)) return "Safari on Mac";
    return "Mac browser";
  }
  if (/Windows/i.test(ua)) {
    if (/Edg\//i.test(ua)) return "Edge on Windows";
    if (/Chrome/i.test(ua)) return "Chrome on Windows";
    if (/Firefox/i.test(ua)) return "Firefox on Windows";
    return "Windows browser";
  }
  if (/Linux/i.test(ua)) return "Linux browser";
  return "Unknown browser";
}
