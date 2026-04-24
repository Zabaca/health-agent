# QA Test Plan — Admin View

**View:** Admin
**Route prefix:** `/admin/*`
**Entry:** `/admin/dashboard`
**Required session state:** `type === 'admin'`

Cross-references:
- Staff invite acceptance (how admins are created) → **`auth-test-plan.md` §6**
- Login, password reset, suspended → **`auth-test-plan.md`**
- Faxing releases and viewing incoming faxes → **`fax-test-plan.md`**

---

## Setup

- [ ] Admin account with `users.type === 'admin'` exists
- [ ] A seeded set of patients, agents, and releases available for visual testing
- [ ] At least one pending staff invitation available to test the agents list view

---

## 1. Authentication & Session

- [ ] Admins are seeded or created via staff invite (`/staff-invite/[token]`) — see auth-test-plan.md §6
- [ ] Log in as admin → lands on `/admin/dashboard`
- [ ] Admin visiting `/dashboard` → redirected to `/admin/dashboard`
- [ ] Admin visiting `/agent/*` → redirected to `/admin/dashboard`
- [ ] Admin visiting `/representing` → redirected to `/admin/dashboard`
- [ ] Admin with `mustChangePassword: true` → forced to `/admin/change-password` until completed
- [ ] Disabled admin account → redirected to `/suspended`
- [ ] Admin password reset happens via admin tools (not `/forgot-password` — admins are skipped there — confirm via auth-test-plan.md §3)

---

## 2. Sidebar & Navigation

Visible nav items (confirm order):
- [ ] Dashboard
- [ ] Agents
- [ ] Call Schedule
- [ ] Lookup Release
- [ ] (bottom) My Profile

All nav items render correct icons and active state.

---

## 3. Dashboard / Patients List (`/admin/dashboard` and `/admin/patients`)

- [ ] Table of all patients with columns: name, email, SSN (last 4 decrypted), assigned agent, disabled state
- [ ] Search/filter works (if present)
- [ ] Pagination works if large dataset
- [ ] Clicking a patient row navigates to `/admin/patients/[id]`
- [ ] Disabled patients are visually flagged
- [ ] Patients **without** assigned agents show "Unassigned" or similar
- [ ] All PII on list is decrypted (no ciphertext visible)

---

## 4. Patient Detail (`/admin/patients/[id]`)

Tabbed interface:

### Overview tab
- [ ] Personal info shown with decrypted SSN (last-4 only) and DOB
- [ ] Account status (active / disabled) with toggle
- [ ] Disable / Reinstate works with confirmation
- [ ] Disable triggers "Account suspended" email; Reinstate triggers "Account reinstated" email (see auth-test-plan.md §9)

### Health Records tab
- [ ] All uploaded / faxed records listed
- [ ] Click through → record detail
- [ ] Upload affordance works (drag-drop, multi-file, 20MB limit, PDF/image/TIFF/ZIP accepted)
- [ ] Uploading as admin triggers "New record upload" email to patient

### Providers tab
- [ ] Provider list renders (decrypted where relevant)
- [ ] Add / edit / remove providers works
- [ ] Reorder drag works

### Releases tab
- [ ] Lists active and voided releases
- [ ] "+ New Release" button navigates to `/admin/patients/[id]/releases/new`
- [ ] Click a release → detail view

### PDAs tab
- [ ] Shows all `patientDesignatedAgents` entries for the patient (pending / accepted / revoked)
- [ ] Permission levels displayed per relationship

### Recorded Calls tab
- [ ] Call history with timestamps shown if any

### Agent Assignment
- [ ] Can assign or reassign agent
- [ ] Assignment change reflects in the DB immediately
- [ ] Admin cannot assign themselves as agent unless they also have agent role

---

## 5. New Release as Admin (`/admin/patients/[id]/releases/new`)

- [ ] Patient info pre-fills from patient record (decrypted PII)
- [ ] Provider list shows patient's saved providers
- [ ] Authorization section (staff mode):
  - Default authorized rep is the patient's assigned Zabaca agent (agentInfo pre-fill)
  - Staff can manually edit all auth agent fields
- [ ] SSN field accepts null/empty → saves successfully (no NOT NULL error)
- [ ] Signature required from patient (not admin) — verify patient still needs to sign
- [ ] Creating a release triggers "Release signature required" email to patient
- [ ] On save → redirected to `/admin/patients/[id]` (or configured `redirectAfterSave`)
- [ ] Release code generated and visible

---

## 6. Release Detail (`/admin/patients/[id]/releases/[releaseId]`)

