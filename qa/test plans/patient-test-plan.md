# QA Test Plan — Patient View

**View:** Patient
**Route prefix:** `/` (under `(protected)` route group)
**Entry:** `/dashboard`
**Required session state:** `isPatient === true`, `type === 'user'`

Cross-references:
- Registration, login, password reset, PDA invite acceptance → **`auth-test-plan.md`**
- Fax ingestion into My Records → **`fax-test-plan.md`**

---

## Setup

- [ ] A test user with an active `patientAssignments` row exists
- [ ] User can log in and reach `/dashboard` without redirect loop
- [ ] User profile starts blank (to test onboarding checklist) OR fully populated (to test dashboard summary)

---

## 1. Patient Registration & Login

Covered in full by `auth-test-plan.md`. Patient-specific checks:

- [ ] After successful registration, lands on `/dashboard` (not PDA `/representing`)
- [ ] Session flags: `isPatient=true`, `type='user'`, `isAgent=false`, `isPda=false`
- [ ] `patientAssignments` row exists (auto-assigned to a random admin)
- [ ] Forgot password → reset email received → resetting sends user back to `/login` → login works with new password

---

## 2. Dashboard

### Empty state (onboarding checklist)

- [ ] Fresh account shows "Getting Started" card with 4 items
- [ ] All 4 items show "Not done" initially
- [ ] "Create release" button is **disabled** with tooltip until profile AND a provider are added
- [ ] Counter reads `0 / 4 complete`
- [ ] Each action button (Add Info / Add Provider / Invite / Create) navigates to the right page with `?redirect=/dashboard`

### Populated state (dashboard summary)

- [ ] After completing all 4 items, summary shows welcome header with first name
- [ ] 4 stat cards: Releases / Providers / Designated Agents / Health Records, each with correct count
- [ ] Stat cards link to their corresponding pages
- [ ] Recent releases list shows up to 3 most-recent releases with provider names, date, status badge
- [ ] Empty "no releases" state when no releases exist

---

## 3. My Profile (`/profile`)

- [ ] Form pre-populates with any saved values
- [ ] Required fields: First Name, Last Name, DOB, Address, Phone
- [ ] Optional fields: Middle Name, SSN (last 4)
- [ ] SSN accepts only digits, max 4
- [ ] DOB picker does not allow future dates
- [ ] DOB and SSN are bottom-aligned despite SSN description text
- [ ] Save succeeds → success alert (no redirect) or redirects to `?redirect=...` target
- [ ] Avatar upload works; preview shown with initials fallback
- [ ] Change Password section appears at the bottom when accessed directly (not via redirect from onboarding checklist)
- [ ] Server-side PII encryption: saved DOB and SSN in DB appear as ciphertext (verify via manual DB query)
- [ ] Display: last-4 SSN shown correctly on admin/agent views after patient saves it

---

## 4. My Providers (`/my-providers`)

- [ ] "Add Provider" creates a new card, auto-opened
- [ ] Provider type dropdown: Insurance / Hospital / Facility — conditional fields change correctly
- [ ] Drag-reorder by grip handle works; accordion open state tracks with moved item
- [ ] Remove provider deletes just that card; open state updates correctly
- [ ] Save with empty required fields → inline validation errors
- [ ] Save succeeds → alert (no redirect) or redirects if `?redirect=...`
- [ ] Insurance-type shows membership card upload (front + back) — both files upload successfully to R2
- [ ] Membership card upload accepts images and PDF; rejects oversize files
- [ ] Dashboard provider count updates after save (revalidatePath effect)

---

## 5. My Records (`/my-records`)

- [ ] List shows all uploaded files + received faxes
- [ ] Each record displays source (fax vs manual upload), page count, uploader name (if staff-uploaded)
- [ ] Associated release code visible if the record was linked to a release
- [ ] **Drag-drop upload** works (whole card is a dropzone)
- [ ] **Multi-file upload** accepts multiple files at once; each file shows its own progress bar
- [ ] Per-file progress (0-100%), "Done" (green) or "Failed" (red) badge
- [ ] Accepted formats: images, PDF, TIFF, ZIP
- [ ] Max size 20MB per file — oversized file shows inline error
- [ ] Optional: linking upload to a release via combobox (search by code or provider name)
- [ ] Upload modal auto-closes 1.2s after success
- [ ] Incoming faxes appear automatically (no manual refresh needed after `revalidatePath`)
- [ ] Clicking a record navigates to `/my-records/[id]` with inline document viewer
- [ ] Record detail shows metadata (received date, page count, uploader/source, CID/DNIS for faxes)
- [ ] PDF renders inline in modal; TIFF renders with multi-page nav; images render with zoom
- [ ] Staff upload triggers "New record upload" email to patient (see auth-test-plan.md §9)

---

## 6. My Designated Agents (`/my-designated-agents`)

