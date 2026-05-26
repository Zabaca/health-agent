# App Store + Google Play submission plan (v1)

> **File references verified against `main` @ `7961e78` (2026-05-20).** Confirmed accurate: `auth.ts:150-159` (Apple+Google providers), `oauth-verify.ts:16,36`, `schema.ts:391-409` (patientDesignatedAgents), `crypto.ts:16-58`, `db/index.ts:1-14` (libSQL), `email.ts` send-functions, `releases/route.ts:137`, the `/api/auth/{apple,google}/mobile` endpoints exist, `/api/me` does not (still to build), `app.json:23-24` + `Info.plist:57-60` (NSHealth strings). Notable: `users.deletedAt` (schema.ts:333) and `users.disabled` (:35) **already exist** — soft-delete scaffolding is partly in place.

> **Status: draft for review.** Decisions baked in:
> - **Include HealthKit in v1 — READ-ONLY: regular (vitals/activity/sleep) and Clinical Health Records (FHIR — lab results, medications, conditions).** No write access to HealthKit, now or for the foreseeable future. Read-only is less scrutinized than write, but the clinical-records (`health-records`) tier is still the most-scrutinized HealthKit surface; it raises the review floor and adds ~2 weeks of engineering + a likely extra review round. "Fastest possible" now means "fastest *with* HealthKit," not the leanest possible launch.
> - **Android Health Connect: post-launch fast-follow** (not v1). Android launches with feature parity minus health-sync.
> - Privacy Policy + ToS via outside counsel (custom legal review)
> - Apple Developer Program: Organization (D-U-N-S verified)
> - Google Sign-In on mobile via `expo-auth-session`
> - **Strictly B2C for v1**: patients self-register; no hospital/clinic B2B contracts; regulatory bucket is "Personal Health Record (PHR) vendor", not "HIPAA Business Associate". Vendor BAAs pursued as defense-in-depth, not strict requirement.
> - **18+ only for v1**: age-gate at account creation (computed from DOB). Minors deferred to a later release.

---

## External requirements — start these in parallel with engineering

These items have lead times outside our codebase. **Kick them off day 1** — they will gate submission if started late.

