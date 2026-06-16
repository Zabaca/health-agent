/**
 * Central configuration for the mobile E2E harness.
 *
 * Everything the orchestrator, the DB oracle, and the Maestro flows need lives
 * here so there's a single source of truth — especially the test credentials,
 * which per the strategy are FIXED and reused across runs (the temp DB is fresh
 * each run, so fixed emails never collide).
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url)); // apps/mobile/e2e
export const MOBILE_DIR = resolve(here, "..");
export const REPO_ROOT = resolve(here, "..", "..", "..");
export const WEB_DIR = resolve(REPO_ROOT, "apps/web");

/** App under test (iOS bundle id; same on Android). */
export const APP_ID = "com.zabaca.veladon";

/**
 * Dedicated simulator for E2E. Created on demand and reused. Kept separate from
 * the developer's day-to-day sim so it stays signed OUT of iCloud — the dev
 * sim's Apple ID triggers an intermittent "Apple Account Verification" dialog
 * that steals focus and breaks flows. A clean sim never shows it.
 */
export const E2E_SIM_NAME = "Veladon-E2E";
export const E2E_SIM_DEVICE_TYPE = "com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max";

/**
 * Dedicated port for the throwaway test web server, deliberately NOT 3000 so a
 * normal `bun dev` against the real dev.db keeps running untouched.
 */
export const TEST_API_PORT = 3100;
export const TEST_API_URL = `http://localhost:${TEST_API_PORT}`;

/** Metro packager port (RN default). The debug build loads JS from here. */
export const METRO_PORT = 8081;

/**
 * Fixed test accounts. Passwords satisfy the 8-char minimum the register/accept
 * endpoints enforce. The patient registers through the real UI; the PDA account
 * is created via the invite-accept API (the "web" step we do over HTTP).
 */
export const CREDS = {
  patient: {
    email: "e2e.patient@veladon.test",
    password: "Veladon-E2E-Pass1",
    firstName: "Pat",
    lastName: "Tester",
    /** Matches DobField's default (Jan 1 2000) — an adult, so the UI flow can
     *  just open the picker and tap Done without spinning the wheel. */
    dateOfBirth: "2000-01-01",
  },
  pda: {
    email: "e2e.pda@veladon.test",
    password: "Veladon-E2E-Pass2",
    firstName: "Dee",
    lastName: "Agent",
    /** PDA onboarding (mobile) collects these. */
    phoneNumber: "5555550123",
    address: "100 Test St, Testville, CA 90001",
    relationship: "spouse",
  },
} as const;

/** Where the per-run temp SQLite DB is created. Stamped by run.ts. */
export function tempDbPath(stamp: string): string {
  return `/tmp/veladon-e2e-${stamp}.db`;
}
/** libSQL/Drizzle expects a `file:` URL. */
export function dbUrl(path: string): string {
  return `file:${path}`;
}
