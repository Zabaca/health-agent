import fs from "node:fs";
import path from "node:path";

// Resolve from the repo root: apps/www/lib/legal.ts → ../../docs/legal
const LEGAL_DIR = path.join(process.cwd(), "..", "..", "docs", "legal");

/**
 * Reads docs/legal/{terms,privacy}.html and returns the inner HTML of <main>.
 * The legal HTML files are the canonical source — edits there flow into the
 * site automatically. We strip the wrapping <main> so we can place the content
 * inside our own themed shell.
 */
export function readLegalDocument(slug: "terms" | "privacy"): string {
  const file = path.join(LEGAL_DIR, `${slug}.html`);
  const html = fs.readFileSync(file, "utf-8");

  const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (!match) {
    throw new Error(`Could not find <main> in docs/legal/${slug}.html`);
  }
  return match[1];
}
