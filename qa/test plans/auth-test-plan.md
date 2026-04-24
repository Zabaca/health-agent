# QA Test Plan — Authentication & Account Flows

Cross-cutting flows used by every view. Role-specific plans reference these sections instead of repeating them.

---

## Setup

- [ ] SMTP/Resend API key configured in environment (or logs fall back to console — know which)
- [ ] Empty DB or known-state DB with seed users for login tests
- [ ] Test mailbox for receiving invite, password-reset, and notification emails

---

## 1. Patient Registration (`/register`)

- [ ] Visit `/register` while logged out → form renders
- [ ] Fields: Email, Password, Confirm Password (min 8 chars)
- [ ] Passwords mismatch → inline error
- [ ] Password < 8 chars → inline error
- [ ] Invalid email format → inline error
- [ ] Duplicate email → server error message (email already registered)
- [ ] Successful submission → user row created in `users` table
- [ ] Successful submission → `patientAssignments` row auto-created (random admin assigned)
- [ ] Auto sign-in occurs; redirect to `/dashboard`
- [ ] Session flags after registration: `isPatient=true`, `isAgent=false`, `isPda=false`, `type='user'`
- [ ] Registering while already logged in → redirected to appropriate home page

---

## 2. Login (`/login`)

- [ ] Form fields: Email, Password
- [ ] Empty fields → inline validation
- [ ] Invalid credentials → "Invalid email or password" message; no info about which part was wrong
- [ ] Disabled user login → redirected to `/suspended`
- [ ] Admin with `mustChangePassword: true` → forced to `/admin/change-password`
- [ ] Agent with `mustChangePassword: true` → forced to `/agent/change-password`
- [ ] Logout clears session; visiting protected URLs redirects to `/login`
- [ ] Session cookie is httpOnly + secure in production
- [ ] Login pages should redirect already-authenticated users to their role's home (admin → `/admin/dashboard`, agent → `/agent/dashboard`, PDA-only → `/representing`, patient → `/dashboard`)

---

## 3. Forgot Password (`/forgot-password`)

- [ ] Form field: Email
- [ ] Submit with unknown email → still returns 200 (no leak of which emails exist)
- [ ] Submit with admin email → silently skipped (admins reset via admin tools); no error visible to user
- [ ] Submit with valid non-admin email → `passwordResetTokens` row created, TTL = 1 hour
- [ ] Email arrives at target inbox with correct subject and body
- [ ] Reset link has format `/reset-password?token=<uuid>`
- [ ] Multiple requests for the same email — each generates a new token (previous tokens still valid until expiry)

---

## 4. Reset Password (`/reset-password?token=...`)

- [ ] Missing token → error state / redirect
- [ ] Invalid token → error state
- [ ] Expired token (older than 1 hour) → error state
- [ ] Token already used (`usedAt` not null) → error state
- [ ] Fields: New Password, Confirm Password (min 8 chars, must match)
- [ ] Successful reset sets `users.password` to new hash
- [ ] Token marked as `usedAt` after use
- [ ] Redirect to `/login` with success message
- [ ] Cannot reuse token after reset

---

## 5. PDA Invite Acceptance (`/invite/[token]`)

- [ ] Invalid/missing token → error state
- [ ] Expired token (48h TTL elapsed) → error state with contact-patient message
- [ ] Already accepted/revoked token → error or redirect
- [ ] Valid token, invitee has NO existing account → shows **register** flow:
  - Fields: First Name, Last Name, Password, Confirm Password
  - Submit creates user + accepts PDA relationship (`status: 'accepted'`) + auto sign-in
  - Redirected to `/representing`
- [ ] Valid token, invitee HAS existing account → shows **login** flow:
  - Fields: Password only (email is locked to invited email)
  - Submit accepts PDA relationship + updates session
  - Redirected to `/representing`
- [ ] Page shows patient name + relationship label in a friendly intro
- [ ] Other pending invites from same patient for same email are cleaned up after acceptance
- [ ] After acceptance, refreshing the invite URL → already accepted message

---

## 6. Staff Invite Acceptance (`/staff-invite/[token]`)

- [ ] Invalid/missing token → error state
- [ ] Expired token → error state; admin should be able to resend
- [ ] Already-accepted token → error state
- [ ] Valid token renders form with role badge (Admin vs Agent)
- [ ] Required fields: First Name, Last Name, Address, Phone, Password, Confirm Password
- [ ] Optional field: Avatar (drag-drop or click; JPEG/PNG/GIF/WebP)
- [ ] Invalid avatar type → rejected client-side
- [ ] Avatar > configured size limit → rejected
- [ ] Passwords mismatch or too short → inline errors
- [ ] Successful submission:
  - User row created with `type` set appropriately (`admin` or `user`)
  - If agent role: `zabacaAgentRoles` row created
  - Avatar uploaded to R2; `avatarUrl` populated
  - Invite marked accepted (transactional; guards against double-submit race)
  - Redirected to `/login`
- [ ] First login requires no password change (fresh account, `mustChangePassword=false`)

---

## 7. Suspended Account Page (`/suspended`)

- [ ] Disabled user trying to log in → redirected here
- [ ] Logged-in user being disabled mid-session → next protected-route hit redirects here
- [ ] Page shows clear suspension message
- [ ] "Back to Login" button clears session and returns to `/login`
- [ ] Enabled user re-logs in normally after being reinstated

---

## 8. Session & Middleware Guards

- [ ] Unauthenticated visit to any protected path → redirect to `/login`
- [ ] Unauthenticated visit to `/api/*` (non-public) → 401 JSON response
- [ ] Public API routes (`/api/register`, `/api/password/forgot`, `/api/password/reset`, `/api/invites/*`, `/api/staff-invite/*`, `/api/fax/incoming`, `/api/fax/confirm`) are reachable without auth
- [ ] Role-based redirects (admin/agent/PDA-only/patient) described in each role plan work
- [ ] Visiting `/login`, `/register`, `/forgot-password`, `/reset-password` while authenticated redirects to role home

---

## 9. Email Deliverability (Smoke Check)

Each of the following email templates actually triggers and arrives at the recipient:

- [ ] Password reset — triggered by `/forgot-password` submission
- [ ] PDA invite — triggered by patient inviting a representative
- [ ] Staff invite — triggered by admin creating a new staff invite
- [ ] Account suspended — triggered by admin disabling a user
- [ ] Account reinstated — triggered by admin re-enabling a disabled user
- [ ] Release signature required — triggered when agent/admin creates a release on behalf of patient
- [ ] New release notification — triggered when patient creates a release naming an authorized agent
- [ ] New record upload — triggered when staff uploads a record for a patient
- [ ] Scheduled call — triggered when a call is created (feature currently hidden in UI)

For each: verify subject, sender, expected link destination, and that the link resolves to the correct page.
