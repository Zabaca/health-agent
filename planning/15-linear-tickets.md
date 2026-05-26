# 15 — Linear tickets

Implementation tracked under the **Mobile Launch** project (Zabaca team / `JAM`). All seven tickets are labeled `Feature`, created 2026-05-18, and wired with explicit `blockedBy` relationships.

## Critical path

```
JAM-298 ──┬──> JAM-299 ──┬──> JAM-300 ──┐
          │              ├──> JAM-301 ──┤
          │              └──> JAM-302 ──┤
          └──────────────────> JAM-303 ──┴──> JAM-304
```

Single-engineer serial: ~3–4 weeks. With 2 engineers parallelizing T3/T4/T5/T6 after T2: ~2 weeks.

## Tickets

| # | Title | Est. | Blocked by | Blocks | Link |
|---|---|---|---|---|---|
| JAM-298 | T1 — Foundation: AuditLog + shared event schemas | 3 | — | JAM-299, JAM-303 | [open](https://linear.app/zabaca/issue/JAM-298/t1-foundation-auditlog-table-shared-event-schemas) |
| JAM-299 | T2 — Realtime backbone: publishEvent + channel auth | 5 | JAM-298 | JAM-300, JAM-301, JAM-302 | [open](https://linear.app/zabaca/issue/JAM-299/t2-realtime-backbone-publishevent-channel-auth) |
| JAM-300 | T3 — Web realtime subscriber + Mantine dispatch | 5 | JAM-299 | JAM-304 | [open](https://linear.app/zabaca/issue/JAM-300/t3-web-realtime-subscriber-mantine-dispatch) |
| JAM-301 | T4 — Mobile realtime subscriber | 5 | JAM-299 | JAM-304 | [open](https://linear.app/zabaca/issue/JAM-301/t4-mobile-realtime-subscriber) |
| JAM-302 | T5 — Wire existing routes to publishEvent | 5 | JAM-299 | JAM-304 | [open](https://linear.app/zabaca/issue/JAM-302/t5-wire-existing-routes-to-publishevent) |
| JAM-303 | T6 — HIPAA audit sweep (parallel) | 5 | JAM-298 | JAM-304 | [open](https://linear.app/zabaca/issue/JAM-303/t6-hipaa-audit-sweep-parallel) |
| JAM-304 | T7 — Verification + cutover | 3 | JAM-300, JAM-301, JAM-302, JAM-303 | — | [open](https://linear.app/zabaca/issue/JAM-304/t7-verification-cutover) |

**Total: 31 story points across 7 tickets.**

## Where each ticket maps in the planning docs

| Ticket | Primary references |
|---|---|
| JAM-298 (T1) | `10-hipaa-and-audit.md` (table shape, storage tiering), `03-event-taxonomy.md` (event list), `11-files-modules.md` (modules) |
| JAM-299 (T2) | `04-channel-rules.md` (publishEvent semantics), `07-presence-and-channels.md` (channel-auth gate) |
| JAM-300 (T3) | `07-presence-and-channels.md` (subscription lifecycle), `apps/web/src/app/layout.tsx` (Mantine mount) |
| JAM-301 (T4) | T3 as canonical client behavior; same channel taxonomy and envelope |
| JAM-302 (T5) | `11-files-modules.md` (route diff table), `03-event-taxonomy.md` (payload shapes) |
| JAM-303 (T6) | `10-hipaa-and-audit.md` "Write points" table — rows 3, 4, 5 (email, PDA-read, signature) |
| JAM-304 (T7) | `13-verification.md` (full check list) |

## Where to start

Start with **JAM-298**. It's the only ticket with no blockers and it unblocks both downstream branches (the realtime branch via JAM-299, and the audit-sweep branch via JAM-303).

## Plan source

Approved plan: `~/.claude/plans/for-the-real-time-rosy-galaxy.md` (linked from every ticket).
