# 04 — Channel rules (v2)

> **v2 note**: this chapter previously described a `waitUntil`-driven router with dedup, cooldown windows, critical/tier matrix, and `notification_preferences` overlays. All of that is gone in v1. The rules below are the entire set.

## The rules

```
Route handler does its work.
  └─ writeAudit(...)                    — always, synchronously, before publish
  └─ publishEvent({ type, scope, ... }) — always; fire-and-forget Ably publish
  └─ sendXEmail(...)                    — if this flow requires email; inline, blocking the response
return 200
```

There is no router. There is no decision tree. Each side-effect is one line in the route handler.

## `publishEvent` semantics

| Behavior | Detail |
|---|---|
| Synchronous audit write | `writeAudit` is awaited inside `publishEvent` BEFORE the Ably publish call. Audit must not be lost if Ably is slow or down. |
| Fire-and-forget publish | The Ably publish call is awaited but errors are caught and logged; the function never throws to the caller. |
| Channel resolution | `channelNameFor(scope)` — pure function, no I/O. |
| No PHI guard | Payload is validated against the per-event Zod schema in `events.ts`. Schemas only allow ID/string fields. |
| Env-gated | If `ABLY_API_KEY` is missing (dev without Ably), `publishEvent` logs and skips the publish but still writes the audit row. |

## Email semantics

Unchanged from today. Route handlers call `sendXEmail` from `apps/web/src/lib/email.ts` directly. If a send fails:
- Wrap the call in `try/catch` if the route's UX requires telling the user
- Always `writeAudit({ status: 'failed', ... })` on failure
- A failed email does not roll back the database write

## What's deliberately not in v1

- **No dedup ledger.** No `notification_log`. No cooldown windows. Two rapid events fire twice — that's a UX problem if it happens; we deal with it then.
- **No user preferences.** No `notification_preferences`. If a user wants to mute a specific email, that's a route-level flag stored on `users` (or a tiny dedicated boolean column), not a generic per-event matrix.
- **No critical/tier matrix.** The plan has only one tier — "events you care about." Each route decides whether to email.
- **No presence-aware suppression.** Ably always fires for in-app; email always fires when the route says so. A user actively in the app gets both. Acceptable for the small set of email-triggering flows.
- **No quiet hours / scheduled delivery / digests.** Same as today.

## Audit log writes triggered by the rules

The rules produce these audit rows for a typical event:

| Trigger | Row |
|---|---|
| Route handler enters | (optional, for sensitive routes) — `actor` action |
| `publishEvent` called | `eventType=record.uploaded, actorUserId=..., entityType=record, entityId=..., status=ok` |
| `/api/realtime/auth` issues a token | `eventType=channel.granted, actorUserId=..., entityType=channel, entityId=patient:42` (or `channel.denied`) |
| PDA reads patient data via REST | `eventType=patient.read_by_pda, actorUserId=pda..., entityType=patient, entityId=42` |
| Email send completes | `eventType=email.sent, actorUserId=system, entityType=email, entityId=..., status=ok|failed` |

All of these go through `writeAudit` in `lib/audit/log.ts`. No code does `db.insert(auditLog)` directly.

## When to add a router back

If push notifications return, or SMS lands, or events accumulate per-user preference toggles — at that point a router becomes worth its complexity. The migration is mechanical: keep `publishEvent` as the entry point; behind it, dispatch to multiple channel adapters; add the prefs table. Route handlers don't change. Until then, in-lining at the route is the smallest thing that works.
