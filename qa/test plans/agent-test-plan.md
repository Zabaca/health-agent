# QA Test Plan — Agent View (Zabaca Agent)

**View:** Agent
**Route prefix:** `/agent/*`
**Entry:** `/agent/dashboard`
**Required session state:** `isAgent === true`

Cross-references:
- Staff invite acceptance (how agents are created) → **`auth-test-plan.md` §6**
- Login, password reset, suspended → **`auth-test-plan.md`**
- Faxing releases and managing incoming faxes → **`fax-test-plan.md`**

---

## Setup

- [ ] Agent account created via staff invite (has `zabacaAgentRoles` row)
- [ ] At least 2 patients assigned to the agent (to verify scoping)
- [ ] At least 1 patient NOT assigned to the agent (to verify access denial)
- [ ] At least 1 unassigned fax/upload in the system (to test unassigned-records queue)

---

## 1. Staff Invite & Registration

See **`auth-test-plan.md` §6** for the full staff-invite acceptance flow. Agent-specific post-conditions:

- [ ] After accepting a staff invite with `role: 'agent'`, the user row has `zabacaAgentRoles` entry
- [ ] Session flag `isAgent` is `true` on first login
- [ ] Agent lands on `/agent/dashboard`
- [ ] Staff-invite form accepted optional avatar; verify avatar URL on `/agent/profile`
- [ ] Agent password reset happens via admin force-reset (`POST /api/admin/agents/[id]/reset-password`) — see admin-test-plan.md §8
- [ ] After forced reset, agent is redirected to `/agent/change-password` on next login

---

## 2. Authentication & Middleware

- [ ] Log in as agent → lands on `/agent/dashboard`
- [ ] Agent visiting `/dashboard` → redirected to `/agent/dashboard`
- [ ] Agent visiting `/admin/*` → redirected to `/agent/dashboard`
- [ ] Agent visiting `/representing` → redirected to `/agent/dashboard`
- [ ] Agent with `mustChangePassword: true` → forced to `/agent/change-password`
- [ ] Disabled agent → redirected to `/suspended`

---

## 3. Sidebar & Navigation

Visible nav items:
- [ ] Dashboard
- [ ] Call Schedule
- [ ] Lookup Release
- [ ] (bottom) My Profile

Confirm order, icons, active state.

---

## 4. Dashboard / Patients List (`/agent/dashboard` and `/agent/patients`)

- [ ] **Only shows patients assigned to this agent** (scoped to `patientAssignments.assignedToId`)
- [ ] Columns: name, email, SSN (last 4 decrypted), disabled state
- [ ] Search/filter works
- [ ] Pagination works
- [ ] Clicking a patient → `/agent/patients/[id]`
- [ ] Un-assigned patients do NOT appear in the list
- [ ] Patients assigned to a different agent do NOT appear
- [ ] All PII displays are decrypted

---

## 5. Patient Detail (`/agent/patients/[id]`)

Attempting to access an unassigned patient's detail should 404 or redirect.

### Overview tab
- [ ] Personal info with decrypted SSN last-4 and DOB
- [ ] Account status shown (disable toggle may be admin-only — verify current behavior)

### Health Records tab
- [ ] All uploaded / faxed records for this patient listed
- [ ] Upload action works (drag-drop, multi-file, 20MB, PDF/image/TIFF/ZIP)
- [ ] Uploading as agent triggers "New record upload" email to patient
- [ ] Click → record detail with inline viewer (PDF/TIFF/image handled per fax-test-plan.md §5)

### Providers tab
- [ ] Patient's providers listed
- [ ] Add / edit / remove works
- [ ] Reorder drag works

### Releases tab
- [ ] Active and voided releases listed
- [ ] "+ New Release" navigates to `/agent/patients/[id]/releases/new`

### PDAs tab
- [ ] Patient's designated agents listed with permission levels

### Recorded Calls tab
- [ ] Call history with this agent visible (if any)

### Access control
- [ ] Attempting to open `/agent/patients/[unassigned-patient-id]` → 404 or redirect (NOT silent access)

---

## 6. New Release as Agent (`/agent/patients/[id]/releases/new`)

- [ ] Patient info pre-fills (decrypted PII)
- [ ] Provider list shows patient's saved providers
- [ ] Authorization section (staff mode):
  - Agent can designate self as authorized representative
  - Agent info fields pre-fill from agent's own profile
