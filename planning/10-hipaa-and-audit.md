# 10 — HIPAA, PII, and audit posture (v2)

| Concern | Stance |
|---|---|
| Notification payloads | No PHI in email titles/bodies/subjects. "New record uploaded — open the app to view." Always. |
| Realtime payloads | Only IDs + event names. Client fetches the actual record over authenticated REST. |
| Channel auth | Every subscribe request authenticated and scoped server-side; tokens short-lived (≤60s); every issuance audit-logged (granted and denied). |
| BAAs | Resend (yes). Ably standard tier (no BAA) is acceptable because realtime payloads carry no PHI; Enterprise tier upgrade is optional defense-in-depth. |
| Audit log | Every event publish, every channel-auth issuance, every PDA data fetch on patient data, every signature attempt, every email send. Append-only `AuditLog`. |
| Opt-out | Out of scope in v1. No `notification_preferences` table; per-route email muting is a per-flow decision if/when it's needed. |

## Audit log shape

```
AuditLog (SQLite/Turso):
  id              text PK
  actorUserId     text NULL          -- who did the thing; NULL for system events
  actorRole       text NOT NULL      -- patient | pda | agent | admin | system
  eventType       text NOT NULL      -- namespaced: record.uploaded, release.signed, channel.granted, ...
  entityType      text NULL          -- release | record | profile | invite | session | channel | email
  entityId        text NULL          -- the affected row's PK or the channel name
  payloadDigest   text NULL          -- sha256 of canonical payload; proves what was emitted without storing PHI
  status          text NOT NULL DEFAULT 'ok'   -- ok | granted | denied | failed
  ip              text NULL
  ua              text NULL
  createdAt       text NOT NULL
```

Indexes:
- `(actorUserId, createdAt DESC)`
- `(entityType, entityId, createdAt DESC)`
- `(eventType, createdAt DESC)`

Retention: keep indefinitely (HIPAA's 6-year minimum, whichever is longer).

## Storage strategy

The app runs on **libSQL/Turso** (`apps/web/src/lib/db/index.ts:1-14`). The v1 audit table lives in the main database. A two-tier plan handles growth:

| Tier | Where | Holds | Why |
|---|---|---|---|
| Hot | Main Turso DB (v1) → dedicated sibling Turso DB (when hot size exceeds ~5GB) | Last ~90 days, fully indexed | Append-only; isolated cutover lets us scale and back up audit independently of operational data |
| Cold | Vercel Blob (or Marketplace S3) as monthly Parquet files | Everything older than 90 days, 6+ years | HIPAA retention without bloating Turso; queryable via DuckDB/Athena for breach-investigation discovery |
| Optional sidecar | Axiom or Datadog Logs (mirrored write) | Same events, for free-text search + alerting | Turso remains system of record; sidecar is for ops convenience |

**Sizing sanity-check**: at ~10k MAU × ~50 audit events/day/active-user × ~300 bytes/row ≈ 180M rows/year ≈ ~60GB/year. Turso handles tens of GB fine; we won't get close in v1 (~hundreds of MAU). Archival isn't urgent — design the cron, run it when hot-tier size crosses ~5GB.

**Append-only enforcement**
- No `UPDATE`/`DELETE` paths in app code touching `AuditLog`.
- DB-level: app DB credentials have only `INSERT`/`SELECT` on `AuditLog`. The future archival job uses a separate admin-only credential to delete-after-export.
- All writes go through `writeAudit` in `apps/web/src/lib/audit/log.ts`. No code calls `db.insert(auditLog)` directly.

**v1 deferral**: The dedicated sibling Turso DB is a *future* migration. v1 writes to `db` (the operational client). The `lib/audit/log.ts` module exposes an `auditDb` alias internally — the eventual swap is a one-line connection-string change there.

## Write points (full coverage list)

| Write site | Where | `eventType` | `status` |
|---|---|---|---|
| Every `publishEvent` call | `lib/events/publish.ts` | the event's type (e.g. `record.uploaded`) | `ok` or `failed` |
| Channel-auth token issuance | `/api/realtime/auth` | `channel.granted` / `channel.denied` | `granted` / `denied` |
| PDA reads patient-scoped data | REST handlers serving patient data when caller is a PDA | `patient.read_by_pda` (or finer-grained per resource) | `ok` |
| Release signature attempts | sign route handler | `release.signature_attempted` | `ok` or `failed` |
| Email sends | thin wrappers in `lib/email.ts` (or after `await sendXEmail` in the caller) | `email.sent` | `ok` or `failed` |

The first three are HIPAA-mandated. The other two are best-practice extensions of the same audit surface.

## Why we don't need vendor BAAs in v1

PHI never leaves authenticated REST + the database:
- **Realtime payloads**: IDs + event names only. A subscriber who somehow received an event for a record they can't access still cannot read the record (REST returns 403).
- **Email**: subjects + bodies are canned templates with no PHI ("New record uploaded — open the app to view"). No patient names, no record contents.
- **Audit payload**: only sha256 digests are stored; raw payload is never persisted.

Result: Ably standard tier and Resend's standard offering are sufficient. A future Ably Enterprise BAA upgrade is defense-in-depth, not a compliance requirement.
