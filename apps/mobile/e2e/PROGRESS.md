# Mobile E2E (Maestro) — Progress & TODO

Multi-actor (patient + PDA) end-to-end tests for the Veladon mobile app, driven
by Maestro against a throwaway temp DB, with the DB used as a verification
oracle. Last updated: 2026-06-16.

> ## ✅ First full green run — 2026-06-16
> All **11 scenarios** passed end-to-end on a real iOS sim (`bun run e2e:full`),
> every DB/UI oracle confirmed. See "First full green run" below for the result
> table, the harness bugs found & fixed, and the iOS-26.5 / Maestro learnings.

## Requirements (from the original ask)

1. **Fresh temp DB per run** — never touch dev `apps/web/dev.db`; also use the
   temp DB as a check/oracle. ✅
2. **Clean slate each run** — fresh app/sim state. ✅ (dedicated sim + clearState/keychain)
3. **Browser/email for PDA invite** — resolved to **API acceptance** (no web in
   tests yet); local email is a no-op so we read the invite token from the DB. ✅
4. **Fixed test credentials**, reused across runs (temp DB is fresh each run). ✅
5. Skip **fax** and **OAuth** (manual).

## Architecture

TypeScript orchestrator in `apps/mobile/e2e/`:

- `config.ts` — fixed creds, ports, sim name, paths.
- `db.ts` — libSQL oracle (query + assert helpers).
- `api.ts` — direct HTTP calls (PDA invite acceptance).
- `harness.ts` — lifecycle: temp DB + migrate, test web server, dedicated sim, photo seeding, app-log capture, Metro, Maestro runner, stale-port preflight, teardown.
- `run.ts` — sequences journeys + DB/API bridge steps.

