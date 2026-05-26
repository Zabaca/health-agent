# 14 — Recommendations summary (v2)

A one-page distilled view for stakeholders.

## Scope of v1

Ship **in-app live notifications (Ably) + the existing email behavior + a full HIPAA audit log**. Nothing else. Push, SMS, in-app inbox, per-event preferences, dedup, presence-driven suppression, and a central router are all deferred.

## Realtime transport

**Ably**, Standard tier. Realtime payloads are signaling-only (IDs, no PHI), so vendor BAA tier is not required. All vendor code lives in `lib/events/publish.ts`, `lib/realtime/auth.ts`, `lib/realtime/client.ts` — a future swap to Soketi or another Pusher-protocol provider is a per-file change.

## Channels

One shared `patient:{patientId}` channel per patient that everyone with patient access (patient + accepted PDAs + assigned agents) subscribes to. Personal events stay on per-user `user:{userId}` channels. Page-scoped channels (`release:{id}`, `document:{id}`, `provider:{id}`) join on UI navigation. `chat:{id}` is a placeholder for a future chat feature.

This replaces v1's per-recipient fan-out (publishing once per recipient channel). The membership of `patient:{id}` IS the audience.

## Recipient envelope, not encryption

Mixed-audience events on a shared channel (e.g., "PDA #2 viewed your records" → patient should react, other PDAs should not) carry an optional `recipientIds: string[]`. Clients filter by it. Not a security boundary — channel-auth at subscribe time and REST auth at fetch time remain the actual gates. Payloads carry no PHI, so encryption is unnecessary.

## Email

No change from today. Route handlers call `lib/email.ts` `sendXEmail()` directly. `publishEvent` is added alongside, not as a replacement.

## HIPAA audit log

Mandatory. `AuditLog` table (libSQL/Turso; the v1 docs that said Postgres were wrong). Append-only. Write points: every `publishEvent`, every channel-auth issuance, every PDA data read, every signature attempt, every email send.

Storage tiering plan: hot in Turso (v1 in main DB; future sibling DB), cold in Vercel Blob as monthly Parquet. Designed but not built until hot-tier size justifies it (~5GB; not soon at v1 scale).

## Sequencing

| Phase | What | Time |
|---|---|---|
| 1 | Audit table + shared event types + `publishEvent` + `/api/realtime/auth` + web + mobile subscribers + wire reference route | ~2 weeks |
| Future | Push, in-app inbox, prefs, collision mitigation, presence on collab pages, chat | scheduled by product trigger |

## Single most impactful first move

**Phase 1 alone** lands:
1. The HIPAA audit log the platform currently lacks
2. Live patient-visible updates when a PDA or agent acts on their data — the original UX pain point
3. A clean abstraction (`publishEvent` + `writeAudit`) that every future channel/feature plugs into without changing route handlers

It is the lowest-risk, highest-leverage first step, and ~2 weeks of work — far smaller than the original 4-phase plan.
