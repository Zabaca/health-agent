# 12 — Open decisions (v2)

Most of v1's open decisions are resolved by the simplification. Remaining open items below.

## Resolved in v2

| Original decision | Resolution |
|---|---|
| Ably vs Soketi | **Ably** (Standard tier). Payloads are signaling-only so no BAA needed; Ably's DX wins for v1's small scale. |
| Push (mobile + web) in phase 1 | **Deferred**. Re-evaluate once in-app + email surfaces are live and we see real usage. |
| SMS | **Deferred**. Same. |
| Durable queue / outbox / retries | **Not in v1**. Acceptable to drop a notification on vendor blip; data is committed. |
| Channel router with dedup/prefs/critical | **Removed from v1**. `publishEvent` does only Ably publish; email is inline at the route. |
| `notification_log` (dedup + inbox feed) | **Removed from v1**. No router means no dedup; no inbox UI in v1. |
| `notification_preferences` (per-event channel toggles) | **Removed from v1**. Per-route email muting can be added as a single column on `users` if a specific flow needs it. |
| `push_tokens` | **Removed from v1**. |
| Presence-aware channel suppression | **Removed from v1**. No router means no consumer. Built-in Ably presence stays available if a future page-collaboration feature wants it. |
| Quiet hours / scheduled delivery / digests | **Not in v1**. Same as v1 plan. |
| Audit log storage (Postgres) | **libSQL/Turso** corrected. Two-tier plan (hot in Turso, cold in Vercel Blob Parquet) documented in `10-hipaa-and-audit.md`. |
| Mixed-audience events on shared channels (encryption?) | **Recipient envelope** (`recipientIds: string[]`). No encryption. Payloads carry no PHI; envelope is a UX-correctness filter, not a security boundary. |

## Still open

| Decision | Safe default until decided | Re-evaluate when |
|---|---|---|
| Email-without-presence noise (user in-app AND gets email for the same event) | Accept as-is — current email-triggering flows are high-signal | First user complaint about email noise on the existing flows |
| In-app dispatch surface — Mantine toast vs a richer surface | Mantine `notifications.show()` (already in repo) | Product designs an inbox/feed |
| `chat:{id}` channel | Placeholder name only; no wiring in v1 | Chat feature is scoped |
| Audit retention — cold-tier kickoff threshold | ~5GB hot-tier size | When hot-tier audit volume crosses the threshold (won't be soon at v1 scale) |
| `recipientIds` for `pda.permissions_changed` | Use envelope so non-affected PDAs don't see the "your perms changed" toast | If product wants every PDA in the patient context to see the change |
| Optimistic locking / atomic signature endpoint (chapter 08) | Status quo until a concurrent-edit incident happens | First production incident or product asks for collaborative editing |

## Decisions already made (carried forward from v1 plan)

- **HIPAA**: PHI never on notification or realtime payloads (regardless of vendor BAA)
- **`audit_log` is mandatory**: every publish, every channel-auth issuance, every PDA data read, every signature attempt, every email send