| # | Item | Owner | Lead time | Status to confirm | Blocks |
|---|---|---|---|---|---|
| **E1** | **Apple Developer Program — Organization enrollment** with D-U-N-S verification | Khoa / Zabaca admin | **1–2 wks if not verified; immediate if already done** | Do we already have an organization-tier Apple Developer account with a verified D-U-N-S number? If not, request D-U-N-S at https://developer.apple.com/enroll/ | Everything Apple — provisioning, App Store Connect, Sign in with Apple |
| **E2** | **Google Play Console enrollment** ($25 one-time, organization profile) | Khoa / Zabaca admin | ~24 hours | Already enrolled? If yes, confirm "Organization" account type, not "Personal" | Play Store submission |
| **E3** | **Privacy Policy + Terms of Service** — outside-counsel drafted, reviewed | Khoa + outside counsel | **1–2 wks** | Need to engage counsel and brief them (see [Brief for counsel](#brief-for-counsel)) | App Store Connect listing, Play Console listing, OAuth consent screens, Apple review |
| **E4** | **Hosting `veladon.com/privacy` + `/terms`** | Web ops | ~1 day once docs are done | **Confirm the exact Veladon domain/TLD** (the plan assumes `veladon.com` — could be `veladon.app`, `veladon.health`, etc.) and whether it's registered + hosted yet. Is the site on a platform that supports adding pages, or static? | Counsel-signed docs being publicly reachable; OAuth consent screen; store listings |
| **E5** | **Upstream vendor BAA / DPA review** — Faxage, Cloudflare R2, Turso, Vercel, Resend (✓ has BAA already), Ably (nice-to-have, no PHI on wire) | Khoa / vendor mgmt | ~1–2 wks depending on vendor responsiveness | Strictly B2C means we're a **PHR vendor**, not a HIPAA BA — so vendor BAAs are defense-in-depth, not strict legal requirement. But: each vendor either offers a BAA (sign it) or a Data Processing Addendum (sign that). Document the matrix for counsel's PP review. | PP language accuracy; future B2B option-value |
| **E6** | **Google Cloud OAuth consent screen verification** | Khoa | **1–4 wks (submitted after launch is OK)** | Production-verified consent screen NOT required to submit to App Store. You can ship while it's in "Testing" with whitelisted users for internal QA; submit for Google verification in parallel. | Public sign-in via Google (verification needed if >100 users or sensitive scopes; we use only basic `email`/`profile`/`openid` — verification still required for production) |
| **E7** | **App Store Connect app record creation** | Khoa (~1 hr) | ~1 hour | Needs E1 done first | Metadata + TestFlight |
| **E8** | **Google Play Console app record creation** | Khoa (~1 hr) | ~1 hour | Needs E2 done first | Internal track upload |
| **E9** | **Screenshots + descriptions copy** | You + optional designer | 1–2 days | Can engineering provide raw simulator screenshots, then optional polish in Figma? | Final store listings |
| **E10** | **Demo account with sample (non-PHI) data + HealthKit demo video** | Engineering provisions, you write reviewer notes | ~1–2 days | Reviewer test account, PLUS a screen-recording showing the HealthKit + clinical-records flows working (HealthKit data is sparse in the simulator → reviewers often can't exercise it without a guide). Provide steps to populate sample Health data on a device. | Apple review (clinical-records apps frequently rejected for "couldn't test feature") |
| **E11** | **Apple HealthKit + Clinical Health Records entitlements** | Khoa (~30 min in portal) + review-time scrutiny | Config immediate; review risk is the cost | Enable HealthKit + "Clinical Health Records" capability on the App ID (`com.zabaca.veladon`). No separate pre-approval portal queue — but App Review evaluates the `health-records` entitlement heavily at submission. Your PP + reviewer notes must justify the medical purpose. | Build with HealthKit; clinical-records review pass |

**Day-1 actions you can take this week (in any order, all independent):**
1. Confirm E1 (D-U-N-S + Apple Org enrollment status). If not verified, **start immediately** — this is the longest lead time you can't control.
2. Confirm E2 (Play Console enrollment).
3. Engage outside counsel for E3. Send them the [Brief for counsel](#brief-for-counsel) below.
4. Email Faxage for E5.
5. Confirm hosting plan for E4 (will the PP/ToS live on veladon.com? Marketing site? A separate path?).

---

## Critical path (one picture)

```
                   ┌─────────────────────────────────────────────────────┐
Week 1–2           │  E3: Legal — PP + ToS drafting (external counsel)   │  ← 1–2 wks blocking
                   │       (must cover HealthKit + clinical-records use) │
                   └─────────────────────────────────────────────────────┘
                   ┌─────────────────────────────────────────────────────┐
Week 1 (if needed) │  E1: Apple Dev Org enrollment + D-U-N-S verification│  ← 0–2 wks blocking
                   └─────────────────────────────────────────────────────┘
Week 1 ─ Week 3    ┌─────────────────────────────────────────────────────┐
                   │  Engineering (parallel with above) ~11–15 days      │
                   │  - OAuth portal keys (Apple + Google)               │
                   │  - Mobile Apple Sign-In wire                        │
                   │  - Mobile Google Sign-In wire                       │
                   │  - Account deletion (API + UI)                      │
                   │  - Onboarding consent screen + 18+ gate             │
                   │  - Config gaps (icons, keystore, Updates URL)       │
                   │  - HealthKit regular read-only integration   (~3d)  │
                   │  - HealthKit clinical records (FHIR) + entitlement  │
                   │    (~6–8d, highest review risk)                     │
                   └─────────────────────────────────────────────────────┘
Week 3 ─ Week 4    ┌─────────────────────────────────────────────────────┐
                   │  Metadata + screenshots + Data Safety declarations  │
                   │  Host PP/ToS at veladon.com/{privacy,terms} (E4)     │
                   │  Record HealthKit demo video for reviewers          │
                   └─────────────────────────────────────────────────────┘
Week 4             ┌─────────────────────────────────────────────────────┐
                   │  TestFlight beta + Google internal track            │
                   │  Internal smoke (esp. HealthKit on physical device);│
                   │  fix any blockers                                   │
                   └─────────────────────────────────────────────────────┘
Week 4–6           ┌─────────────────────────────────────────────────────┐
                   │  Submit to App Review + Play Production             │
                   │  Apple: ~24–72h base, BUT clinical-records review   │
                   │  commonly triggers 1–2 extra rounds → budget 1–2 wk │
                   │  Google: ~1–7 days (+ Health Connect data decl.)    │
                   └─────────────────────────────────────────────────────┘
```

**Fastest realistic submission *with HealthKit*:** ~4 weeks if D-U-N-S done + counsel responsive. Public availability ~5–7 weeks (the clinical-records review tier is the variable — Apple scrutinizes `health-records` access heavily and extra rounds are common). For comparison, without HealthKit this was ~2.5 weeks to submit / ~3–4 weeks to availability.

---

## Brief for counsel

Engage outside counsel this week. Brief them on:

**Regulatory positioning (v1):**
- **Strictly B2C**. Patients self-register and use the app to manage their own records. No hospital/clinic B2B customers in v1.
- Our regulatory bucket is therefore **Personal Health Record (PHR) vendor**, not HIPAA Covered Entity and not HIPAA Business Associate (under a strict reading; counsel to confirm). HHS PHR guidance plus state-specific PHR/medical-records laws govern.
- **18+ only.** Account creation refuses users under 18 (computed from DOB at signup). COPPA out of scope by construction.
- US-only operation in v1.

**Data handled:**
- User-provided medical/identity data: last-4 of SSN (**optional**), DOB, mailing address, phone, email, name
- Medical record request metadata + sensitive categories (HIV, mental health, substance use, reproductive health, psychotherapy)
- Patient-Designated Agent (PDA) model: patients can grant other users delegated access to their records under per-relationship permissions
- Uploaded medical documents (PDFs, images) — content not parsed by us
- **Apple HealthKit data (READ-ONLY)**: vitals, activity, sleep — read from the user's on-device Health store with explicit consent. No write-back.
- **Apple Clinical Health Records (FHIR, READ-ONLY)**: lab results, medications, conditions the user has connected from their providers via Apple Health. **Apple's HealthKit terms forbid using this data for advertising, marketing, data-mining, or sale, and forbid storing it in iCloud** — counsel should confirm our PP commits to these restrictions and clarifies whether/how HealthKit-sourced data leaves the device to our backend.

**Data hosted by:**
- Cloudflare R2 (object storage — uploaded documents)
- Turso/libSQL (relational DB — all structured data)
- Resend (email — has BAA already signed; canned-template content only)
- Ably (realtime signaling — IDs only, no PHI on wire by design)
- Faxage (faxing — confirm BAA/DPA status as part of E5)
- Vercel (hosting; processes PHI in-memory during request handling)

**Security posture:**
- Field-level encryption: last-4 SSN + DOB (AES-256-GCM)
- TLS in transit; default object-store encryption at rest
- Field-level encryption keys to be wiped on account deletion (cryptographic erasure)
- Append-only audit log (planned — see `planning/launch` adjacent v2 realtime work)

**Outputs needed from counsel:**
- Privacy Policy URL: `https://veladon.com/privacy`
- Terms of Service URL: `https://veladon.com/terms`
- (Optional but recommended) Notice of Privacy Practices URL: `https://veladon.com/notice-of-privacy-practices`
- Confirmation of PHR-vendor regulatory bucket (or correction)
- Concrete data-retention period after account deletion — drives `RETENTION_YEARS` constant
- Cookie / tracking disclosure (we use none for tracking — no GA, no FB pixel, etc.)

These URLs go into App Store Connect, Play Console, and the Google OAuth consent screen.

---

## Context

We want Veladon (`com.zabaca.veladon`, developed by Zabaca) submitted to the Apple App Store and Google Play as fast as realistically possible. **Note: the product is rebranding from "HealthAgent" to "Veladon" — the company/developer stays Zabaca, and the internal repo + Xcode target keep the `health-agent`/`HealthAgent` names (not user-visible).** Audit of the current state:

**Good news — most scaffolding is in place:**
- Web: Apple + Google OAuth providers already wired in Auth.js v5 (`apps/web/src/auth.ts:150-159`), with token verification helpers and mobile-specific endpoints `/api/auth/apple/mobile` + `/api/auth/google/mobile` ready to accept identity tokens
- DB schema has `appleId` and `googleId` columns on `users` already
- Mobile bundle ID/display name configured (`apps/mobile/app.json`, `Info.plist`)
- EAS Build profiles configured (`apps/mobile/eas.json`)
- Privacy Manifest (`PrivacyInfo.xcprivacy`) present
- Field-level AES-256-GCM encryption already in place for last-4 SSN + DOB
- An `docs/app-store-checklist.md` already exists with portal setup tasks

**Blockers / gaps for first submission:**
- Mobile UI: Apple/Google Sign-In buttons are no-op stubs — native SDKs not installed; `useAuth.ts` lacks `signInApple` / `signInGoogle`
- No account-deletion endpoint or UI (Apple hard-requirement since 2022)
- No ToS / Privacy Policy consent in onboarding
- iOS App Icon: only the 1024×1024 — needs full size matrix
- Android: still using debug keystore for release builds
- Expo Updates URL is still the `FILL_IN_PROJECT_ID` placeholder
- HealthKit usage descriptions are declared but no HealthKit code exists yet → must build the actual read-only + clinical-records integration so the declared permissions are backed by real, reviewable functionality (Apple rejects apps that request Health permissions without a working use). The unused write string (`NSHealthUpdateUsageDescription`) must be removed since we ship read-only.
- No privacy policy or terms of service hosted yet
- App Store metadata + screenshots not produced

---

## Part 1 — OAuth portal setup (getting the keys)

You said you have the Apple + Google accounts. The mobile/web code expects these env vars; below is exactly how to mint them.

### 1.1 Apple — Sign in with Apple

**You need:**
- `AUTH_APPLE_ID` — the Services ID (web) and the Bundle ID (mobile use the same Apple sign-in but mobile uses the native flow; the backend verifies via `verifyAppleIdentityToken` regardless)
- `AUTH_APPLE_SECRET` — a signed JWT generated from your `.p8` private key

**Steps:**

1. **Apple Developer portal** → https://developer.apple.com/account/resources/identifiers/list
2. **Create an App ID** (if not already done):
   - Identifiers → `+` → App IDs → App
   - Bundle ID: `com.zabaca.veladon` (explicit, not wildcard)
   - Description: "Veladon"
   - Capabilities: enable **Sign in with Apple** and **HealthKit**. That's all for HealthKit at the App ID level — **there is NO separate "Clinical Health Records" capability in the portal.** Clinical-records access is an *entitlement* added later in Xcode (Signing & Capabilities → HealthKit → check "Clinical Health Records") or directly in the entitlements file as `com.apple.developer.healthkit.access = ["health-records"]` (see §3.7). App Review verifies the clinical-records use (and that the app's primary purpose is health-related) at submission — not in the portal.
   - Continue → Register
3. **Create a Services ID** (needed for web OAuth):
   - Identifiers → `+` → Services IDs
   - Description: "Veladon Web"
   - Identifier: `com.zabaca.veladon.web` (must be different from the App ID)
   - Continue → Register
   - Click the new Services ID → enable **Sign in with Apple** → Configure:
     - Primary App ID: select `com.zabaca.veladon`
     - Domains: `veladon.com` (and `app.veladon.com` if that's where the web app lives). **Real, verifiable domains only — Apple won't accept `localhost` or IP addresses, and the domain must be HTTPS + verified.**
     - Return URLs: `https://veladon.com/api/auth/callback/apple` only. **No `http://`, no `localhost`** — Apple rejects them (unlike Google). HTTPS + real domain required.
   - Save → Continue → Register
   - **Local dev of web Apple sign-in:** since localhost is disallowed, either (a) run an **ngrok / Cloudflare Tunnel** to get an `https://*.ngrok-free.app` URL and add it as an extra Domain + Return URL while developing, or (b) test Apple web sign-in against staging/prod. The **mobile** flow is unaffected — `expo-apple-authentication` uses the native dialog and returns the identity token directly, with no Return URL.
4. **Create a Sign in with Apple key** (the `.p8`):
   - Keys → `+`
   - Key Name: "Veladon Apple Sign In"
   - Enable **Sign in with Apple** → Configure → Primary App ID: `com.zabaca.veladon` → Save
   - Continue → Register → **Download** the `.p8` file (you get one chance; back it up to 1Password)
   - Note the **Key ID** (10-char alphanumeric) and your **Team ID** (from Membership page)
5. **Generate the client secret JWT** (Auth.js wants a signed JWT, not the raw `.p8`):
   - This JWT must be regenerated every ~6 months (Apple max 6mo). Two options:
     - **Manual once**: use a one-liner script with the `jose` library (`generate-apple-client-secret.ts` in `apps/web/scripts/`). Apple accepts ES256-signed JWT with claims: `iss=<TeamID>`, `iat=now`, `exp=now+15777000` (~6mo), `aud="https://appleid.apple.com"`, `sub=<ServicesID>`. Header: `kid=<KeyID>`, `alg=ES256`.
     - **Auto on each app start**: have Auth.js compute it lazily (small wrapper in `auth.ts`). Cleaner; recommended.
6. **Server-to-Server (S2S) Notification Endpoint — DEFER, configure later** (on the primary App ID `com.zabaca.veladon` → Sign in with Apple settings):
   - **Optional at registration. Leave blank now** — it's not required to register the App ID or to ship Sign in with Apple. The field is editable anytime later.
   - Set it only once the endpoint is built + deployed (§3.1b): URL `https://veladon.com/api/auth/apple/notifications` (production, absolute, HTTPS, TLS 1.2+; one URL per app group). Entering a URL before the endpoint exists just makes Apple hit a dead endpoint.
   - This is where Apple POSTs signed events for `consent-revoked`, `account-delete`, and `email-enabled`/`email-disabled`.
   - localhost is not reachable by Apple — for dev testing use an ngrok tunnel; otherwise rely on staging/prod.
7. **Set env vars** (Vercel production env + local `.env`):
   - `AUTH_APPLE_ID` = `com.zabaca.veladon.web` (Services ID — for web flow)
   - `AUTH_APPLE_SECRET` = the JWT from step 5
   - For mobile: no extra env — `verifyAppleIdentityToken` in `apps/web/src/lib/oauth-verify.ts:16-29` already validates via Apple's JWKS using the bundle ID (`com.zabaca.veladon`) as the audience
   - The S2S endpoint also verifies against Apple's JWKS (no shared secret needed — the JWS signature is the auth)

### 1.2 Google — Sign in with Google

**You need:**
- `AUTH_GOOGLE_ID` — Web OAuth client ID
- `AUTH_GOOGLE_SECRET` — Web OAuth client secret
- An iOS OAuth client ID (for the `expo-auth-session` flow on iOS)
- An Android OAuth client ID (for the `expo-auth-session` flow on Android)

**Steps:**

1. **Google Cloud Console** → https://console.cloud.google.com/
2. **Create / select a project**: "Zabaca Veladon"
3. **OAuth consent screen**:
   - APIs & Services → OAuth consent screen
   - User Type: **External** (unless you're paying for Workspace)
   - Fill in: app name "Veladon", user support email, developer contact email, app logo (512×512 PNG with transparency)
   - App domain: `veladon.com`. Privacy policy URL: `https://veladon.com/privacy`. Terms URL: `https://veladon.com/terms`.
   - Authorized domains: `veladon.com`
   - Scopes: `email`, `profile`, `openid` (the basics — nothing health-related)
   - Test users: add yourself + QA emails (this lets you log in while in "Testing" mode)
   - **Submit for verification** when ready to go to "Production" (takes ~1–4 weeks; you can submit to App Stores while Google verification is in progress — Apple doesn't require Google's verification to be complete)
4. **Create OAuth credentials**:
   - APIs & Services → Credentials → `+ CREATE CREDENTIALS` → OAuth client ID
   - **Web application** (for the Next.js web app):
     - Name: "Veladon Web"
     - Authorized JavaScript origins: `https://<your-prod-url>`, `http://localhost:3000`
     - Authorized redirect URIs: `https://<your-prod-url>/api/auth/callback/google`, `http://localhost:3000/api/auth/callback/google`
     - Copy the Client ID → `AUTH_GOOGLE_ID`. Copy the Client secret → `AUTH_GOOGLE_SECRET`.
   - **iOS** (for mobile via `expo-auth-session`):
     - Name: "Veladon iOS"
     - Bundle ID: `com.zabaca.veladon`
     - Copy the Client ID → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in `apps/mobile/.env`
   - **Android** (for mobile via `expo-auth-session`):
     - Name: "Veladon Android"
     - Package name: `com.zabaca.veladon`
     - SHA-1 certificate fingerprint: **of the release keystore** (generated in Part 3.5; come back here once you have it)
     - Copy the Client ID → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` in `apps/mobile/.env`
5. **Set env vars** (Vercel production env + local `.env` + mobile `.env`):
   - Web: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   - Mobile (will be embedded in the app bundle at build time): `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

---

## Part 2 — Special submission requirements for a health app

This app stores the last 4 digits of SSN (optional), DOB, medical record requests, sensitive categories (HIV, mental health, substance use, etc.), and uploads medical documents to R2. Apple and Google both treat this with extra scrutiny.

**Our regulatory bucket in v1: Personal Health Record (PHR) vendor**, not a HIPAA Covered Entity or Business Associate (strictly B2C, no provider/clinic contracts). HHS PHR guidance + state medical-record laws govern. Counsel to confirm — we adopt HIPAA-aligned practices voluntarily for defense-in-depth and option-value for future B2B.

### 2.1 Apple-specific (App Store Review Guidelines)

| Guideline | What it means for us | Action |
|---|---|---|
| **1.4.1 — Physical Harm** | Medical info must be accurate. Don't claim diagnosis/treatment. | Marketing copy: avoid words like "diagnoses", "treats", "cures". Use "manage your records", "share with providers". |
| **5.1.1(v) — Account Sign-In** | Apps with accounts must offer in-app account deletion since 2022 | Implement DELETE `/api/me` + settings UI (Part 3.3) |
| **4.8 — Sign in with Apple** | If you offer ANY third-party SSO (Google), you MUST also offer Sign in with Apple at equal prominence | We're shipping both — ✓ |
| **5.1.3 — Health and Health Research** | Health apps must explain why permissions are needed; can't share user data with third parties for marketing | Privacy policy must explicitly disclose this; usage descriptions must be specific |
| **5.1.3(a) — HealthKit data use** | HealthKit data (incl. clinical records) must NOT be used for advertising, marketing, data-mining, or sale; must NOT be written falsely; must NOT be stored in iCloud | Hard commitment in the PP + a real architectural guarantee. If HealthKit data goes to our backend, the PP must say so and say why |
| **5.1.3(b) — Clinical Health Records** | The `health-records` entitlement is the highest-scrutiny HealthKit tier. App's primary purpose must be health; data use is restricted as above | Justify the medical purpose in App Review notes; expect close review + possibly 1–2 extra rounds |
| **2.5.1 — Complete functionality** | Can't request HealthKit/clinical-records permission for a stub feature | The HealthKit + clinical-records read-only flows must be complete and demonstrable, not placeholders. Request read authorization only (no `toShare`/write) so there are no unused permissions |
| **5.1.1(ix) — Data Minimization** | Don't collect more than you need | We already store only last-4 SSN and it's optional — call this out in the PP to pre-empt review questions. Request only the specific HealthKit data types we actually use |
| **Privacy Nutrition Labels** | Must declare every data type collected, with linkage + tracking flags | Fill out App Store Connect → App Privacy (Part 4.3), including Health & Fitness + Clinical data |
| **Privacy Manifest** | iOS Privacy Manifest required since 2024 | Already present at `apps/mobile/ios/HealthAgent/PrivacyInfo.xcprivacy` ✓ — extend with any HealthKit-related accessed-API reasons if needed |
| **Export compliance** | We use AES-256-GCM | Answer "Uses non-exempt encryption: YES" in App Store Connect; AES is on the exempt list (mass-market). No CCATS needed. Document why exempt. |

**Health app review surprises to plan for:**
- Apple may ask **what jurisdictions** you operate in and **what legal basis** authorizes health-data handling. Answer: US-only, PHR vendor (your privacy policy should clarify).
- Apple may ask for a **test account** with sample data — provide a non-PHI test account in the App Review notes (E10).
- **HealthKit feature testability is the #1 clinical-records rejection cause.** Reviewers often can't populate Health/clinical data in their test environment. Provide a **demo video** (E10) showing the HealthKit read + clinical-records flows working on a real device, plus written steps to reproduce.
- Apple may ask for a demonstration of the patient → release-creation → PDA-acceptance flow too. Bundle it into the same demo video.
- **Clinical-records (`health-records`) review commonly triggers extra back-and-forth rounds.** Budget 1–2 weeks of review iteration, respond same-day, and keep the justification tight: "users connect their own clinical records from their providers to view and manage them; data is not used for any secondary purpose."

### 2.2 Google Play–specific

| Requirement | Action |
|---|---|
| **Data Safety form** | Mirror the Apple App Privacy declarations; Play UI is more rigid — fill every field |
| **Health Apps policy** | https://support.google.com/googleplay/android-developer/answer/9888076 — disclose data handling, no deceptive claims |
| **Sensitive permissions** | We don't request SMS, Call Log, or All Files Access. **HealthKit is iOS-only** — the Android build ships without health-sync in v1. **Decided: iOS-only HealthKit in v1; Android Health Connect is a post-launch fast-follow.** So the v1 Play submission does NOT touch Google's restricted health-data review. |
| **Health data declaration (deferred)** | Google requires a Health Apps declaration form + demo video for restricted health permissions | Applies only when Health Connect lands post-launch — not a v1 Play blocker |
| **Target API level** | Play requires targeting Android 14 (API 34) for new apps in 2024+; bump in `apps/mobile/android/app/build.gradle` if currently lower |
| **App signing by Google Play** | Recommended; upload keystore once, Google stores the upload key |
| **Pre-launch report** | Free automated test runs in Play Console; surfaces crashes before review |

---

## Part 3 — Engineering work breakdown

### 3.1 Mobile Apple Sign-In + S2S notifications (~1.5 days)

#### 3.1a Client wire-up (~1 day)

**Files to touch:**
- `apps/mobile/package.json` — add `expo-apple-authentication`
- `apps/mobile/src/hooks/useAuth.ts` — add `signInApple()` method; update `AuthState` type; persist returned session JWT identically to `signInEmail`
- `apps/mobile/src/screens/SignIn.tsx` — wire the Apple button's `onPress` (currently no-op)
- `apps/mobile/src/screens/CreateAccount.tsx` — same wiring
- `apps/mobile/app.json` — add `expo-apple-authentication` to `plugins` array

**Flow:**
1. User taps Apple button → `AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL] })`
2. Native dialog → returns `{ identityToken, fullName, email }`
3. POST `identityToken` (and optionally `fullName`, `email`) to `/api/auth/apple/mobile`
4. Backend (existing) verifies via JWKS, upserts user, returns session JWT
5. Persist JWT to `expo-secure-store` (same path as email login)

Sign-in token-exchange backend already in place — no changes needed for the sign-in flow itself.

#### 3.1b Server-to-server (S2S) notification endpoint (~0.5 day) — NEW

Apple sends signed notifications to one endpoint per app group when a user's relationship with the app changes. Handling these keeps our account state honest (and reinforces the account-deletion compliance story in §3.3 — the *inbound* deletion path).

**Portal config** (deferred from Part 1.1 — do it *here*, once this endpoint is deployed): set the **Server-to-Server Notification Endpoint** on the primary App ID to a production HTTPS URL, e.g. `https://veladon.com/api/auth/apple/notifications`. Absolute URL, scheme+host+path, TLS 1.2+. Leave it blank at App ID registration; set it only after deploy. localhost won't work — test via a tunnel (ngrok) or in staging/prod.

**File to add:**
- `apps/web/src/app/api/auth/apple/notifications/route.ts` (new) — `POST` handler:
  1. Body arrives as `{ payload: <JWS> }` — a JWT signed by Apple
  2. Verify the JWS against Apple's JWKS (`https://appleid.apple.com/auth/keys`) — reuse/extend the JWKS verification already in `apps/web/src/lib/oauth-verify.ts`
  3. Validate `iss = https://appleid.apple.com`, `aud =` our client/bundle ID, and `iat`/`exp`
  4. Read the event `type` and `sub` (the Apple user id = our stored `users.appleId`)
  5. Route by `type`:
     - `consent-revoked` — user disconnected Sign in with Apple → revoke all the user's sessions (sign out everywhere); leave the account otherwise intact so they can re-auth
     - `account-delete` — user deleted their Apple account / removed our app's connection → trigger the §3.3 account-deletion flow (`softDeleteAccount`) for the user whose `appleId === sub`
     - `email-disabled` / `email-enabled` — user toggled private-relay email forwarding → update stored email-forwarding state; relay address may change, so don't assume the stored email still delivers
  6. `writeAudit(...)` for every notification (type + sub-derived userId + status) — HIPAA audit + traceability
  7. Return `200` quickly; Apple expects a prompt ack

**Notes:**
- This endpoint is **unauthenticated** at the session layer (Apple calls it, not a logged-in user) — the JWS signature IS the auth. Do NOT gate it behind session middleware; DO reject any payload that fails signature/claim validation.
- One endpoint per app group; the same URL covers the Services ID (web) and the bundle (mobile) since both share the Apple user `sub`.
- `account-delete` from Apple should reuse the exact same `softDeleteAccount` helper as the in-app deletion (§3.3) so the tombstone/retention behavior is identical regardless of where deletion was initiated.

### 3.2 Mobile Google Sign-In (~1 day)

**Files to touch:**
- `apps/mobile/package.json` — add `expo-auth-session`, `expo-web-browser`, `expo-crypto`
- `apps/mobile/src/hooks/useAuth.ts` — add `signInGoogle()` method
- `apps/mobile/src/screens/SignIn.tsx` + `CreateAccount.tsx` — wire buttons
- `apps/mobile/app.json` — add `expo-auth-session` config (URL scheme already present: `zabaca`)
- `apps/mobile/.env` — `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

**Flow (via `Google.useIdTokenAuthRequest` from `expo-auth-session`):**
1. User taps Google button → system browser opens Google consent
2. Returns `id_token` to the app via the registered URL scheme
3. POST to `/api/auth/google/mobile` (existing) → backend verifies → session JWT
4. Persist to secure store

### 3.3 Account deletion + HIPAA-aligned retention (~1.5 days) — APPLE BLOCKER

**Why this is more than a soft-delete:** Apple's 5.1.1(v) requires in-app account deletion, but **explicitly allows retaining data required by law**. HIPAA mandates a 6-year retention floor for covered-entity / business-associate documentation; state medical-record laws often require longer (commonly 7–10 years for adults; minors typically until age of majority + N years). The deletion implementation has to satisfy both.

#### Architectural pattern: anonymize → tombstone → retention timer → hard-delete

When a user requests deletion, we do **not** hard-delete their row. Instead:

1. **Sever access** (immediate):
   - `users.disabled = true`
   - `users.deletedAt = now()`
   - Revoke every active session
   - Revoke every PDA grant where this user is the patient
   - Block re-login under the user's prior credentials
2. **Scrub identifying fields** (immediate) — replace with anonymized placeholders so the row can still satisfy FKs but holds no PII:
   - `users.email` → `deleted+{userId}@invalid.local` (frees the email for re-registration)
   - `users.firstName / middleName / lastName` → `null`
   - `users.phoneNumber / address` → `null`
   - **Cryptographic erasure** of last-4 SSN + DOB: delete the per-user encryption key (or rotate the master key + drop this user's wrapping). The encrypted blobs in the DB become permanently unreadable bytes — no scrub-write needed, and more defensible than zero-overwrite under HIPAA breach-notification rules.
   - `users.avatarUrl` → delete the file from R2; set field to `null`
3. **Tombstone records** (persist for retention window):
   - Releases, providers, incomingFiles, fileUploadLog, releaseRequestLog, audit log: **keep, with `actorUserId` still pointing at the tombstoned row** so audit queries work. The records carry no PII directly other than what's already in them — uploaded documents in R2 should be re-keyed or anonymized in the same pass.
   - Uploaded medical documents: replace filenames containing the user's name with `[deleted]-{recordId}.pdf` (or similar). Document content itself stays — that's the legally required record.
4. **Retention timer** (deferred hard-delete):
   - Cron job (daily) finds `users` rows where `deletedAt + RETENTION_YEARS < now()` AND no linked record exists with retention not yet expired → hard-delete the row + cascade-delete any records also past their retention floor.
   - `RETENTION_YEARS` is a config constant; counsel sets the value. Use 6 years as a placeholder until counsel confirms (see [open questions](#account-deletion-open-questions)).
5. **Confirmation**:
   - Send confirmation email to the (now-invalid) old email at the moment of deletion (one last legitimate use of it)
   - Return 204

#### What happens when "they" return

| Scenario | Result |
|---|---|
| Same email, wants new account | Email was renamed on deletion → free to register again. The new account is a totally separate `users` row with no link to old data. No way to recover prior data. |
| Different email, wants new account | Totally fresh account. We don't try to detect they're the same human (would defeat the deletion guarantee). |
| "Can I restore my old account?" | **No.** The delete-confirmation UI says this explicitly. If we ever offered restoration we'd violate the deletion guarantee Apple is asking us to make. |

In all three cases the tombstoned data is unreachable to any normal user surface — only accessible via ops queries during an audit, compliance request, or breach investigation.

#### Files to add

- `apps/web/src/app/api/me/route.ts` — `DELETE` handler implementing the 5-step pattern above
- `apps/web/src/lib/account-deletion.ts` — `softDeleteAccount(userId)` helper containing the scrub + tombstone logic (testable in isolation)
- `apps/web/src/lib/crypto.ts` — extend with `revokeUserKey(userId)` for the cryptographic-erasure step (depends on whether the existing encryption is single-key or per-user; if single-key, this is a bigger change and we instead overwrite the SSN/DOB ciphertext with random bytes)
- `apps/web/scripts/retention-sweep.ts` (or a Vercel Cron route) — daily job that hard-deletes tombstoned rows past retention
- **No schema change for the soft-delete flags** — `users.deletedAt` (text, nullable) and `users.disabled` (boolean) **already exist on `main`** (`apps/web/src/lib/db/schema.ts:333` and `:35`, landed with the merged PDA work). No new migration needed here; just use them.
- `apps/web/src/app/settings/page.tsx` (or wherever settings live) — "Delete my account" section with a 2-step confirmation modal:
  - Step 1: warning text — "Your account will be deleted. Records you've created will be retained for {RETENTION_YEARS} years to comply with health-records law, but no one — including you — will be able to access them through this app. This cannot be undone."
  - Step 2: type "DELETE" to confirm → POST DELETE `/api/me`
- `apps/mobile/src/screens/Settings.tsx` — mirror the same flow

#### Account deletion: open questions for counsel

Resolved decisions (in this rev):
- Strictly B2C → **PHR vendor**, not BA. HIPAA's 6-year retention floor doesn't bind us as an entity; state medical-record laws drive the floor.
- 18+ only → no minors retention math to worry about in v1.

Remaining for counsel:
1. **Confirm PHR-vendor classification** (or correct it if any v1 detail pushes us into a different bucket).
2. **Concrete retention period.** Driven by state law in the markets we operate in. Common defaults: 6 years (HIPAA-aligned), 7 years (conservative), 10 years (some states). Counsel picks a single number → drives `RETENTION_YEARS`.

Until counsel answers, the implementation uses `RETENTION_YEARS = 7` as a conservative default (HIPAA floor + 1 year buffer for state-law variation). This number is a single constant and trivially changed when counsel decides.

### 3.4 Onboarding consent screen + age gate (~0.75 day)

**Consent checkboxes:**
- Add a step to `apps/mobile/src/components/onboarding/OnboardingModal.tsx` (and web equivalent) with two checkboxes:
  - "I agree to the [Terms of Service](url)"
  - "I agree to the [Privacy Policy](url)"
- Persist `users.consentedAt` timestamp + `users.consentVersion` string in a new schema column
- Block onboarding completion until both checked

**18+ age gate:**
- DOB is collected at signup (existing field) → compute age = `today - dateOfBirth` in years
- If age < 18: reject with clear message ("Veladon is currently available to adults 18 and over. We'll add support for younger users in a future release.")
- Enforce server-side (in the signup route) AND client-side (in the form) — server-side is the actual gate
- Add a Zod refinement on the profile schema in `packages/types/src/schemas/profile.ts`
- This sidesteps COPPA (covers under-13) by construction and avoids minors-retention math
- Account-deletion + signup paths should both honor this; no special handling for minors needed in v1

### 3.5 Mobile config gaps + bundle-ID rename (~0.75 day)

- **Bundle ID / package rename → `com.zabaca.veladon`** (was `com.zabaca.healthagent`). Clean to do pre-launch (never submitted). Touches:
  - `apps/mobile/app.json` — `ios.bundleIdentifier` + `android.package`
  - `apps/mobile/ios/` — Xcode project `PRODUCT_BUNDLE_IDENTIFIER` (all build configs), `Info.plist` `CFBundleIdentifier`, URL scheme entries
  - `apps/mobile/android/app/build.gradle` — `applicationId` (and `namespace` if set); `AndroidManifest.xml` intent-filter host if it referenced the old ID
  - Any deep-link / OAuth redirect that hard-codes the old ID
  - **Display name → "Veladon"** (full rebrand, decided): set `CFBundleDisplayName` (iOS) + Android `app_name` label + `app.json` `expo.name`. The internal Xcode *target directory* `apps/mobile/ios/HealthAgent/` stays as-is — it's never user-visible, and renaming it is a native-refactor risk not worth taking for v1. So file paths in this plan keep `ios/HealthAgent/`.
- **iOS App Icon full set**: run `npx app-icon generate` or use https://www.appicon.co/ to expand the 1024×1024 into the full Xcode asset set. Replace `apps/mobile/ios/HealthAgent/Images.xcassets/AppIcon.appiconset/`.
- **Android release keystore** (one-time):
  ```
  keytool -genkey -v -keystore health-agent.keystore \
    -alias health-agent -keyalg RSA -keysize 2048 -validity 10000
  ```
  Store the `.keystore` in 1Password. Update `apps/mobile/android/app/build.gradle` `signingConfigs { release { … } }` to reference it via env vars (`ANDROID_KEYSTORE_PATH`, `_ALIAS`, `_PASSWORD`, `_KEY_PASSWORD`). Compute the SHA-1 fingerprint (`keytool -list -v -keystore health-agent.keystore`) → paste into Google Cloud Console Android OAuth client.
- **Expo Updates project ID**: `cd apps/mobile && npx eas init` — writes `extra.eas.projectId` into `app.json`. Replace `https://u.expo.dev/FILL_IN_PROJECT_ID` with `https://u.expo.dev/<projectId>`.

### 3.6 HealthKit — regular read-only integration (~3 days, iOS only)

HealthKit is iOS-only. The Android build ships with feature parity *minus* Health sync (see Google Play section — Health Connect is a recommended fast-follow, not v1).

**Library choice:** `@kingstinct/react-native-healthkit` — modern, TypeScript-first, and (critically) it supports **both** regular HealthKit quantity types **and** clinical records (`HKClinicalType`), so one dependency covers 3.6 and 3.7. Expo bare workflow + EAS dev build handles the native side via its config plugin. (`react-native-health` is the older alternative but clinical-records support is weaker.)

**Files to touch:**
- `apps/mobile/package.json` — add `@kingstinct/react-native-healthkit`
- `apps/mobile/app.json` — add the HealthKit config plugin; KEEP `NSHealthShareUsageDescription` (read); **remove `NSHealthUpdateUsageDescription`** (no write)
- `apps/mobile/ios/HealthAgent/HealthAgent.entitlements` — add `com.apple.developer.healthkit` = true (and the access array — see 3.7)
- `apps/mobile/src/lib/health/healthkit.ts` (new) — wrapper: request **read-only** authorization (`toRead` only, no `toShare`), read quantity samples (steps, heart rate, sleep, etc.)
- `apps/mobile/src/screens/` — dashboard widget(s) showing the read data; a settings toggle to connect/disconnect HealthKit

**Flow:**
1. User opts in (settings or onboarding) → request HealthKit **read** authorization for the specific types we surface
2. Read the authorized quantity types → display on dashboard
3. Respect Apple's data-use rules: no advertising/marketing/mining; no iCloud storage of HealthKit data

**Review-sensitive:** request ONLY the data types we actually surface, read-only. Requesting broad or write access for a thin feature invites a 2.5.1 rejection.

### 3.7 HealthKit — Clinical Health Records / FHIR (~6–8 days, iOS only) — HIGHEST REVIEW RISK

Clinical records (lab results, medications, conditions, immunizations, allergies) are read-only and arrive as FHIR resources the user has connected from their providers through Apple Health.

**Files to touch:**
- `apps/mobile/ios/HealthAgent/HealthAgent.entitlements` — add `health-records` to the HealthKit access array: `com.apple.developer.healthkit.access = ["health-records"]`
- `apps/mobile/app.json` — add `NSHealthClinicalHealthRecordsShareUsageDescription` (the clinical-records-specific usage string; distinct from the regular share string)
- `apps/mobile/src/lib/health/clinical-records.ts` (new) — request clinical-records authorization; query `HKClinicalType` records; parse the FHIR JSON payloads (each clinical record carries a `fhirResource` with versioned FHIR JSON)
- `apps/mobile/src/screens/` — a "Connected clinical records" view; map FHIR resource types (DiagnosticReport, MedicationOrder/MedicationStatement, Condition, AllergyIntolerance, Immunization) to display rows

**Constraints (Apple-enforced):**
- Read-only. You cannot write clinical records.
- The user connects their providers in Apple Health (Health app → Browse → Health Records), not in our app. We can only read what they've already connected + authorized.
- Data-use restrictions from 5.1.3(a) apply with full force. If clinical-records data is sent to our backend, the PP must state it explicitly and justify it; consider keeping clinical-records processing on-device where feasible to minimize review risk.
- Apple verifies the app's primary purpose is health — ours qualifies, but expect close review.

**Demo for reviewers (critical — see E10):** clinical records are nearly impossible for a reviewer to populate. Record a device demo showing connected records flowing into the app, and write reproduction steps. This single artifact is the difference between approval and a "couldn't test" rejection.

### 3.8 (was 3.6) Confirm HealthKit declarations are backed by real features (~0.25 day)

The opposite of the old plan: instead of stripping `NSHealth*` strings, **verify each declared permission maps to a working feature** before submission:
- `NSHealthShareUsageDescription` → backed by 3.6 read flow ✓
- `NSHealthUpdateUsageDescription` → **removed** (we ship read-only; no write path)
- `NSHealthClinicalHealthRecordsShareUsageDescription` → backed by 3.7 ✓
- Each usage string is specific (says what we read and why), not generic
- `grep -ri "NSHealth" apps/mobile/` should show exactly TWO strings (Share + ClinicalHealthRecordsShare), no Update string

---

## Part 4 — App Store / Play Store metadata + screenshots

### 4.1 Required text (App Store + Play)

| Field | Spec | Notes |
|---|---|---|
| **App name** | iOS: ≤30 chars · Android: ≤30 chars | "Veladon" (7) — set as CFBundleDisplayName (iOS) + Android label; was "HealthAgent" |
| **Subtitle** (iOS only) | ≤30 chars | e.g. "Your health records, with you" |
| **Short description** (Android only) | ≤80 chars | One sentence pitch |
| **Description** | ≤4000 chars | Long-form. Lead with the problem solved, then features. Avoid medical-claim language. |
| **Keywords** (iOS only) | ≤100 chars, comma-separated | health,records,patient,medical,provider,release,hipaa (mind App Store keyword optimization) |
| **Promotional text** (iOS only) | ≤170 chars | Updatable without resubmission |
| **What's New** | ≤4000 chars | "Initial release" for v1 |
| **Support URL** | URL | `https://veladon.com/support` |
| **Marketing URL** (optional) | URL | `https://veladon.com` |
| **Privacy Policy URL** | URL | `https://veladon.com/privacy` |
| **Category** | iOS primary: Medical or Health & Fitness · Android: Medical | "Medical" is the right category for HIPAA-adjacent apps |
| **Age rating** | iOS: 17+ (Medical/Treatment Information) likely · Android: Mature 17+ | The questionnaire will derive this from "frequent/intense medical/treatment information" answer = Yes |
| **Contact info** (iOS) | First/last name, email, phone | Public-facing reviewer contact |
| **Demo account credentials** | Email + password for an account with sample data | REQUIRED — Apple reviewers will use this. Provision in advance (E10). |
| **App review notes** | Free-form | Explain: (a) sample account details, (b) "this app handles PHI per HIPAA — no third-party tracking", (c) any non-obvious flows |

### 4.2 Screenshots

| Platform | Size | Count | Notes |
|---|---|---|---|
| iOS — iPhone 6.7" (Pro Max) | 1290×2796 | 3–10 | **REQUIRED** |
| iOS — iPhone 6.5" | 1242×2688 or 1284×2778 | 3–10 | Can reuse 6.7" via App Store auto-scale; safer to provide both |
| iOS — iPhone 5.5" | 1242×2208 | 3–10 | Apple deprecated requirement but some categories still need it; provide if asked |
| iOS — iPad 12.9" | 2048×2732 | 3–10 | **Required only if you flag iPad support** — our `app.json` has `supportsTablet: false`, so skip |
| Android — phone | 1080×1920 minimum | 2–8 | **REQUIRED** |
| Android — tablet 7"+10" | per Play spec | optional | Skip — not supporting tablet |

**Easy way to generate:** Run the app in iOS Simulator (`iPhone 15 Pro Max`) and Android emulator (`Pixel 7 Pro`), take 5–7 screenshots of: (1) sign-in screen, (2) dashboard, (3) records list, (4) release detail, (5) PDA grant flow, (6) onboarding/consent. Use a tool like `screenshots.pro` or Figma to add framed device chrome + captions if you want polish; raw simulator screenshots are acceptable for v1.

### 4.3 App Privacy / Data Safety declarations

App Store Connect → App Privacy → answer "Yes, we collect data" → declare every type below:

| Data type | Used for | Linked to user? | Tracking? |
|---|---|---|---|
| Email address | App functionality, account creation | Yes | No |
| Name | App functionality | Yes | No |
| Phone number | App functionality | Yes | No |
| Physical address | App functionality | Yes | No |
| Date of birth | App functionality (record matching) | Yes | No |
| Government ID (last 4 SSN — **optional**) | App functionality (record matching) | Yes | No |
| Health & Medical (record requests, provider info) | App functionality | Yes | No |
| Health & Fitness (HealthKit-sourced: vitals, activity, sleep) | App functionality | Yes | No |
| Health & Medical — Clinical records (HealthKit FHIR: labs, meds, conditions) | App functionality | Yes | No |
| Sensitive Info (the sensitive-category checkboxes) | App functionality | Yes | No |
| Other User Content (uploaded documents) | App functionality | Yes | No |
| User ID | App functionality | Yes | No |
| Device ID | App functionality | Yes | No |
| Crash data | App functionality | Yes? No? | No |

**Tracking = No across the board** — we don't run any cross-app advertising or analytics SDKs.

Mirror this exact matrix in Google Play Console → Data Safety.

---

## Part 5 — Timeline + go/no-go gates

| Wk | Engineering | Legal / Compliance | Portal / Submission | Gate |
|---|---|---|---|---|
| **1** | iOS icons · Android keystore · Expo Updates init · Apple Sign-In wire · Google Sign-In wire · Account deletion API+UI · Consent screen + 18+ gate | Kick off PP + ToS draft with counsel (E3) — must cover HealthKit + clinical records | Apple Dev portal: App ID (+ HealthKit + Clinical Records caps), Services ID, .p8 key (Part 1.1) · Google Cloud: OAuth clients (Part 1.2) | Auth + deletion + config done |
| **2** | **HealthKit regular read-only integration** (3.6) | Counsel drafts | — | HealthKit regular read working on a physical device |
| **2–3** | **HealthKit clinical-records (FHIR) integration** (3.7) — highest-risk surface | Counsel reviews; revise | Generate screenshots; write App Store + Play copy; fill App Privacy + Data Safety forms | Clinical records demonstrable on a physical device |
| **3–4** | Internal smoke (esp. HealthKit + clinical records on real device); bugfixes; record HealthKit demo video (E10) | Counsel signs off on PP + ToS | Publish PP + ToS at `veladon.com/{privacy,terms}` (E4) | Counsel signed off; demo video recorded |
| **4** | TestFlight build (`eas build --profile production --platform ios`); Internal Play track (`--platform android`) | — | Distribute TestFlight to internal testers; create Play Internal track | TestFlight + internal track installs working end-to-end |
| **4–5** | Hotfix TestFlight findings | — | **Submit to App Review + Play Production** via `eas submit` | Apple-reviewable build uploaded with HealthKit demo + reviewer notes |
| **5–6** | Stand by for "needs info"; respond same-day | — | Apple review — base 24–72h, but **clinical-records (`health-records`) review commonly adds 1–2 rounds**; Play review 1–7d | Approval |

**Critical-path serialized blockers:**
- E3: Legal review (1–2 wks) — **start day 1**; must cover HealthKit + clinical-records data use
- E1: D-U-N-S verification (0–2 wks) — **start day 1 if not already verified**
- HealthKit clinical-records review (Apple-gated, variable) — the dominant timeline risk; mitigate with a strong demo video + tight justification

**Fastest realistic submission *with HealthKit*:** ~4 weeks if D-U-N-S done + counsel responsive. Public availability ~5–7 weeks (clinical-records review tier is the variable). Dropping clinical records (regular HealthKit only) would pull this back to ~3 weeks to submit; dropping HealthKit entirely → ~2.5 weeks.

---

## Part 6 — Files to modify / add (engineering summary)

| File | Change |
|---|---|
| `apps/mobile/package.json` | + `expo-apple-authentication`, `expo-auth-session`, `expo-web-browser`, `expo-crypto` |
| `apps/mobile/app.json` | `expo.name` → "Veladon"; `ios.bundleIdentifier` + `android.package` → `com.zabaca.veladon`; + plugins for `expo-apple-authentication` + `@kingstinct/react-native-healthkit`; keep `NSHealthShareUsageDescription`; **remove `NSHealthUpdateUsageDescription`**; add `NSHealthClinicalHealthRecordsShareUsageDescription`; replace Updates URL placeholder |
| `apps/mobile/ios/` Xcode project + `Info.plist` | `PRODUCT_BUNDLE_IDENTIFIER` → `com.zabaca.veladon` (all configs); `CFBundleDisplayName` → "Veladon"; `CFBundleIdentifier` follows the project var |
| `apps/mobile/android/app/build.gradle` + `res/values/strings.xml` | `applicationId` → `com.zabaca.veladon`; `app_name` string → "Veladon" |
| `apps/mobile/ios/HealthAgent/Info.plist` | Keep `NSHealthShareUsageDescription`; **remove `NSHealthUpdateUsageDescription`** (read-only); add `NSHealthClinicalHealthRecordsShareUsageDescription` |
| `apps/mobile/ios/HealthAgent/HealthAgent.entitlements` | Add `com.apple.developer.healthkit` = true; `com.apple.developer.healthkit.access` = `["health-records"]` |
| `apps/mobile/package.json` | + `@kingstinct/react-native-healthkit` |
| `apps/mobile/src/lib/health/healthkit.ts` (new) | Regular HealthKit read-only wrapper (3.6) |
| `apps/mobile/src/lib/health/clinical-records.ts` (new) | Clinical-records (FHIR) read + parse (3.7) |
| `apps/mobile/ios/HealthAgent/Images.xcassets/AppIcon.appiconset/` | Add full icon size matrix |
| `apps/mobile/android/app/build.gradle` | `signingConfigs { release { … } }` referencing env-var keystore |
| `apps/mobile/src/hooks/useAuth.ts` | + `signInApple()`, `signInGoogle()`, account-delete method |
| `apps/mobile/src/screens/SignIn.tsx` + `CreateAccount.tsx` | Wire Apple + Google button `onPress` |
| `apps/mobile/src/screens/Settings.tsx` | + "Delete account" UI |
| `apps/mobile/src/components/onboarding/OnboardingModal.tsx` | + ToS/PP consent step; + 18+ age gate client-side |
| `packages/types/src/schemas/profile.ts` | + Zod refinement: reject `dateOfBirth` < 18 years ago |
| `apps/web/src/app/api/auth/register/route.ts` (or wherever signup lives) | Enforce 18+ server-side |
| `apps/web/src/app/api/auth/apple/notifications/route.ts` (new) | Apple S2S notification handler — verify JWS, route `consent-revoked` / `account-delete` / email events, audit each (§3.1b) |
| `apps/web/src/app/api/me/route.ts` (new) | DELETE handler — soft-delete + scrub + cryptographic erasure + retention timer; `account-delete` S2S reuses the same `softDeleteAccount` helper |
| `apps/web/src/lib/account-deletion.ts` (new) | Tombstone + anonymize helper, callable from DELETE handler |
| `apps/web/scripts/retention-sweep.ts` (new) | Daily cron — hard-delete tombstones past RETENTION_YEARS |
| `apps/web/src/app/settings/page.tsx` (or equivalent) | + "Delete account" UI |
| `apps/web/src/lib/db/schema.ts` | + `consentedAt`, `consentVersion` on `users` |
| `apps/web/drizzle/0026_user_consent.sql` (new) | Migration for the two columns |
| `apps/web/src/auth.ts` | (Optional) wrap Apple secret generation in a lazy helper so the `.p8` is the source of truth, not a stale JWT |
| `apps/web/scripts/generate-apple-client-secret.ts` (new) | If going the manual route for the JWT |
| `docs/app-store-checklist.md` | Update with the items completed; add the OAuth portal steps cross-reference |

## Part 7 — Reused / existing pieces (no changes needed)

- `apps/web/src/auth.ts:150-159` — Apple + Google providers already wired
- `apps/web/src/lib/oauth-verify.ts:16-29, 36-50` — `verifyAppleIdentityToken` + `verifyGoogleIdToken` ready
- `apps/web/src/app/api/auth/apple/mobile/route.ts` + `/google/mobile/route.ts` — mobile token-exchange endpoints already exist
- `apps/web/src/lib/mobile-auth.ts` + `mobile-session.ts` — session resolution + JWT issuance ready
- `apps/mobile/ios/HealthAgent/PrivacyInfo.xcprivacy` — Privacy Manifest in place
- `apps/mobile/eas.json` — Build + Submit profiles configured
- `apps/web/src/lib/crypto.ts:16-58` — AES-256-GCM encryption for last-4 SSN + DOB
- `docs/app-store-checklist.md` — covers portal-side tasks; we extend with the OAuth and account-deletion steps

## Verification

1. **OAuth keys minted** — Apple Services ID + `.p8` downloaded; Google OAuth clients (web, iOS, Android) created; env vars in Vercel + local `.env` + mobile `.env`
2. **Web sign-in** — local dev: sign in with Apple → user row created with `appleId` populated. Same with Google → `googleId`. No regression on email/password.
3. **Mobile sign-in** — TestFlight build: tap Apple → native dialog → land in dashboard. Same Google. Account-delete flow: tap → confirm → log out → can't log back in with same email.
4. **Apple S2S notifications** — from a tunnel/staging endpoint: (a) revoke "Sign in with Apple" for the app in iOS Settings → Apple ID → expect a `consent-revoked` POST → user's sessions revoked; (b) delete the Apple connection / account → expect `account-delete` POST → `softDeleteAccount` runs for the matching `appleId`; (c) every notification produces a verified-JWS audit-log row; (d) a forged/invalid `payload` is rejected (4xx, no state change).
5. **Consent screen blocks onboarding** until both boxes checked; `users.consentedAt` set
5. **HealthKit features work + are demonstrable** — on a physical device: regular read (steps/heart rate/sleep) displays; clinical records connected in Apple Health appear in-app. No write path exists. `grep -ri "NSHealth" apps/mobile/` shows exactly TWO usage strings (Share + ClinicalHealthRecordsShare), no Update string. Demo video recorded for reviewers (E10).
6. **EAS Build green** — `eas build --profile production --platform all` produces uploadable artifacts
7. **TestFlight install** — at least 3 internal testers can install, sign in (both methods), complete onboarding, create a release
8. **App Privacy + Data Safety** — every collected data type from Part 4.3 declared in both consoles
9. **Privacy policy + ToS live** — `https://veladon.com/privacy` and `/terms` return 200, signed off by counsel
10. **App Store Review notes** — demo account credentials + reviewer guidance pasted in
11. **`eas submit --profile production --platform all`** completes upload to App Store Connect + Play Console without errors

---

## Next step

Pending your review of this plan. Once approved, can auto-create Linear tickets under **Mobile Launch** (same project as JAM-298 → JAM-304) — one ticket per part (~16 tickets, incl. separate HealthKit-regular and HealthKit-clinical-records tickets given their different effort + review risk), with explicit blockedBy relationships and the E1–E11 external items as separate non-engineering tickets so you can track them in the same view.

**Decided sub-scope:** HealthKit is iOS-only, **read-only** (regular + clinical FHIR), no write access. Android **Health Connect** is a post-launch fast-follow, so the Android build launches with feature parity minus health-sync and the v1 Play submission avoids Google's restricted health-data review entirely.
