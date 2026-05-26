# HealthKit FHIR Sync & Database Encryption — Discussion Doc

**Status:** Draft for team discussion & decision
**Author:** Khoa (with Claude)
**Date:** 2026-05-21
**Context:** JAM-278 shipped the first HealthKit integration (daily aggregate vitals/steps/sleep/glucose → `HealthData`, foreground sync, dashboard). Two larger questions came out of it and need a team decision before we build further: (1) pulling **FHIR clinical records** from HealthKit, and (2) a coherent **PHI-at-rest encryption** strategy on our Turso/libsql production infrastructure.

---

## TL;DR / Recommendations

1. **FHIR is high value for this product** (it's literally the EHR data — labs, meds, conditions — that providers pushed into Apple Health). react-native-health can read it via `getClinicalRecords`. **But Apple does not allow background delivery for clinical records** — FHIR must be pulled in the foreground (on app open). It needs a new entitlement, a new (encrypted) storage table, and a dedup-by-resource-id sync model. Recommend scoping it as its own project after the incremental-sync work.
2. **Encryption: do both layers, scoped by sensitivity.**
   - Turn on **Turso platform encryption-at-rest** for blanket disk/backup protection (preserves all SQL — no query impact). This is the production answer; the client `encryptionKey` option does **not** apply to hosted Turso.
   - Apply **app-level AES-256-GCM** (our existing `crypto.ts`) to the **FHIR blob** and reconsider it for `healthData.value`, since those are the actual PHI payloads and our query needs on them are minimal.
   - **Avoid** order-preserving / deterministic "searchable" encryption for PHI.
3. **Decisions needed from the team** are listed at the end.

---

## Part A — FHIR / Clinical Records sync from HealthKit

### What's available
HealthKit exposes **Clinical Records** as **FHIR resources** (`HKClinicalRecord`). `react-native-health` supports them via `getClinicalRecords`:

- **Record types:** `AllergyRecord`, `ConditionRecord`, `CoverageRecord`, `ImmunizationRecord`, `LabResultRecord`, `MedicationRecord`, `ProcedureRecord`, `VitalSignRecord`.
- **Output per record:** `id`, `displayName`, `startDate`/`endDate`, `sourceId`, **`fhirData`** (the raw FHIR JSON), **`fhirRelease`** (e.g. `DSTU2`, `R4`), `fhirVersion`.

This is materially richer than what JAM-278 syncs today (numeric daily aggregates). It is the provider EHR data the user connected in the Apple Health app.

### Hard constraints
- **No background delivery for clinical records.** Apple does not support `HKObserverQuery`/background delivery for clinical types. **FHIR can only be read while the app is in the foreground.** (Background delivery *is* available for the quantity/category types we already sync — see Part C.)
- **Extra entitlement + Info.plist:** requires the **Clinical Health Records** capability (`health-records` access; paid Apple Developer Program) and `NSHealthClinicalHealthRecordsShareUsageDescription`.
- **User precondition:** the user must have linked a healthcare provider in the Apple Health app, or there is nothing to read.
- **Mixed FHIR versions:** records can be DSTU2 or R4 depending on the source institution — our parser/storage must keep `fhirRelease`/`fhirVersion` and not assume one schema.

### Proposed storage & sync model
- **New table `clinicalRecords`** (separate from `HealthData`, which is numeric):
  - `id`, `userId`, `recordType`, `fhirResourceId` (from FHIR JSON), `fhirRelease`, `fhirVersion`, `displayName`, `effectiveDate`, **`fhirData` (encrypted blob)**, `sourceId`, `createdAt`, `updatedAt`.
  - **Unique index `(userId, fhirResourceId)`** for idempotent upsert / dedup.
- **Sync trigger:** foreground, on app open (and a manual "Sync now"). No background.
- **Incremental:** track last clinical-sync per user; query `getClinicalRecords` with a `startDate` watermark and upsert by `fhirResourceId` (overwrite if `fhirVersion` newer). Same idempotency principle as Part C.
- **This is high-sensitivity PHI** → see Part B; the `fhirData` blob should be encrypted at the application layer.

### Effort
Substantial — effectively a second ingestion pipeline (new capability + entitlement, new encrypted table + migration, FHIR parsing/version handling, foreground sync UI). Recommend a dedicated ticket/project.

---

## Part B — Database encryption methodology on Turso/libsql (production)

### Where we are today
- **App-level field encryption already exists:** `apps/web/src/lib/crypto.ts` — AES-256-GCM, keyed by `ENCRYPTION_KEY` (hex), values prefixed `enc:`. Used today for **SSN, DOB** (`encryptPii`) and the **Apple refresh token**.
- **`HealthData.value` is stored as plaintext** (numeric `real`). FHIR is not yet stored.
- **DB client** (`apps/web/src/lib/db/index.ts`): `createClient({ url, authToken })`. Dev uses a local file (`file:./dev.db`); **production is (almost certainly) hosted Turso** (`libsql://`, `DATABASE_AUTH_TOKEN`, `dialect: 'turso'`). No `encryptionKey` is passed today.

### The key infrastructure fact
The `@libsql/client` **`encryptionKey` option only encrypts local-file / embedded-replica databases** (SQLCipher-style page encryption). It does **nothing** for a **hosted Turso** connection — there, encryption-at-rest is a **Turso platform feature** handled server-side, not via a client key. So:

- The "one-line `encryptionKey`" approach would only protect **dev**, not prod. Misleading for our threat model.
- **Production at-rest = a Turso platform setting**, not application code.

### The options (and why)

| Approach | Protects against | Query/sort/aggregate? | Works on hosted Turso? | Verdict |
|---|---|---|---|---|
| **App-level AES-256-GCM** (our `crypto.ts`) | App-layer leakage of specific fields, DB dumps | **No** on encrypted columns (random IV ⇒ no equality/range/order) | Yes (encrypt before write, decrypt after read) | **Use for high-sensitivity payloads** (FHIR blob; reconsider for `healthData.value`) |
| **Turso platform encryption-at-rest** | Stolen disk / leaked backup | **Yes — full SQL preserved** (app sees plaintext) | Yes (platform feature) | **Turn on — blanket baseline** |
| **Deterministic encryption** | Field leakage, allows equality/GROUP BY | Partial (equality only; no range/order) | Yes | **Avoid** — leaks equality/frequency; equality on health values isn't useful |
| **Order-preserving / order-revealing (OPE/ORE)** | Field leakage, allows range/sort | Range + ORDER BY | Yes (3rd-party lib) | **Avoid for PHI** — by design leaks ordering of all values |

### Recommendation
- **Baseline:** enable **Turso encryption-at-rest** in production. Zero query impact, protects the realistic threat (disk/backup theft). Confirm exact mechanism with Turso for our plan/region.
- **Defense-in-depth on the actual PHI:**
  - **FHIR `fhirData` blob → app-level GCM.** Query needs are minimal (fetch by `userId` / `recordType` / date), so losing SQL operations on the blob costs nothing.
  - **`healthData.value` → reconsider GCM.** We never query/sort by value today (we filter by `userId`/`type`/`date` and aggregate client-side; the device pre-computes avg/min/max). If we later need value-based queries, keep the exact value GCM-encrypted and add a **non-sensitive coarse bucket** column in cleartext for trends — do **not** reach for OPE/deterministic.
- **Key management:** today `ENCRYPTION_KEY` lives in env (Vercel). For expanded PHI scope, decide on rotation strategy and whether to move to a managed KMS.

---

## Part C — How they intersect

- **Background sync** (the "keep server in sync without opening the app" question) applies **only to the quantity/category types** already in `HealthData` (HR, steps, sleep, glucose) via HealthKit background delivery (`HKObserverQuery` + `enableBackgroundDelivery`). It requires a **native AppDelegate change** and is best-effort/throttled by iOS. **It does not apply to FHIR.**
- **Incremental resume-on-reconnect** (keep data on disconnect; on reconnect sync `[watermark − overlap, today]`, dedup via upsert) applies to **both** pipelines — numeric (`(userId, type, date)` unique index, already in place) and FHIR (`(userId, fhirResourceId)` unique index, proposed).
- **Encryption** matters most for **FHIR** (full clinical detail) and secondarily for `healthData.value`.

---

## Open decisions for the team

1. **Build FHIR clinical-records sync?** If yes, priority vs. background sync (Part C) and incremental sync. Recommended order: incremental sync → background delivery → FHIR.
2. **Turso encryption-at-rest in prod:** confirm it's available/enabled on our plan; who owns the Turso config change?
3. **Scope of app-level GCM:** FHIR blob only, or also `healthData.value`? (Recommend: FHIR now; `healthData.value` when/if value queries appear.)
4. **Key management:** stay on env `ENCRYPTION_KEY`, or move to managed KMS + rotation as PHI scope grows?
5. **Apple Developer Program / capabilities:** confirm the paid account + "Clinical Health Records" capability on App ID `com.zabaca.veladon` (also needed for Sign in with Apple on device).
6. **PDA visibility for FHIR:** `HealthData` is currently patient-only. Should clinical records ever be visible to PDAs, and only via the imported-records path?
