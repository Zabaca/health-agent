# QA Test Plan — PDA View (Patient Designated Agent)

**View:** PDA
**Route prefix:** `/representing/*` and `/account`
**Entry:** `/representing`
**Required session state:** `isPda === true`

Cross-references:
- Invite acceptance (register or login flow) → **`auth-test-plan.md` §5**
- Login, password reset, suspended → **`auth-test-plan.md`**
- Faxing releases to providers → **`fax-test-plan.md`**

---

## Setup

Three test user shapes to cover:
1. **PDA-only** (not a patient themselves): `isPda=true, isPatient=false`
2. **Patient + PDA** (dual role): `isPda=true, isPatient=true`
3. **PDA representing multiple patients** at once

You'll also need a patient account that can invite PDAs, so plan on having a patient test account to drive the invitation flow.

---

## 1. Invitation & Onboarding

See **`auth-test-plan.md` §5** for the full `/invite/[token]` acceptance flow. PDA-specific post-conditions:

- [ ] After accepting (register flow), session flags: `isPda=true`, `isPatient=false` (unless also a patient)
- [ ] First login → lands on `/representing` (NOT `/dashboard`)
- [ ] `patientDesignatedAgents` row is `status: 'accepted'` with `agentUserId` set to the PDA user
- [ ] Resent invite: old token stops working, new token delivered, expiration resets

---

## 2. Authentication & Middleware

- [ ] PDA-only user visiting `/dashboard` → redirected to `/representing`
- [ ] PDA-only user visiting `/profile`, `/my-providers`, etc. → redirected to `/representing`
- [ ] PDA-only user visiting `/account` → allowed (their own profile page)
- [ ] PDA-only user visiting `/admin/*` or `/agent/*` → redirected to `/representing`
- [ ] Dual-role user (patient + PDA) visiting `/dashboard` → allowed (stays on patient view)
- [ ] Dual-role user visiting `/representing` → allowed
- [ ] Disabled PDA user → redirected to `/suspended`

---

## 3. Representing Index (`/representing`)

- [ ] **Single patient represented** → auto-redirect to `/representing/[patientId]`
- [ ] **Multiple patients** → list of patient cards with names and relationship
- [ ] **No patients (post-revocation)** → shows "You are not currently representing any patients" message
- [ ] Clicking a patient card navigates to `/representing/[patientId]`

---

## 4. Sidebar Navigation (dynamic)

- [ ] Sidebar reflects the PDA's active relationships from the DB
- [ ] For each represented patient, nested nav items appear based on granted permissions:
  - Providers — only shown if `manageProvidersPermission` is not null
  - HIPAA Releases — only shown if `releasePermission` is not null
  - Health Records — only shown if `healthRecordsPermission` is not null
- [ ] "My Account" appears at the bottom
- [ ] "Patient View" switcher appears at the bottom **only** for dual-role users
- [ ] Revoking a PDA from patient side, then refreshing on PDA side → sidebar nav for that patient disappears

---

## 5. My Account (`/account`)

- [ ] Profile form with firstName, lastName, phoneNumber, address, avatar
- [ ] No DOB / SSN fields (this is an account profile, not a patient profile)
- [ ] Avatar upload to R2 works; preview with initials fallback
- [ ] Save updates the user row
- [ ] Changing password section (if present on this page) — verify flow

---

## 6. Patient Dashboard (`/representing/[patientId]`)

- [ ] Shows patient header (name, relationship)
- [ ] Resource cards render **only** for granted permissions (hidden if null)
- [ ] Each card shows access level label: "Viewer" or "Editor"
- [ ] Clicking a card navigates to the resource page

---

## 7. Patient Records (`/representing/[patientId]/records`)

Permission gates:
- `healthRecordsPermission: null` → page should 404 or redirect
- `healthRecordsPermission: 'viewer'` → read-only list; no upload button
- `healthRecordsPermission: 'editor'` → upload + view

Tests:
- [ ] Viewer role: list renders, each record is clickable to view; no upload affordance
- [ ] Editor role: upload control visible; drag-drop and multi-file upload work (same specs as `patient-test-plan.md` §5)
- [ ] Uploading as PDA triggers "New record upload" email to the patient (PDA shown as uploader)
- [ ] Record detail page works for viewer AND editor (view is always allowed at both levels)
- [ ] Incoming faxes for this patient also appear (PDA can view them if viewer/editor)
- [ ] Deleting records: verify allowed only at editor level, if feature exists

---

## 8. Patient Providers (`/representing/[patientId]/providers`)

- `manageProvidersPermission: null` → 404/redirect
- `manageProvidersPermission: 'viewer'` → read-only list
- `manageProvidersPermission: 'editor'` → add/edit/delete

Tests:
- [ ] Viewer: provider cards are read-only; no "Add Provider" button; no remove buttons
- [ ] Editor: can add new providers, edit existing, drag-reorder, remove
- [ ] Save persists and is reflected on patient's own `/my-providers` view

---

## 9. Patient Releases (`/representing/[patientId]/releases`)

- `releasePermission: null` → 404/redirect
- `releasePermission: 'viewer'` → list and detail only
- `releasePermission: 'editor'` → can create, fax, void

Tests:
- [ ] Viewer: can see releases where PDA is listed as authorized rep; cannot create new
- [ ] Editor: "New Release" button visible
- [ ] New release form (`/representing/[patientId]/releases/new`): PDA name appears in authorized rep section with relationship label (e.g. "Spouse")
- [ ] Release requires patient signature to finalize; PDA cannot sign on patient's behalf
- [ ] Patient receives "Release signature required" email when PDA creates a release (verify per auth-test-plan.md §9)
- [ ] Release detail (`/representing/[patientId]/releases/[releaseId]`):
  - Print works
  - Fax-to-provider action works (editor only) — see **`fax-test-plan.md` §1**
  - Fax request log visible with timestamps, statuses

---

## 10. Permission Edge Cases

- [ ] Patient changes PDA permission from Editor → Viewer while PDA is on the page → next action fails with 403 or page revalidates
- [ ] Patient revokes access entirely → PDA sidebar updates on next load; trying to access patient URL → 404/redirect
- [ ] Patient re-invites a revoked PDA → new `patientDesignatedAgents` row, previous permissions do not carry over
- [ ] PDA loses all relationships → `isPda` flag in session stays true until next login; UI should handle "no patients" gracefully

---

## 11. Dual-Role Switcher

- [ ] User is both patient and PDA → both `/dashboard` and `/representing` are accessible
- [ ] Patient View sidebar has "Representative View" at the bottom
- [ ] Representative View sidebar has "Patient View" at the bottom
- [ ] Switcher uses hard navigation (so session/role context refreshes)
- [ ] PII from one context should not bleed into the other in component state

---

## 12. Regressions / Cross-View

- [ ] Creating a release as PDA → release appears in patient's `/releases` list
- [ ] Uploading records as PDA → appears in patient's `/my-records`
- [ ] PDA's own profile changes (`/account`) do **not** affect patient's profile
- [ ] No "Assigned by Zabaca" cards visible anywhere on PDA views
- [ ] Disabled PDA account → suspended flow