- [ ] All fields render (patient info, providers, auth rep, signature)
- [ ] Print button works
- [ ] Void button with confirmation → release marked voided; void state prevents signing/fax
- [ ] Fax-to-provider action: see **`fax-test-plan.md` §1**
- [ ] Fax request log shows all past send attempts with status + timestamp + JOBID
- [ ] Log updates when Faxage sends confirmation callback (awaiting → success/failed)
- [ ] Signature section: if release is pending signature, admin cannot sign on patient's behalf (confirm)

---

## 7. Agents List (`/admin/agents`)

- [ ] Table of all agents (admins + Zabaca agents)
- [ ] Shows active / disabled / pending invitation status
- [ ] "+ Invite Agent" button opens invitation modal
- [ ] Invitation form: email, role (admin or agent) — submit sends email
- [ ] Invite email arrives and contains `/staff-invite/[token]` link (48h TTL)
- [ ] Pending invitation rows show resend action if token expired
- [ ] Resend generates new token, old one stops working
- [ ] Cancel pending invitation (`DELETE /api/admin/staff-invites/[id]`) removes the row

---

## 8. Agent Detail (`/admin/agents/[id]`)

- [ ] Profile fields (name, email, phone, address, avatar)
- [ ] List of assigned patients with counts
- [ ] Disable / Reinstate toggles work, with email triggers
- [ ] **Reset Password** action (`POST /api/admin/agents/[id]/reset-password`) forces `mustChangePassword=true` for that agent
- [ ] Clicking a patient navigates to `/admin/patients/[id]`

---

## 9. Call Schedule (`/admin/call-schedule`)

Feature currently hidden from patient UI (JAM-282) but admin view may still display calls that exist in DB.

- [ ] List of scheduled calls
- [ ] Shows patient name, agent name, scheduled time, status
- [ ] Click → `/admin/call-schedule/[id]` detail
- [ ] Detail shows patient PII (decrypted) + agent info
- [ ] Mark as complete / no-show works (if implemented)
- [ ] ICS calendar download (`/api/scheduled-calls/[id]/ics`) produces a valid iCal file

---

## 10. Records (`/admin/records`)

- [ ] Table of all files in the system (faxed + uploaded)
- [ ] Shows source (fax / upload), page count, fax metadata (CID, DNIS, TSID)
- [ ] Filter by assigned / unassigned
- [ ] Incoming faxes appear automatically after Faxage webhook fires (see fax-test-plan.md §2)
- [ ] Click → `/admin/records/[id]` detail
- [ ] Detail shows inline viewer + metadata (uploader, upload time, fax details)
- [ ] Can assign an unassigned file to a patient → moves out of unassigned queue
- [ ] Upload action works (drag-drop, multi-file); can optionally link to a release by code

---

## 11. Release Lookup (`/admin/releases/lookup`)

- [ ] Search by release code (case-insensitive; zero-padded handling confirmed)
- [ ] Returns matching release with: code, patient name, created date, signed status, voided status, link to full view
- [ ] Handles "not found" gracefully
- [ ] Works for active and voided releases
- [ ] Works regardless of which admin originally created or processed it

---

## 12. My Profile (`/admin/profile`)

- [ ] Admin can edit firstName, middleName, lastName, phone, address, avatar
- [ ] Save persists; no DOB/SSN fields for admin profile
- [ ] Avatar upload works

---

## 13. Change Password (`/admin/change-password`)

- [ ] Current password required
- [ ] New password + confirmation must match (min 8 chars)
- [ ] After successful change, `mustChangePassword` flag clears
- [ ] Admin is redirected to `/admin/dashboard` after change
- [ ] If visited without `mustChangePassword`, still accessible as a voluntary password change

---

## 14. Cross-View Interactions

- [ ] Admin creates release → patient sees it in their `/releases` list
- [ ] Admin faxes release → fax-test-plan.md §1, §3 (confirmation lifecycle)
- [ ] Admin disables patient → patient log-in is blocked (redirected to `/suspended`) + email
- [ ] Admin re-enables patient → email + login resumes
- [ ] Admin invites agent → invitee receives `/staff-invite/[token]` email → accepts per auth-test-plan.md §6
- [ ] Admin force-resets agent/patient password → next login forced to change-password page
- [ ] Admin assigns agent to unassigned patient → that agent now sees patient in their caseload

---

## 15. Regressions / Permissions

- [ ] Non-admin visiting `/admin/*` → redirected away
- [ ] All PII displays are decrypted (no encrypted ciphertext visible)
- [ ] Actions that modify data (disable, void, fax) require explicit confirmation
- [ ] Pagination/filters persist across page refreshes (if designed to)
- [ ] Multiple admins can act simultaneously without race conditions (transactional DB operations)
- [ ] No accidental leakage of disabled-user data through admin views (disabled patients still visible but flagged)
