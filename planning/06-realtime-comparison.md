# 06 — Realtime transport (v2)

> **v2 decision: Ably.** The comparison table is kept below for reference. Reasoning: our payloads are signaling-only (IDs, no PHI), so vendor BAA status is a defense-in-depth concern rather than a compliance gate; Ably is fastest to ship with the best DX for the small scale we need in v1.

## Chosen: Ably

- Tier: start on **Standard** ($29/mo). Our "no PHI on the wire" invariant means BAA tier is not required.
- Channels used: `user:{id}`, `patient:{id}`, plus the page-scoped `release:{id}` / `document:{id}` / `provider:{id}` and the future `chat:{id}`.
- Client auth: token-based via `POST /api/realtime/auth`; tokens have ≤60s TTL and `capability: { "<channel>": ["subscribe"] }` only (no client-side publish in v1).
- Server publish: `ably-js` from the Node/Next.js runtime via `lib/events/publish.ts`. REST publish — no need for a long-lived server connection.

## Comparison (reference only)

| Option | Type | HIPAA / BAA | Cost (est.) | DX | Verdict |
|---|---|---|---|---|---|
| **Ably** | Hosted | BAA on Enterprise tier (not needed given our payload policy) | $29–$500+/mo | Excellent | **Chosen** |
| Pusher Channels | Hosted | Limited (no BAA on most plans) | $49+/mo | Good | Skipped — same protocol as Soketi without ops control |
| PubNub | Hosted | BAA available | $49+/mo | Good | Heavier API; no advantage over Ably for our scale |
| Supabase Realtime | Hosted | BAA on Pro+ | Bundled if on Supabase | Good | We're not on Supabase — adopting it for one feature is a tax |
| Soketi (self-host) | Pusher protocol-compatible OSS | DIY (in-VPC) | $5–$20 VPS | Good | Viable if we ever need to leave hosted — but ops burden not justified now |
| Centrifugo (self-host) | OSS | DIY | $5–$20 VPS | Good | Same as Soketi; smaller community |
| SSE via Vercel Functions | Native | DIY | Within Vercel | Limited | Skipped — function lifetime cap breaks long-lived connections |
| Postgres `LISTEN/NOTIFY` → SSE | Native | DIY | Within Vercel | Limited | Same lifetime issue; doesn't scale |

## Vendor abstraction

All vendor code is concentrated:

- `apps/web/src/lib/events/publish.ts` — server-side publish + `writeAudit`
- `apps/web/src/lib/realtime/auth.ts` — token issuance + scope check
- `apps/web/src/lib/realtime/client.ts` — browser subscriber
- `apps/mobile/src/lib/realtime/client.ts` — RN subscriber

A future swap (Ably → Soketi, e.g., for cost or self-host reasons) is a per-file change in these four spots. Route handlers, event types, and channel-name conventions don't move.

## Why not skip realtime entirely

A polling alternative (refetch every N seconds) was considered. It was rejected because:
- It doesn't fix the "PDA uploads → patient sees nothing until refresh" UX gap that started this work.
- Aggressive polling against authenticated REST has worse total cost than a single WebSocket connection at our user count.
- The plan needs to support live presence on shared pages eventually (release-page collaboration); WebSocket is the natural substrate.
