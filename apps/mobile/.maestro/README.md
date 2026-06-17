# Maestro E2E tests

End-to-end UI tests for the Veladon mobile app, driven by
[Maestro](https://maestro.mobile.dev) (free, open-source). Flows are plain YAML
that launch the real app on a simulator and interact with it like a user.

## Prerequisites

1. **Maestro CLI** (one-time):
   ```bash
   brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro
   ```
   Needs a JDK (Java 17 is fine). Verify with `maestro --version`.

2. **The app installed on a booted simulator.** Maestro drives whatever build
   is already installed for appId `com.zabaca.veladon` — it does not build for
   you. From `apps/mobile`:
   ```bash
   bun run ios     # builds + installs + boots the iOS Simulator
   ```

## Running

From `apps/mobile`:

```bash
bun run e2e            # run the whole suite (.maestro)
bun run e2e:smoke      # only flows tagged `smoke` (no backend/account needed)
./scripts/e2e.sh flows/smoke.yaml          # a single flow
./scripts/e2e.sh --include-tags auth       # by tag
```

`scripts/e2e.sh` auto-loads `.maestro/.env` and forwards each var to Maestro as
`-e KEY=VALUE`.

To iterate on a flow with a live, re-runnable view:

```bash
maestro studio        # interactive inspector — great for finding selectors
```

### Full orchestrated sequence (multi-actor, self-contained)

`bun run e2e:full` (from `apps/mobile`) runs the complete patient + PDA journey
against a **throwaway temp DB** — it boots its own test web server (:3100, dev
`dev.db` untouched), a dedicated clean simulator (`Veladon-E2E`), and Metro with
the E2E flag, then runs the `journeys/` in order, using the temp DB as a
verification oracle after each step:

1. patient register → consent → dashboard
2. patient setup: edit profile + add a provider
3. patient invites a PDA (records/providers/releases = editor)
   - *(bridge)* harness reads the invite token from the DB and accepts it over
     the API — a fresh invitee can't accept in-app
4. PDA login → PDA onboarding → PdaHome
5. PDA adds a provider for the patient
6. PDA creates a HIPAA release (4-step wizard; unsigned — PDAs can't self-sign)
7. PDA uploads a record for the patient (real photo picker; seeded sim image)
8. patient signs the release (typed signature, pre-filled → "Sign & Activate")
9. patient uploads a record themselves (real photo picker)
10. patient restricts the PDA's provider access (editor → viewer)
11. PDA confirms the provider "Add" action is now gated (viewer-only)

> Record uploads (steps 7 & 9) use the **real** `expo-image-picker` against a
> sample image the harness seeds into the sim (`simctl addmedia` + Photos
> pre-granted via `simctl privacy`). The upload runs for real; only the
> Cloudflare R2 write is skipped server-side (`E2E_NO_R2=1`). Uploads are
> images-only — the in-app picker has no document/PDF path.

The orchestrator lives in `apps/mobile/e2e/` (`run.ts` sequences it; `harness.ts`
owns lifecycle; `db.ts` is the oracle; `api.ts` is the invite-accept bridge).
Pass `--keep-db` to leave the temp SQLite file for inspection. See
`e2e/PROGRESS.md` for the remaining scenarios and hard-won gotchas.

## Layout

```
.maestro/
├── config.yaml      # workspace config (which files are standalone flows)
├── .env.example     # copy to .env, fill in test creds (gitignored)
├── flows/           # standalone flows (run by the suite)
│   ├── smoke.yaml                  # app launches → Sign In  [tag: smoke]
│   ├── navigate-create-account.yaml# Sign In → Create Account [tag: smoke]
│   └── login.yaml                  # email/password → Dashboard [tag: auth]
└── subflows/        # reusable building blocks, pulled in via runFlow
    └── login-as.yaml               # sign in + clear post-login gates
```

## Login flow & test accounts

`flows/login.yaml` needs:

- A **reachable backend** — the app talks to the `EXPO_PUBLIC_API_URL` it was
  built with (iOS sim default: `http://localhost:3000`). Auth is real; there is
  no mock auth path.
- A **seeded test account**. Put its credentials in `.maestro/.env`:
  ```bash
  cp .maestro/.env.example .maestro/.env
  # then edit MAESTRO_EMAIL / MAESTRO_PASSWORD
  ```

`subflows/login-as.yaml` tolerantly clears the gates that follow sign-in
(see `src/navigation/RootNavigator.tsx`): the biometric first-run prompt (only
on devices with an enrolled biometric — a stock simulator has none) and the
legal consent screen (shown for fresh accounts).

> Until a test account + backend are available, `bun run e2e:smoke` is the
> green baseline. `login.yaml` is scaffolded and ready but will fail at the
> credentials step without them.

## Selectors: prefer `testID`

Flows target elements by **`testID`** (RN maps this to the iOS accessibility
identifier, which Maestro reads as `id:`), not by visible text — much of this
app's on-screen text is PHI and must not anchor tests. PostHog autocapture is
likewise restricted to `testID`.

When you build a new flow, add an opaque `testID` to the elements you interact
with rather than matching their text. Components forward `testID` automatically
(`Button`, `Input`, `Screen` all spread props to the underlying primitive).

Existing anchors: `signin-screen`, `signin-email`, `signin-password`,
`signin-submit`, `signin-create-account`, `consent-screen`, `consent-tos`,
`consent-privacy`, `consent-continue`, `dashboard-screen`.

## CI notes

- `maestro test --format JUNIT --output report.xml .maestro` emits a JUnit
  report (`report.*` is gitignored).
- Use `--include-tags smoke` to gate PRs on the no-backend smoke suite, and run
  the `auth`-tagged flows on a job that has a backend + seeded account.
