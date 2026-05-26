# 05 — Sync model (v2)

> **v2 note**: this chapter used to describe a sync-vs-fire-and-forget split with a `waitUntil`-driven router. In v1 there is **no async path** — everything happens inside the route handler before it returns. The split was an artifact of having a router; with the router gone, the split goes too.

## The model

Every route handler runs to completion before returning. Order inside the handler:

1. Authn / authz (existing pattern)
2. Perform the action (DB writes, third-party calls)
3. `writeAudit(...)` — synchronously, before any side-effect
4. `publishEvent({ ... })` — fire-and-forget Ably publish, awaited (errors caught + logged)
5. `sendXEmail(...)` if this flow requires email — awaited, blocking the response
6. Return 200

Steps 3–5 are inline. There is no `waitUntil`, no queue, no background job. The user pays the latency of the Ably publish (~50ms) and the email send (~200–500ms via Resend) on responses for flows that include them.

## Why no `waitUntil`

- The router that `waitUntil` was hiding is gone.
- A bare Ably publish is fast (~50ms). Hiding it behind `waitUntil` saves negligible latency.
- A bare email send is slow (~200–500ms) and the routes that need email already accept that cost today.
- `waitUntil` complicates audit ordering (audit row may write after response, complicating "transaction-like" guarantees).

If a future route needs to fan out many side-effects, `waitUntil` can be reintroduced for that specific route. The general case doesn't need it.

## Error policy

| Failure | Effect |
|---|---|
| DB write fails | Route returns 5xx as today. `publishEvent` never runs. `sendXEmail` never runs. |
| `writeAudit` fails | Logged to stderr; route continues. Audit must never break the request path. (Failed audit writes are an ops alert, not a user-facing error.) |
| Ably publish fails | Logged; route continues. The user's data is committed. The live update is lost; the user sees it on next page load. |
| Email send fails | Logged; route returns 200 if the data is committed. (Specific UX flows that need "we sent you an email" copy may choose to surface the failure — that's a per-route decision.) |

## What's deliberately not on the menu (unchanged from v1 of this doc)

- **Scheduled / deferred events.** No quiet-hours hold, no "remind in 10 min."
- **Durable queue.** No outbox, no `notBefore`, no retry sweeper.
- **Replay tooling.** If you need to replay an event manually, do it from the `audit_log` row.

If a real outage or product need pushes us to add durability, the `audit_log` is already the source of truth — we'd add an outbox table and a drain on top of the existing `publishEvent` surface without changing route handlers.
