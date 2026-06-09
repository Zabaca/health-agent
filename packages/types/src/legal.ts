/**
 * Veladon legal document metadata.
 *
 * The canonical text now lives in the app itself
 * (`apps/mobile/src/screens/legal/content.ts`) and is mirrored as HTML at
 * `docs/legal/{terms,privacy}.html` for outside-counsel review and future
 * hosting. The URL constants below remain so existing tooling can keep
 * referring to them; in-app navigation prefers the bundled screens, falling
 * back to the URL only if a screen is unreachable.
 *
 * Bump LEGAL_DOC_VERSION (and CONSENT_VERSION in `schemas/consent.ts`) when
 * the documents materially change so users are re-prompted to accept.
 */

export const LEGAL_DOC_VERSION = "v1";

/** Plain-language effective date shown in the document headers. */
export const LEGAL_EFFECTIVE_DATE = "June 9, 2026";

/** Best-guess company values for v1; replace before production launch. */
export const COMPANY_LEGAL_NAME = "Zabaca, Inc.";
export const COMPANY_BRAND = "Veladon";
export const COMPANY_ADDRESS = "Zabaca, Inc., {{LEGAL_ADDRESS}}";
export const PRIVACY_EMAIL = "privacy@veladon.com";
export const LEGAL_EMAIL = "legal@veladon.com";
export const SUPPORT_EMAIL = "support@veladon.com";
export const GOVERNING_STATE = "Delaware";

export const TERMS_URL = "https://veladon.com/terms";
export const PRIVACY_URL = "https://veladon.com/privacy";