Run: `bun run e2e/run.ts` (from repo shell). **Launch with the web secrets on the
env** so the spawned `next dev`/`drizzle-kit` get `ENCRYPTION_KEY` etc. while
`DATABASE_URL` is overridden to the temp DB — the dev DB is never touched
(verified: Next's `.env` loading does not override an injected `process.env` var):
```bash
cd apps/mobile && PATH="$HOME/.bun/bin:/opt/homebrew/bin:$PATH" \
  bun --env-file=../web/.env e2e/run.ts
```
Flow: `temp DB (file:/tmp/veladon-e2e-<ts>.db)` → `db:migrate` → **dedicated sim
`Veladon-E2E`** (clean, no iCloud) → seed Photos + start app-log capture →
**stale-port preflight** → **test web server on :3100** (`E2E_NO_R2=1`) → **Metro**
(`EXPO_PUBLIC_API_URL=:3100`, `EXPO_PUBLIC_E2E=1`) → run Maestro journeys → assert DB → teardown.

Captured logs (for post-run error review): `/tmp/veladon-e2e-run.log`
(orchestrator + Maestro), `…-web.log` (API), `…-metro.log` (Expo), `…-app.log`
(native os_log for the app process), `…-cdp.log` (device JS console incl.
debugger-routed warnings, via `e2e/cdpCapture.ts`). Mobile JS `console.warn`/`error` are
forwarded to `/api/e2e-log` → `web.log` as `[MOBILE …]` via `src/lib/e2eConsole.ts`
(requires `api/e2e-log` allowlisted in web middleware — see gotchas).

Maestro flows in `apps/mobile/.maestro/`:
- `journeys/` — `patient-register`, `patient-setup`, `patient-invite-pda`, `pda-onboard`, `pda-add-provider`, `pda-create-release`, `pda-upload-record`, `patient-sign-release`, `patient-upload-record`, `patient-restrict-pda`, `pda-restricted-check`
- `subflows/` — `login-as`, `dismiss-system-dialogs` (now settles via `waitForAnimationToEnd` before the first hierarchy read)
- `flows/` — earlier smoke flows (`smoke`, `navigate-create-account`, `login`)

### Fixed test accounts (`config.ts`)
- Patient: `e2e.patient@veladon.test` / `Veladon-E2E-Pass1`
- PDA: `e2e.pda@veladon.test` / `Veladon-E2E-Pass2`

## Done — green & DB-verified (against live iteration env)

| # | Scenario | Journey | DB assertion |
|---|----------|---------|--------------|
| 1 | Patient register → consent → dashboard | `patient-register.yaml` | User row + `consentedAt` |
| 2 | Patient setup: edit profile + add provider | `patient-setup.yaml` | `profileComplete=1`, UserProvider row |
| 3 | Patient invites PDA (records/providers/releases = editor) | `patient-invite-pda.yaml` | PatientDesignatedAgent pending + token |
| 3b | Harness accepts invite via API (register path) | `e2e/api.ts` | `status=accepted`, agent linked, PDA user created |
| 4 | PDA login → PDA onboarding | `pda-onboard.yaml` | `onboarded=1`, lands on PdaHome |
| 5 | PDA adds provider for patient | `pda-add-provider.yaml` | patient's UserProvider gains "Boston Children's Hospital" |

## Wired into `run.ts` — full sequence (`bun run e2e:full`)

Scenarios 1–11 run as one ordered sequence against a single fresh temp DB, each
asserted via the DB/UI oracle. **All 11 pass end-to-end (2026-06-16).**

| # | Scenario | Journey | Assertion |
|---|----------|---------|-----------|
| 6 | PDA creates a HIPAA release (4-step wizard) | `pda-create-release.yaml` | `Release` row, `releaseAuthAgent=1`, `authSignatureImage` null |
| 7 | PDA uploads a record for the patient | `pda-upload-record.yaml` | `IncomingFile` (source='upload') + `FileUploadLog.uploadedById` = PDA |
| 8 | Patient signs the PDA-created release | `patient-sign-release.yaml` | same release now has `authSignatureImage`, `voided=0` |
| 9 | Patient uploads a record themselves | `patient-upload-record.yaml` | 2nd `IncomingFile` + `FileUploadLog.uploadedById` = patient |
| 10 | Patient restricts PDA provider access (editor→viewer) | `patient-restrict-pda.yaml` | `manageProvidersPermission='viewer'` |
| 11 | PDA confirms provider "Add" is gated (UI-only) | `pda-restricted-check.yaml` | Viewer banner shown, `pda-providers-add` not visible |

New testIDs (10–11): `representative-detail-screen`, `representative-save`,
`perm-records|perm-providers|perm-releases` (RepresentativeDetail pickers),
`agent-card-{active,pending}` (AccessList card — tap the card, not the nested
button; see iOS-26 gotcha), `pda-providers-{editor,viewer}-banner` (PdaProviders),
`Header` `rightAction.testID` support.
New testIDs (6,8): `pda-releases-add`, `pda-wizard-step{1,2,3}-next` +
`pda-wizard-submit` (via `PdaWizardShell` `primaryTestID`), `pda-rec-medical`
(Step 2 toggle), `release-sign` (PendingDetail), `releases-tab-{active,pending,expired}`,
`release-row-{active,pending,expired}` (ReleasesList row).
New testIDs (7,9): `records-upload`, `pda-records-upload`, `upload-source-library`
(both upload sheets), `upload-confirm`, `pda-upload-confirm`.

The signature is **typed, not drawn**: `SignaturePad` defaults to Type mode with
the patient's profile name pre-filled, so signing is just tapping "Sign & Activate".

**Record uploads (7, 9) drive the REAL photo picker.** The harness seeds a sample
image into the sim's photo library (`simctl addmedia apps/mobile/assets/icon.png`)
and pre-grants Photos (`simctl privacy grant photos`), so the in-app *Photo
Library* picker opens with no permission dialog and a selectable cell. The upload
XHR runs for real against the test server; only the Cloudflare R2 PutObject is
skipped server-side (`uploadToR2` early-returns under `E2E_NO_R2=1`, set on the
test web server) so it stays hermetic and never pollutes the live bucket — the
`IncomingFile` + `FileUploadLog` inserts still run. **Note:** uploads are
images-only (the in-app picker is `expo-image-picker` `mediaTypes:["images"]`;
there's no document/PDF path). The PHPicker cell is tapped by coordinate
(`16%,28%`) on system UI — this **worked** on the green run, but it's the most
environment-sensitive step if the iOS picker layout changes.

## First full green run (2026-06-16)

All 11 scenarios + every DB/UI oracle passed in one `e2e:full` run on a real sim
(`Veladon-E2E`, iOS 26.5). No API/web errors; native log clean of crashes.

| # | Scenario | # | Scenario |
|---|----------|---|----------|
| 1 | register → consent → dashboard | 7 | PDA upload record (real picker) |
| 2 | profile + provider | 8 | patient sign release |
| 3 | invite PDA | 9 | patient upload record |
| 3b | accept invite (API) | 10 | patient restrict PDA → viewer |
| 4 | PDA onboard | 11 | PDA sees Add gated |
| 5 | PDA add provider | | |
| 6 | PDA create release | | |

### Harness bugs found & fixed on the way to green
- **`simctl addmedia` could hang indefinitely** (wedged sim photo daemon) → time-bounded with `timeout`/`SIGKILL`; seeding is best-effort.
- **Orphaned `:3100`/`:8081` servers** from a SIGKILL'd run poisoned the next run (app talked to a stale server on a stale DB) → `freeStalePorts()` preflight + `SIGTERM` teardown handler + teardown frees the ports.
- **`runMaestroFlow` had no timeout** → a wedged `maestro test` hung the whole run → added a 5-min per-flow timeout that also clears the wedged XCUITest driver.

### iOS 26.5 + Maestro 2.6.1 learnings
- 2.6.1 is the **latest** Maestro (no upgrade exists); the flakiness is inherent to current Maestro vs. the new iOS 26 accessibility stack.
- Symptom: an element is **rendered but not in the queryable hierarchy** → `kAXErrorInvalidUIElement` / `Error getting main window` (S3 hung), or `extendedWaitUntil` times out on a visible element (S8 text, S10 nested button). Confirmed by screenshots showing the element on screen.
- Mitigations that fixed it: a **`waitForAnimationToEnd` settle** at the top of `dismiss-system-dialogs` (queries during launch animation are what crash), and targeting **top-level testIDs** over visible text or nested buttons.

## TODO

### Remaining scenarios
- [x] **PDA creates a release** for the patient — `pda-create-release.yaml` walks the 4-step wizard. Signature turned out NOT to be a blocker: it's **typed** (default mode, pre-filled), so the PDA's release is created unsigned and the patient signs by tapping a button. Verifies a `Release` row with `releaseAuthAgent=1`.
- [x] **Patient signs the PDA-created release** — `patient-sign-release.yaml` opens the pending release and taps "Sign & Activate" (typed signature pre-filled). Verifies `authSignatureImage` set.
- [x] **PDA uploads a record** — `pda-upload-record.yaml` drives the real photo picker (harness-seeded image, Photos pre-granted); R2 PUT skipped server-side. Verifies an `IncomingFile`/`FileUploadLog` uploaded by the PDA.
- [x] **Patient uploads a record** — `patient-upload-record.yaml`, same real-picker path; verifies a 2nd `IncomingFile` uploaded by the patient.
- [x] **Patient restricts PDA access** — `patient-restrict-pda.yaml` downgrades Manage Providers editor→viewer; verifies `manageProvidersPermission='viewer'`.
- [x] **PDA restricted-action check** — `pda-restricted-check.yaml` confirms the providers "Add" button (gated by `isEditor`) is gone + the Viewer banner shows.

### Orchestration / wiring
- [x] **Wire journeys 1–5 into `run.ts`** as one self-contained `bun run e2e/run.ts` sequence, with the DB-token read + API-accept bridge between journey 3 and 4. Each scenario asserts its outcome against the temp-DB oracle.
- [x] Add a `package.json` script (`bun run e2e:full`) + update `.maestro/README.md`.
- [x] Decided: **one fresh temp DB for the whole sequence** (journeys run in order; later scenarios depend on earlier state). Pass `--keep-db` to retain it for inspection.
- Also excluded `e2e/` from the Expo `tsconfig.json` (Bun-run scripts, not RN app code) and declared `EXPO_PUBLIC_E2E` in `src/env.d.ts`; `bunx tsc --noEmit` is clean.

### Nice-to-have
- [ ] Re-enable real email→mailinator path behind a flag (set `RESEND_API_KEY`) if/when web testing is added.
- [ ] Android coverage (flows are mostly cross-platform; coordinate-free taps help).

## Hard-won gotchas (also in agent memory `project_maestro_e2e`)

- **Session JWT lives in the iOS keychain** → survives `clearState`; every fresh-start flow must `clearKeychain`.
- **Dedicated clean sim `Veladon-E2E`** (no iCloud) — the dev sim's Apple ID triggers an intermittent "Apple Account Verification" dialog that steals focus.
- **Secure fields**: iOS "Use Strong Password?" sheet swallows input → suppressed under `EXPO_PUBLIC_E2E=1` (sets `textContentType=oneTimeCode` on secure `Input`s; prod UX untouched).
- **"Save Password?" dialog** appears after sign-in and overlays the next screen → `login-as` dismisses it (`tapOn Not Now`, optional).
- **Bottom-pinned `Button`s**: use `tapOn { id, retryTapIfNoChange: true }`. **Do NOT** use coordinate taps — a bottom coordinate tap can miss and open the RN dev console.
- **Keyboard occlusion**: lower form fields sit under the keyboard; tapping them types into the previous field. Dismiss the keyboard between fields by tapping the field's static label (`hideKeyboard` is unreliable; on SignIn use the "or continue with email" text).
- **RN `Modal` overlays** (e.g. the DOB picker) are invisible to Maestro — its testID/text don't match inside them. The register DOB defaults to Jan 1 2000 (adult); EditProfile/consent pre-load DOB so the picker is avoided.
- **Tab bar / list rows** expose aggregated accessibility text ("Profile, tab, 5 of 5", "Mass General Hospital Hospital") and Maestro full-matches the regex → use `.*X.*` / `"X, tab.*"`.
- **PDA invite acceptance can't happen in-app for a fresh invitee** (PdaInvite/pending list live only in the PDA tab tree, mounted only when `isPda`; `/invite/:token` is web-only) → accept via API using the DB token.
- **iOS 26.5 + Maestro 2.6.1 hierarchy flakiness**: elements can render but be missing from the accessibility tree (`kAXErrorInvalidUIElement`). Two rules that fixed it: (1) **settle before the first query** after `launchApp` (`waitForAnimationToEnd`) — querying mid-launch-animation crashes the driver; (2) **target top-level testIDs**, never visible `<Text>` (S8: "Awaiting signature" was visible but unqueryable) or a **button nested inside an accessible parent** (S10: the whole AccessList card is one a11y element, hiding its inner "Edit Permissions" button — tap the card instead).
- **Hermetic uploads**: the web server can't reach Cloudflare R2 in tests → `uploadToR2` early-returns a synthetic URL under `E2E_NO_R2=1` (set on the test server). The real client upload XHR + MIME validation + `IncomingFile`/`FileUploadLog` inserts still run; only the S3 PUT is skipped. Seed Photos with `simctl addmedia` + pre-grant via `simctl privacy grant photos`.
- **Mobile JS console capture**: `src/lib/e2eConsole.ts` forwards `console.warn`/`error` (and `LogBoxData.observe` entries) → `/api/e2e-log` → `web.log` as `[MOBILE …]`. **Critical gotcha:** the route MUST be allowlisted in `apps/web/src/middleware.ts` (added `api/e2e-log` to the matcher negative-lookahead) — otherwise middleware 401s the unauthenticated POST before the handler runs and you capture nothing (this silently ate several runs). The route is gated by `E2E_NO_R2` so it's a 404 no-op in any real deploy.
- **The "Open debugger to view warnings" toast → captured via CDP.** On RN 0.76 (New Architecture) warning *content* is routed to the debugger and LogBox/`LogBoxData` only hold that placeholder, so neither the in-app forwarder nor `LogBoxData` can read it. Solution: `e2e/cdpCapture.ts` acts as the debugger — it polls Metro's inspector (`/json/list`), connects to the RN page over CDP, enables `Runtime`+`Log`, and writes every `consoleAPICalled` to `/tmp/veladon-e2e-cdp.log` as `[CDP WARNING/ERROR/LOG] …`. Wired into the harness (`startCdpCapture()` after Metro). Grep that file after a run for the real warning text + stack. **This is the reliable mobile-warning capture** (the `/api/e2e-log` forwarder still works for normal console output but misses debugger-routed warnings).
- **First real warning found this way (benign):** `[RepresentedPatientsContext] load failed: TypeError: Network request failed` — a **`__DEV__`-only**, deliberately-caught network error in `RepresentedPatientsContext.tsx:54` (keeps existing state, doesn't boot the user). Not in production; fires transiently when the PDA's represented-patients load hits a hiccup. Nothing to fix.

## How to iterate quickly

Instead of a full `run.ts` each time, keep a persistent env and re-run single journeys:

```bash
# temp DB + migrate
DATABASE_URL=file:/tmp/veladon-e2e-iter.db bun run --cwd apps/web db:migrate
# web (:3100) + Metro (E2E flag) in background
DATABASE_URL=file:/tmp/veladon-e2e-iter.db PORT=3100 NEXTAUTH_URL=http://localhost:3100 \
  bun run --cwd apps/web dev --port 3100 &
EXPO_PUBLIC_API_URL=http://localhost:3100 EXPO_PUBLIC_E2E=1 \
  bunx expo start --dev-client --clear --port 8081 &   # from apps/mobile
# run a journey on the dedicated sim
maestro test --udid <Veladon-E2E udid> -e EMAIL=... -e PASSWORD=... .maestro/journeys/<x>.yaml
# inspect the oracle
bun -e "import {createClient} from '@libsql/client'; const c=createClient({url:'file:/tmp/veladon-e2e-iter.db'}); console.log((await c.execute('SELECT ...')).rows)"
```
