# 01 — Current-state audit

Verified by reading the codebase 2026-05-07.

## Infrastructure inventory

| Concern | Status | Evidence |
|---|---|---|
| Email | **Active (Resend)** | `apps/web/src/lib/email.ts:1-41`; 9 templates already wired |
| SMS | None | — |
| Mobile push | None (mock only) | `apps/mobile/src/mock/notifications.ts`; no `expo-notifications` import |
| Web push / Service Worker | None | — |
| In-app toast | Mantine `<Notifications />` | `apps/web/src/app/layout.tsx:25` |
| In-app inbox | None | — |
| WebSocket / SSE / Pusher / Ably | None | — |
| Polling (refetchInterval) | None | — |
| Background jobs / Vercel Cron | None | `vercel.json` has no cron entries |
| `waitUntil` usage | None | — |
| Audit log (general HIPAA action log) | **Missing** | Only domain-specific: `fileUploadLog`, `releaseRequestLog`, `Session` (devices) |
| Optimistic locking | **None anywhere** | All updates are blind overwrites |
| Release-signing race | **Open bug** | `apps/web/src/app/api/releases/[id]/sign/route.ts:21-37` — check-then-update is non-atomic |

## Roles model (verified)

- `users.type ∈ {admin, user}` — coarse axis only
- Patient: any user with a `patientAssignments` row (assigned Zabaca agent)
- PDA: user with a row in `patientDesignatedAgents`, per-relationship scopes: `healthRecordsPermission`, `manageProvidersPermission`, `releasePermission` ∈ `{viewer, editor}`
- Zabaca Agent: row in `zabacaAgentRoles` (staff)
- Session payload (`apps/web/src/auth.ts:42-53`): `{ id, email, type, isAgent, isPda, isPatient, mustChangePassword, onboarded, disabled }`
- Mobile session: same JWT in `expo-secure-store`, decoded client-side (`apps/mobile/src/lib/api.ts:82-92`)

## Existing email-trigger surfaces

These are the natural hook points for the new event publisher.

| Event | Route handler | Current side-effect |
|---|---|---|
| Release created | `apps/web/src/app/api/releases/route.ts:45-153` | `sendNewReleaseNotificationEmail` to agent |
| Record uploaded by PDA/Agent for patient | `apps/web/src/app/api/records/upload/route.ts:9-90` | `sendNewRecordUploadEmail` to patient |
| PDA invite created | `apps/web/src/app/api/my-designated-agents/route.ts:63-130` | `sendInviteEmail` |
| Scheduled call created | `apps/web/src/app/api/scheduled-calls/route.ts:43+` | `sendScheduledCallEmail` |
| Release signed | `apps/web/src/app/api/releases/[id]/sign/route.ts:9-38` | **No notification — gap** |
| PDA invite accepted/declined | `apps/web/src/app/api/representing/pending/[id]/route.ts:10-47` | **No notification — gap** |
| Profile updated | `apps/web/src/app/api/profile/route.ts:41-72` | **No audit, no notification — gap** |

## Concurrency findings

All update endpoints reviewed perform blind overwrites — no `version` check, no `If-Match`, no `SELECT ... FOR UPDATE`, no lock tables.

Highest-risk surfaces:

- **Release form ↔ signing**: PUT release deletes/reinserts providers blindly (`apps/web/src/app/api/releases/[id]/route.ts:46-50`); concurrent edit from patient and PDA can interleave.
- **Signature**: check-then-update is non-atomic in `apps/web/src/app/api/releases/[id]/sign/route.ts:21-37`. Two simultaneous signs both succeed.
- **Health record metadata**: PATCH at `apps/web/src/app/api/documents/[id]/route.ts:89-90` has no prior-state check.
- **Profile**: PATCH/PUT at `apps/web/src/app/api/profile/route.ts:49-52, 65-66` — no version, no audit.

## Form/draft persistence

None. Release form lives in React state only (`apps/web/src/components/release-form/ReleaseForm.tsx:34-55`); unsubmitted data is lost on navigation. No localStorage / AsyncStorage drafts.
