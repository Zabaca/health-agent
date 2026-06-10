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

/**
 * Filled-in company values (JAM-323). Zabaca, LLC is a California LLC;
 * all user-facing legal contact is consolidated to a single mailbox.
 */
export const COMPANY_LEGAL_NAME = "Zabaca, LLC";
export const COMPANY_BRAND = "Veladon";
export const COMPANY_ADDRESS = "Zabaca, LLC, 717 Brea Canyon Rd Ste 6, Walnut, CA 91789";
export const PRIVACY_EMAIL = "info@veladon.com";
export const LEGAL_EMAIL = "info@veladon.com";
export const SUPPORT_EMAIL = "info@veladon.com";
export const GOVERNING_STATE = "California";

export const TERMS_URL = "https://veladon.com/terms";
export const PRIVACY_URL = "https://veladon.com/privacy";
