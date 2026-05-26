# 03 — Event taxonomy

> **v2 note**: the tier-1/tier-2/tier-3 matrix and the channel-per-event matrix from v1 are gone. With only in-app realtime (Ably) + inline email, every event has a single decision: which channel does it publish to, and (for shared channels) does it need a `recipientIds` envelope. Email decisions live at the route-handler level, exactly as they do today.

## Event list

| Event | Scope (channel) | Subscribers | Inline email today? | Recipient envelope? |
|---|---|---|---|---|
| `record.uploaded` | `patient:{patientId}` | Patient + accepted PDAs + assigned agents | `sendNewRecordUploadEmail` to patient | no |
| `record.viewed_by_pda` | `patient:{patientId}` | (same) | no | **yes** — `recipientIds: [patientUserId]` so other PDAs ignore |
| `release.created` | `patient:{patientId}` | (same) | `sendNewReleaseNotificationEmail` to listed agent | no |
| `release.signed` | `patient:{patientId}` | (same) | no | no |
| `release.declined` | `patient:{patientId}` | (same) | no | no |
| `pda.permissions_changed` | `patient:{patientId}` | (same) | no | optional — `recipientIds: [pdaUserId]` for "your perms changed" UX |
| `provider.added` | `patient:{patientId}` | (same) | no | no |
| `provider.removed` | `patient:{patientId}` | (same) | no | no |
| `profile.updated` | `patient:{patientId}` | (same) | no | no |
| `account.suspended` | `user:{userId}` | That user only | `sendAccountSuspendedEmail` | n/a (1:1 channel) |
| `account.reinstated` | `user:{userId}` | (same) | `sendAccountReinstatedEmail` | n/a |
| `security.new_device_login` | `user:{userId}` | (same) | (future) | n/a |
| `pda.invite_received` | `user:{userId}` of invitee | Invitee only | `sendInviteEmail` (mandatory — invitee may not have an account yet) | n/a |
| `pda.you_were_added` | `user:{userId}` of the PDA | The PDA only | (future) | n/a |

The schema for these events (the `EventType` enum, payload Zod schemas, `channelNameFor(scope)`) lives in `packages/types/src/schemas/events.ts`.

## Scope

`scope` is a discriminated union; the channel name is derived from it:

```ts
type ChannelScope =
  | { kind: 'user';     userId:     string }   // → "user:{id}"
  | { kind: 'patient';  patientId:  string }   // → "patient:{id}"
  | { kind: 'release';  releaseId:  string }   // → "release:{id}"
  | { kind: 'document'; documentId: string }   // → "document:{id}"
  | { kind: 'provider'; providerId: string };  // → "provider:{id}"
```

Route handlers pass `scope`; clients never name channels directly.

## Payloads — IDs only, no PHI

Every event payload contains only IDs + actor + timestamp. The recipient's client refetches over authenticated REST.

Example:

```ts
publishEvent({
  type: 'record.uploaded',
  scope: { kind: 'patient', patientId },
  payload: { recordId, patientId, byUserId: session.user.id },
})
```

This is enforced two ways:
1. Zod schemas in `events.ts` allow only known ID/string fields per event.
2. Code review for any new event type — payload must be reviewable as "no PHI" at first glance.

## Recipient envelope

For events on a shared channel (`patient:{id}`) where one specific subscriber should react (others should ignore):

```ts
publishEvent({
  type: 'record.viewed_by_pda',
  scope: { kind: 'patient', patientId },
  recipientIds: [patientUserId],   // only the patient's client renders this
  payload: { recordId, patientId, byUserId: pdaUserId },
})
```

Rules:
- Absent `recipientIds` → every subscriber treats the event as for them.
- Present `recipientIds` → clients filter; non-recipients drop the event silently.
- This is **UX correctness**, not security. The authorization gate is at channel-auth time (subscription) and at REST-fetch time. The envelope merely prevents the wrong toast from appearing.

## Email handling

Email is **not** a channel of `publishEvent`. Route handlers call `lib/email.ts` functions inline today; v2 keeps that. If a flow should also email, the route handler calls `sendXEmail` after `publishEvent`. Existing flows:

| Route | Email function called inline (today, unchanged) |
|---|---|
| `apps/web/src/app/api/releases/route.ts:137` | `sendNewReleaseNotificationEmail` |
| `apps/web/src/app/api/records/upload/route.ts` | `sendNewRecordUploadEmail` |
| `apps/web/src/app/api/my-designated-agents/route.ts` | `sendInviteEmail` |
| `apps/web/src/app/api/scheduled-calls/route.ts` | `sendScheduledCallEmail` |
| Account state changes | `sendAccountSuspendedEmail` / `sendAccountReinstatedEmail` |

The simplification adds `publishEvent` alongside these — it does not replace them.

## Audience derivation

For `patient:{id}` events: the channel-auth gate (see `07-presence-and-channels.md`) decides who *can subscribe*. Once subscribed, every subscriber sees every published event on the channel (subject to the recipient envelope filter).

For `user:{id}` events: only that user can subscribe by definition.

No server-side fanout loop computes recipients — the channel membership IS the audience.

## What's not in v1

- Push notifications (mobile + web)
- SMS
- In-app inbox feed (would need `notification_log` table)
- Per-event per-channel user preferences (would need `notification_preferences` table)
- Dedup / cooldown / coalescing
- Quiet hours / scheduled delivery / digests

Any of these can be added later as additive features without changing the publishEvent surface.
