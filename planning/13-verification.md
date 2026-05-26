# 13 — Verification plan (v2)

End-to-end checks for the single phase. Local dev: `~/.bun/bin/bun run dev`.

## Schema + audit

- `bun run db:migrate` applies `0026_audit_log.sql` cleanly against a fresh DB and an existing one (no destructive change).
- Query `AuditLog` after a release-create flow: expect rows for (a) `release.created` from `publishEvent`, (b) `channel.granted` from `/api/realtime/auth`, (c) `email.sent` if instrumented.
- All `payloadDigest` fields are sha256 hex strings, never raw text or JSON.

## Channel auth

- `POST /api/realtime/auth` with a patient session requesting `patient:{ownId}` → 200 with capability map; `AuditLog` row `eventType=channel.granted, status=granted`.
- Same endpoint with PDA session A (accepted PDA of patient B) requesting `patient:{B}` → 200, granted.
- Same endpoint with PDA session A requesting `patient:{C}` where A has no PDA row for C → channel not in capability map, `AuditLog` row `eventType=channel.denied, status=denied`.
- Token TTL: capture a token, wait 90s, attempt subscribe → fails (Ably rejects expired token).

## Channel naming / consolidated fan-out

- Open patient web (patient X), PDA web (PDA 1 of X), and a third browser (PDA of a different patient Y).
- PDA 1 uploads a record for patient X.
- Both patient X and PDA 1 see a live Mantine toast and the records list refreshes within ~1s.
- The PDA-of-Y browser sees nothing in their UI.
- In Ably's dashboard (or network tab), confirm: **one** publish to `patient:{X}`, not multiple per-user publishes.

## Recipient envelope

- Server-side: emit a synthetic event with `recipientIds: [patientUserId]` (e.g. via a dev-only endpoint or unit-test harness).
- Patient browser: toast shown.
- PDA browser (also subscribed to same `patient:{id}`): event received in subscriber console log, dropped silently (no toast, no refetch).

## Email parity (no regression)

- Trigger `POST /api/releases` with an agent listed.
- Existing `sendNewReleaseNotificationEmail` fires unchanged (check Resend dashboard or local logs).
- Additionally, patient + PDA web browsers see a live "new release created" toast.
- No double-email; no email behavior change vs `main`.

## No-PHI invariant

- Grep `publishEvent` call sites — payload fields should be IDs/event metadata only.
- Per-event Zod schemas in `packages/types/src/schemas/events.ts` reject any field that doesn't match the spec.
- Spot-check three Ably publishes via the dashboard's message inspector: payload bodies contain only IDs.

## Mobile

- `cd apps/mobile && node -e "require('./metro.config.js')"` resolves (the new `events.ts` schema must be picked up via the workspace watcher).
- Run app on simulator/device, sign in as patient with at least one accepted PDA, leave dashboard open.
- From a separate browser as the PDA, upload a record → mobile receives the event and refreshes the list.

## Build + lint + type-check

- `bun run type-check && bun run lint && bun run build` at repo root.
- After Ably/`@ably/realtime` is installed, run the above again — should remain clean.

## Failure paths

- Block Ably's host (`/etc/hosts` to `127.0.0.1`) and POST `/api/releases` → response is still 200, `AuditLog` records `eventType=release.created, status=ok` AND optionally `status=failed` for the publish attempt depending on how we instrument it; no in-app toast appears; email still fires.
- Block Resend's host → POST `/api/releases` returns whatever it returns today (the route's existing error handling), `AuditLog` records `eventType=email.sent, status=failed` if instrumented.
- DB unavailable → 5xx as today; nothing published; nothing emailed.
