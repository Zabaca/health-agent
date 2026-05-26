# Real-time Notifications, Presence, and Collaboration — Research Index

Research session generated 2026-05-07; **simplified 2026-05-18 (v2)** to narrow v1 scope to in-app realtime (Ably) + email only, drop the central channel router, and consolidate per-recipient channels into shared scope channels.

## Chapters

1. [Context](./00-context.md) — why this work, goals, HIPAA stance
2. [Current-state audit](./01-current-state.md) — what exists today (verified), with file:line evidence
3. [Target architecture overview](./02-architecture-overview.md) — single-picture design + core abstraction
4. [Event taxonomy](./03-event-taxonomy.md) — events, scope, optional recipient envelope
5. [Channel rules](./04-channel-rules.md) — publishEvent fires Ably; email is inline in route handlers
6. [Sync model](./05-sync-vs-async.md) — everything is sync; no router, no waitUntil, no queue
7. [Realtime transport](./06-realtime-comparison.md) — Ably chosen; alternatives kept as reference
8. [Presence model & channels](./07-presence-and-channels.md) — channel taxonomy, auth, recipient envelope
9. [Collision mitigation](./08-collision-mitigation.md) — **deferred** to a later phase; kept for reference
10. [Phased rollout](./09-rollout-phases.md) — collapsed to one phase
11. [HIPAA & audit posture](./10-hipaa-and-audit.md) — PHI policy, audit log, storage tiering (libSQL/Turso, not Postgres)
12. [Files & modules to add](./11-files-modules.md) — trimmed module map
13. [Open decisions](./12-open-decisions.md) — mostly resolved; remaining open items called out
14. [Verification plan](./13-verification.md) — end-to-end checks for the single phase
15. [Recommendations summary](./14-recommendations.md) — one-page distilled call
16. [Linear tickets](./15-linear-tickets.md) — JAM-298 → JAM-304, blockedBy graph, where to start

## Reading order

If short on time: **Context → Architecture overview → Channel rules → Recommendations summary**. The rest is depth on demand.

## What changed in v2

- **Drop**: push notifications, SMS, central channel router, `notification_log`, `notification_preferences`, `push_tokens`, presence-driven channel suppression, dedup ledger, tier matrix
- **Consolidate**: per-recipient `user:{recipientId}` fan-outs → single `patient:{patientId}` channel that all authorized recipients (patient + PDAs + agents) subscribe to
- **Add**: recipient envelope (`recipientIds: string[]`) for events on shared channels with narrower audience than the channel
- **Keep**: `audit_log` (HIPAA), inline `sendXEmail()` calls in route handlers (today's pattern), Ably (chosen), "no PHI on the wire" invariant
- **Fix**: storage doc said Postgres; actual stack is libSQL/Turso

## Source

Approved plan archived at `~/.claude/plans/for-the-real-time-rosy-galaxy.md`.
