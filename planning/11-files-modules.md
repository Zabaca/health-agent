# 11 — Files & modules to add (v2)

```
apps/web/src/lib/events/
  publish.ts            // publishEvent({ type, scope, recipientIds?, payload })
                        //   - writes audit_log synchronously
                        //   - validates payload against Zod schema in events.ts
                        //   - fires Ably REST publish (no-op if ABLY_API_KEY absent)

apps/web/src/lib/realtime/
  scope.ts              // channelNameFor() + canAccessChannel(session, channelName)
  auth.ts               // POST /api/realtime/auth handler — token issuance + audit
  client.ts             // browser Ably client + React hook (useRealtime)

apps/web/src/lib/audit/
  log.ts                // writeAudit(...) + digestPayload(...)
                        // auditDb alias points at main `db` in v1; swap point for dedicated Turso DB later

apps/mobile/src/lib/
  realtime/
    client.ts           // RN Ably client mirroring web

packages/types/src/schemas/
  events.ts             // EventType enum, ChannelScope union, eventPayloads Zod schemas,
                        // channelNameFor, parseChannelName, EventEnvelope
```

Removed from the v1 module list (versus the original plan):

```
apps/web/src/lib/events/
  router.ts             — no router in v1
apps/web/src/lib/notifications/
  channels/expoPush.ts  — push deferred
  channels/webPush.ts   — push deferred
  channels/inApp.ts     — Ably IS the in-app surface; no separate adapter
  channels/email.ts     — emails go through existing lib/email.ts inline
  preferences.ts        — no notification_preferences in v1
apps/mobile/src/lib/
  push.ts               — push deferred
packages/types/src/schemas/
  notifications.ts      — no preference shape in v1
```

## DB migrations (drizzle)

New table in v1:

- `AuditLog` — append-only event/action log; v2 shape in `10-hipaa-and-audit.md`

Migration file: `apps/web/drizzle/0026_audit_log.sql` (hand-written to match the repo's pattern; updates `meta/_journal.json` accordingly).

Not in v1:

- `notification_preferences` — removed; no router consults preferences
- `notification_log` — removed; no dedup, no inbox UI
- `push_tokens` — removed; push deferred
- `record_locks` — collision mitigation deferred to a later phase (see `08`)

## API routes to add

- `POST /api/realtime/auth` — channel-subscribe token issuance

Removed from the original list:

- `POST /api/me/push-tokens` and friends — push deferred
- `GET /api/me/notifications` + read state — no inbox in v1
- `GET/PUT /api/me/notification-preferences` — no prefs table in v1
- `POST /api/locks/*` — collision mitigation deferred

## Existing routes to update

Add `publishEvent(...)` alongside existing `sendXEmail(...)` calls. The email lines do **not** change.

| Route | Existing inline email (keep as-is) | Add publishEvent |
|---|---|---|
| `apps/web/src/app/api/releases/route.ts:137` | `sendNewReleaseNotificationEmail` | `publishEvent({ type: "release.created", scope: { kind: "patient", patientId }, payload: { releaseId, patientId, byUserId } })` |
| `apps/web/src/app/api/records/upload/route.ts` | `sendNewRecordUploadEmail` | `publishEvent({ type: "record.uploaded", scope: { kind: "patient", patientId }, payload: { recordId, patientId, byUserId } })` |
| `apps/web/src/app/api/my-designated-agents/route.ts` | `sendInviteEmail` | `publishEvent({ type: "pda.invite_received", scope: { kind: "user", userId: invitee.id }, payload: { pdaInviteId, patientId } })` |
| `apps/web/src/app/api/scheduled-calls/route.ts` | `sendScheduledCallEmail` | (out of scope — scheduling explicitly deferred) |
| `apps/web/src/app/api/releases/[id]/sign/route.ts` | (no email today) | `publishEvent({ type: "release.signed", scope: { kind: "patient", patientId }, payload: { releaseId, patientId, byUserId } })` + `writeAudit(release.signature_attempted)` |
| `apps/web/src/app/api/representing/pending/[id]/route.ts` | (no email today) | `publishEvent({ type: "pda.you_were_added" or similar })` |
| `apps/web/src/app/api/profile/route.ts` | (no email today) | `publishEvent({ type: "profile.updated", scope: { kind: "patient", patientId } })` |
| Account suspend/reinstate admin routes | `sendAccountSuspendedEmail` / `sendAccountReinstatedEmail` | `publishEvent({ type: "account.suspended" or "account.reinstated", scope: { kind: "user", userId } })` |

## Wiring summary

For each route, the diff is small:

```ts
// before
await sendXEmail(...);
return NextResponse.json({ ... });

// after
await sendXEmail(...);
await publishEvent({ type: "...", scope: { ... }, payload: { ... } });
return NextResponse.json({ ... });
```

`publishEvent` writes the audit row internally. No separate `writeAudit` call in the route unless the route has its own audit-worthy action (signature attempt, PDA data read) that isn't already covered by the event publish.