- [ ] SSN field accepts null/empty and saves successfully
- [ ] Patient signature still required to finalize
- [ ] Creating a release triggers "Release signature required" email to patient
- [ ] Saving redirects to `/agent/patients/[id]` or configured target
- [ ] Trying to create release for an unassigned patient via URL tampering → 404

---

## 7. Release Detail (`/agent/patients/[id]/releases/[releaseId]`)

- [ ] All fields render (patient info, providers, auth rep, signature)
- [ ] Print works
- [ ] Void action with confirmation
- [ ] Fax-to-provider works — see **`fax-test-plan.md` §1**
- [ ] Request log appends a new entry with timestamp + status
- [ ] Confirmation callback updates log from "awaiting" → "success"/"failed" (fax-test-plan.md §3)

---

## 8. Call Schedule (`/agent/call-schedule`)

Feature currently hidden from patient UI (JAM-282) but agent may still see past/existing calls.

- [ ] Only shows calls where this agent is the scheduled agent
- [ ] Columns: patient, scheduled time, status
- [ ] Click → `/agent/call-schedule/[id]` detail
- [ ] Detail shows patient PII (decrypted) + scheduling info
- [ ] Mark complete / no-show updates status (if implemented)

---

## 9. Records / Unassigned Queue (`/agent/records`)

- [ ] Lists faxes / uploads WITHOUT an assigned `patientId`
- [ ] Metadata (fax source, CID, DNIS, TSID, page count) shown
- [ ] Click → `/agent/records/[id]` detail with inline viewer (PDF/TIFF/image)
- [ ] Assign-to-patient action:
  - Dropdown shows only **this agent's assigned patients**
  - Assigning moves the record out of the queue
  - Record now shows under that patient's records
- [ ] Race condition: two agents opening the same record simultaneously — first to assign wins; second sees 404 or moved message
- [ ] Unassigned record triggered by an incoming fax webhook should appear here automatically

---

## 10. Release Lookup (`/agent/releases/lookup`)

- [ ] Search by release code returns matching release
- [ ] Lookup scope: confirm whether agents can find releases outside their caseload (behavior differs from admin — verify against `/api/agent/releases/lookup/[code]` implementation)
- [ ] Clicking the result navigates to the correct release detail (for assigned patients)
- [ ] "Not found" state handled gracefully

---

## 11. My Profile (`/agent/profile`)

- [ ] Agent can edit first / middle / last name, phone, address, avatar
- [ ] Save persists
- [ ] Updated name reflects in staff-mode release forms (where agent is the authorized rep)

---

## 12. Change Password (`/agent/change-password`)

- [ ] Current password required + validated
- [ ] New password + confirmation match (min 8 chars)
- [ ] `mustChangePassword` clears after success
- [ ] Redirect to `/agent/dashboard` after success
- [ ] Accessible voluntarily even if not forced

---

## 13. Scoping / Access Control

Critical for this view — confirm isolation:

- [ ] Cannot access patient detail for unassigned patient (URL tampering → 404/redirect)
- [ ] Cannot create release for unassigned patient
- [ ] Cannot access files uploaded to other agents' patients via direct URL
- [ ] Cannot fax releases for unassigned patients
- [ ] Dashboard shows ONLY assigned patients (not all patients)
- [ ] Admin reassigns patient from agent A to agent B → agent A loses access on next page load

---

## 14. Cross-View Interactions

- [ ] Agent creates release → patient sees it in their `/releases` list
- [ ] Agent faxes release → patient's release detail fax log shows the attempt + confirmation
- [ ] Agent uploads record → appears in patient's `/my-records` (and admin view)
- [ ] Admin disables agent → agent logged out / blocked → redirected to `/suspended`
- [ ] Admin reassigns caseload → agent's dashboard updates on next refresh

---

## 15. Regressions / Edge Cases

- [ ] Agent with zero assigned patients → dashboard shows empty state, not an error
- [ ] Agent's patient list updates when admin assigns a new patient (may require re-login or SSR refresh)
- [ ] PII displays are decrypted everywhere (no ciphertext leaks)
- [ ] Fax action has loading state; prevents double-submit
- [ ] Console clean of hydration warnings, 404s on static assets
