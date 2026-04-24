# Health Agent — User Views Summary

## About the Zabaca Portal

Zabaca is a patient-facing portal for collecting and managing personal medical records. Patients use it to build a profile of their healthcare providers (doctors, hospitals, insurance), create HIPAA release forms authorizing those providers to share records, and track the documents that come back. Releases can be faxed directly to providers from within the portal, and incoming faxes are routed into the patient's record library automatically.

Patients can invite family members or caregivers (PDAs — Patient Designated Agents) to act on their behalf with granular per-resource permissions. Zabaca staff — **admins** oversee the whole system, and **agents** handle a caseload of assigned patients — can upload records, create releases, fax providers, and manage patient accounts.

The app is the central place where a patient's healthcare paper trail is consolidated, authorized, and shared.

## QA Plan Files

- `SUMMARY.md` — this file
- `auth-test-plan.md` — cross-cutting: registration, login, forgot/reset password, PDA invite, staff invite, suspended
- `fax-test-plan.md` — cross-cutting: outgoing + incoming fax, confirmation webhook, document viewer
- `patient-test-plan.md` — patient view
- `pda-test-plan.md` — Patient Designated Agent view
- `admin-test-plan.md` — admin view
- `agent-test-plan.md` — Zabaca agent view

## Recommended Test Order

Follow this sequence — each step builds on state created by the previous one, so failing early avoids wasted effort downstream.

1. **`auth-test-plan.md`** — Foundation. If auth is broken, nothing else can be exercised. Covers registration, login, password recovery, and both invite flows (PDA + staff).
2. **`patient-test-plan.md`** — The primary user. Registration here seeds the state (profile, providers, records, releases) that later plans depend on. Finish this before inviting PDAs or assigning agents.
3. **`pda-test-plan.md`** — Requires an established patient with records/providers to represent. Exercises the invite-acceptance handoff from the patient plan.
4. **`admin-test-plan.md`** — Needs patients (and ideally PDAs) already in the system to meaningfully test management features: patient detail tabs, agent assignment, disable/reinstate, release oversight.
5. **`agent-test-plan.md`** — Agents are created through the admin's staff-invite flow; their caseload is assigned by admins. Run after admin is verified.
6. **`fax-test-plan.md`** — Integration across all roles. Requires signed releases (patient + admin/agent), saved providers with fax numbers, and active caseloads. Best saved for last so each dependency is already vetted.

---

## View Matrix

| View | Route Prefix | Entry Point | Session Flag |
|------|-------------|-------------|--------------|
| Patient | `(protected)/` | `/dashboard` | `isPatient === true` |
| PDA | `(patient-designated-agent)/` | `/representing` | `isPda === true` |
| Admin | `(admin)/` | `/admin/dashboard` | `type === 'admin'` |
| Agent | `(agent)/` | `/agent/dashboard` | `isAgent === true` |

Session flags are derived in `src/auth.ts` from DB tables:
- `isPatient` — row in `patientAssignments` (patient has assigned Zabaca agent)
- `isPda` — accepted row in `patientDesignatedAgents` (user is representing someone)
- `isAgent` — row in `zabacaAgentRoles` (user is a Zabaca staff agent)
- `type` — `'admin'` vs `'user'` (set directly on `users` table)

Users can hold multiple roles simultaneously (e.g., patient + PDA). Middleware (`src/middleware.ts`) enforces route access.

---

## 1. Patient View

**Who:** End users managing their own health records and HIPAA releases.

**Nav items:** Dashboard · My Profile · My Providers · Releases · My Records · My Designated Agents. If also a PDA, a "Representative View" switcher appears at the bottom of the sidebar.

**Key features:**
- Personal profile with encrypted PII (DOB, SSN last-4)
- Manage list of healthcare providers (drag-reorder, insurance cards)
- HIPAA Release creation, signing, voiding, printing
- Upload health records & associate with releases
- Invite family/caregivers as PDAs with granular permissions (viewer/editor per resource)

**Cross-view interactions:**
- Invites PDAs (with scoped permissions)
- Revokes PDA access at will
- Receives agent assignment from Admin (currently hidden in UI per JAM-282)

---

## 2. PDA View (Patient Designated Agent)

**Who:** Family members, caregivers, or trusted representatives acting on behalf of a patient.

**Nav items:** Dynamic — one nav entry per represented patient, with nested items (Providers / HIPAA Releases / Health Records) shown only for permissions they were granted. At the bottom: My Account, plus a "Patient View" switcher if the user is also a patient.

**Key features:**
- Represent multiple patients (selectable from `/representing`)
- Granular access: three independent permission types × two levels (viewer/editor)
- Create releases as the authorized representative on behalf of patient
- Fax releases to providers (editor permission required)

**Cross-view interactions:**
- Accepts invite from patient via email link
- Access can be revoked at any time by patient
- If user is both patient and PDA, can switch between views via sidebar

---

## 3. Admin View

**Who:** Zabaca staff administrators with full system oversight.

**Nav items:** Dashboard · Agents · Call Schedule · Lookup Release · (bottom) My Profile.

**Key features:**
- See **all** patients in the system
- Create and manage Zabaca agents (invite, view caseload, disable)
- Assign/reassign patient → agent
- Create releases on behalf of any patient
- Fax releases to providers; see fax request log
- Void any release
- Upload files and assign to patients
- Search any release by code
- Disable/enable user accounts; force password resets

**Cross-view interactions:**
- Invites agents via staff-invite email link
- Assigns agents to patients
- Creates releases on behalf of patients

---

## 4. Agent View (Zabaca Agent)

**Who:** Zabaca staff who handle a caseload of assigned patients.

**Nav items:** Dashboard · Call Schedule · Lookup Release · (bottom) My Profile. Same shape as admin, but scope is limited to assigned patients only.

**Key features:**
- Sees only patients assigned to them (subset of admin view)
- Create releases for assigned patients
- Fax releases to providers
- Process the shared unassigned-records queue; route incoming faxes to their patients
- View/edit providers and records for assigned patients
- Search releases by code

**Cross-view interactions:**
- Receives patient assignments from Admin
- Creates releases as authorized representative
- Patients schedule calls with them (feature currently hidden per JAM-282)

---

## Access Control Summary

| Resource | Patient | PDA | Admin | Agent |
|----------|---------|-----|-------|-------|
| Own profile | ✓ | ✓ | ✓ | ✓ |
| Own records | ✓ | Patient's records (with perm) | All | Assigned patients only |
| Create release (own) | ✓ | For represented patient (editor) | For any patient | For assigned patient |
| Void release | ✓ | If editor | ✓ | ✓ |
| Fax release | — | If editor | ✓ | ✓ |
| Invite PDA | ✓ | — | — | — |
| Assign agent | — | — | ✓ | — |
| View all patients | — | Only represented | ✓ | Assigned only |
| Lookup release by code | — | — | ✓ | ✓ |

---

## Notes for QA

- **Route isolation is middleware-enforced.** Attempting to access `/admin/*` as a patient, or `/dashboard` as an agent, should redirect to the correct home page.
- **PII is encrypted at rest.** DOB and SSN (last-4) are encrypted; displayed only after `decrypt()` / `decryptPii()`.
- **PDA permissions are per-resource.** A PDA with `viewer` on records but `editor` on releases should see records read-only but be able to create releases.
- **Schedule Call is currently hidden (JAM-282).** Nav item removed; direct URL access still works but agent may not be displayed depending on page.
- **Zabaca-assigned agent is currently hidden (JAM-282)** from My Designated Agents and release form recipient list, but the DB assignment still exists.
