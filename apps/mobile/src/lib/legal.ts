import * as WebBrowser from "expo-web-browser";

// Canonical, publicly hosted legal documents on the marketing site. The app
// links out to these (opened in an in-app Safari sheet via expo-web-browser) so
// users always see the current published copy instead of a bundled snapshot.
// Keep these hosts in sync with the App Store "Terms"/"Privacy" URLs.
export const LEGAL_URLS = {
  terms: "https://www.veladon.com/terms",
  privacy: "https://www.veladon.com/privacy",
} as const;

export type LegalKind = keyof typeof LEGAL_URLS;

/** Open a hosted legal document in an in-app browser sheet. */
export function openLegalDoc(kind: LegalKind): void {
  void WebBrowser.openBrowserAsync(LEGAL_URLS[kind]);
}