- [ ] **Assigned Zabaca agent card is NOT shown** (hidden per JAM-282)
- [ ] "Invite Representative" opens modal
- [ ] Email field required + validated
- [ ] Relationship autocomplete offers common relationships (Spouse, Son, etc.) but allows free text
- [ ] Permissions default to "None" for all three resource types
- [ ] Can toggle each permission to Viewer or Editor independently
- [ ] Send Invite creates pending entry with expiration date shown (48h TTL)
- [ ] Invite email is actually delivered to target inbox
- [ ] Pending entries with expired tokens show "Expired" badge and a Resend action
- [ ] Resend generates a new token; old token stops working
- [ ] Edit existing PDA → permissions update and success notification
- [ ] Revoke PDA → confirmation prompt, then row marked revoked
- [ ] Revoked PDA can no longer access any of patient's pages on next navigation
- [ ] Dashboard PDA count increments after successful invite

---

## 7. Releases (`/releases`)

### Prerequisites

- [ ] If profile is incomplete → page shows "Before you can create a release" card with missing prerequisites
- [ ] If no provider added → shown in prerequisites card
- [ ] When both met, normal releases page renders with list and "New Release" button

### List

- [ ] All releases shown with provider names, date, status (signed / pending / voided)
- [ ] Search box filters by provider name, authorized agent, and release code
- [ ] Clicking a release navigates to `/releases/[id]`

---

## 8. New Release (`/releases/new`)

- [ ] Personal info pre-populated from profile (First, Last, DOB, Address, Phone, Email, SSN)
- [ ] DOB and SSN are bottom-aligned
- [ ] Provider section is empty; "+ Add Provider" shows modal with saved providers
- [ ] Adding a saved provider populates all fields; newly added card is expanded
- [ ] Newly **added** provider cards are auto-expanded; pre-existing cards start **collapsed**
- [ ] Provider card header shows drag handle, title, type, Remove button, chevron
- [ ] **Remove button** sits in the header (not at the bottom of the panel)
- [ ] **Clicking Remove does NOT toggle the accordion** (stopPropagation)
- [ ] Spacing between Remove button and chevron looks correct (lg gap)
- [ ] Each provider card has record-type checkboxes (History/Physical, Diagnostic, Treatment, etc.)
- [ ] Sensitive records checkboxes require explicit opt-in (Communicable Diseases, Reproductive Health, HIV/AIDS, Mental Health, Substance Use, Psychotherapy, Other)
- [ ] Date range vs "All available dates" is a toggle; only one can be active
- [ ] Purpose of release field
- [ ] Authorization section "Give authorization to" dropdown shows only **accepted PDAs** (Zabaca agent excluded per JAM-282)
- [ ] **SSN field** accepts null/empty and still saves successfully (no "Release.ssn NOT NULL" error)
- [ ] On save: hard navigation to `/releases` or to `?redirect=...` target
- [ ] Dashboard release count increments
- [ ] Release code generated and visible in URL or detail page
- [ ] Patient PII encrypted at rest (verify via DB query)
- [ ] Creating a release with a PDA as authorized agent triggers "Release signature required" email (if feature enabled)

---

## 9. Release Detail (`/releases/[id]`)

- [ ] All fields render correctly (patient info, providers, auth rep, signature image if signed)
- [ ] **Signature pad** available if release is unsigned:
  - Draw-to-sign mode works (mouse + touch)
  - Type-name mode auto-generates cursive signature
  - "Clear" resets; "Keep existing" preserves prior signature; "Re-sign" opens fresh pad
- [ ] Required fields to sign: signatureImage, printedName, authDate, expirationDate or expirationEvent
- [ ] Submission (`POST /api/releases/[id]/sign`) persists signature + timestamps
- [ ] After signing, release shows signed badge; Sign button hidden
- [ ] Void button prompts confirmation
- [ ] Voided release shows voided badge; Void and Sign buttons hide
- [ ] Print button opens print-friendly view with all fields
- [ ] Release code is visible and shareable for admin/agent lookup
- [ ] Page respects `dynamic = force-dynamic` (no stale data after updates)

---

## 10. Scheduled Calls (feature currently disabled per JAM-282)

- [ ] Nav sidebar does **NOT** show "Scheduled Calls" or "Schedule a Call"
- [ ] Direct visit to `/schedule-call` → redirected to `/dashboard` (FEATURE_ENABLED=false guard)
- [ ] Direct visit to `/scheduled-calls` → redirected to `/dashboard`
- [ ] Flipping `FEATURE_ENABLED` to `true` in each page file restores functionality; then:
  - `/schedule-call` renders the form with agent info (if assigned) or a "no agent assigned" alert
  - `/scheduled-calls` renders past/upcoming calls in a table
  - Creating a call triggers the "Scheduled call" email to the agent

---

## 11. Cross-View: PDA Switcher

- [ ] If patient is ALSO a PDA, sidebar shows "Representative View" at bottom
- [ ] Clicking it navigates to `/representing` (hard navigation so session refreshes)
- [ ] PDA-only users (no patient assignment) should NOT see `/dashboard` at all

---

## 12. Regressions / Edge Cases

- [ ] Disabled account → redirected to `/suspended`
- [ ] Invalid session → redirected to `/login`
- [ ] Empty states render correctly across all pages
- [ ] Form navigation with `?redirect=` always uses hard navigation (not client router) so server data revalidates
- [ ] Hydration error — no "button inside button" warnings in console on any page
- [ ] Console clean of 404s for static assets
- [ ] PII-containing fields (DOB, SSN, name, address) are encrypted in `releases` and `users` tables; confirm via DB inspection
