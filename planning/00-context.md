# 00 — Context

> **v2 note (2026-05-18)**: original plan covered in-app + push + email + SMS with a central router. v1 scope narrowed to **in-app realtime (Ably) + email only**, no central router (`publishEvent` does Ably; route handlers call `sendXEmail` inline), and per-recipient fan-out consolidated into shared `patient:{id}` channels. See README for the full diff.


The platform currently has zero real-time infrastructure. All user-facing async signal happens over Resend email, fired synchronously from inside route handlers. There are no push notifications, no SMS, no WebSocket/SSE, no background queue, and no general-purpose audit log. As the three-role model (Patient / PDA / Zabaca Agent) matures, the lack of a real-time signal path is becoming a UX bottleneck:

- A PDA uploads a record; the patient has no idea until they refresh.
- A release is created and needs a patient signature; only an email goes out, and the patient may not be reading email.
- An agent and a PDA can both touch the same release simultaneously and the last write wins silently.

## Goals, in priority order

1. **Event → notification path** — a single domain-event abstraction that decides *who* gets notified, on *which* channel, *now or later*, with dedup.
2. **Presence** — know which users are currently online and on which screen, so we can downgrade push/email when in-app delivery is sufficient.
3. **Collision mitigation** — prevent silent data loss when two actors edit the same record.

## HIPAA stance

Notification payloads omit PHI. "New record uploaded — open the app to view." Always. Anything that *could* contain PHI rides authenticated, BAA-covered transport (Resend, hosted realtime via BAA tier, or self-hosted in our VPC). This stance makes vendor choice a perf/cost question rather than a compliance question.

## Roles glossary

- **Patient** — primary account holder, owns their data
- **PDA (Patient Designated Agent)** — surrogate decision-maker invited by the patient with per-relationship permissions (`healthRecordsPermission`, `manageProvidersPermission`, `releasePermission` ∈ `{viewer, editor}`)
- **Zabaca Agent** — internal staff role, can act on behalf of patients via `zabacaAgentRoles`
