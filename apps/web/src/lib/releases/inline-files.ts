import { getFromR2 } from "@/lib/r2";
import { decryptBuffer } from "@/lib/crypto";

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

function mimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  return (ext && MIME_BY_EXT[ext]) || "image/png";
}

// Matches the relative file route emitted by uploadToR2: `/api/files/<key>`.
// The key may contain a UUID, a sanitized filename and an extension.
const API_FILE_RE = /\/api\/files\/([^"'\s)]+)/g;

/**
 * Replace every `/api/files/<key>` reference in print HTML with an inline
 * base64 data URL.
 *
 * The release document is generated server-side and rendered into a PDF by the
 * mobile app (expo-print) and printed from the browser. The file route is a
 * relative, auth-protected endpoint serving app-encrypted PHI — expo-print has
 * no origin or session to resolve it, so the signature shows as a broken image.
 * Inlining the decrypted bytes makes the document self-contained without ever
 * exposing the file route publicly. Values already in data-URL form (e.g. a
 * signature stored inline) contain no `/api/files/` and pass through untouched.
 */
export async function inlineApiFileImages(html: string): Promise<string> {
  const keys = new Set<string>();
  for (const match of html.matchAll(API_FILE_RE)) keys.add(match[1]);
  if (keys.size === 0) return html;

  const dataUrlByKey = new Map<string, string>();
  await Promise.all(
    [...keys].map(async (key) => {
      try {
        const obj = await getFromR2(key);
        if (!obj.Body) return;
        const stored = Buffer.from(await obj.Body.transformToByteArray());
        const bytes = Buffer.from(decryptBuffer(stored));
        dataUrlByKey.set(key, `data:${mimeFromKey(key)};base64,${bytes.toString("base64")}`);
      } catch {
        // Leave the original src in place — it renders as a broken image but
        // never crashes the export.
      }
    }),
  );

  return html.replace(API_FILE_RE, (full, key: string) => dataUrlByKey.get(key) ?? full);
}
