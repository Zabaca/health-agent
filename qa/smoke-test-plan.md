# Smoke Test Plan — Web App

Quick health check for the web app. Covers the most critical paths across every role so a tester can confirm a build is fundamentally working in under 5 minutes.

Test style: whenever possible, navigate via normal UI (clicking sidebar links, buttons, cards) instead of pasting URLs — this implicitly verifies that links and click-throughs aren't broken.

The tests run in a dependency order that builds up state: the patient registered in §3 is invited-from in §4, the PDA account registered in §5 is logged-into in §6, the patient is assigned in §8 so the agent caseload in §9 is meaningful.

---

## Seed credentials

The seeded admin + agent accounts come from `apps/web/scripts/seed-admins.ts`. Patient and PDA accounts are created **during the test** (§3 and §5).

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `johnny@zabaca.com` | `GLbdK2qS` | `mustChangePassword=true` on first login |
| Admin | `mary@zabaca.com` | `GLbdK2qS` | `mustChangePassword=true` on first login |
| Zabaca agent | `tim@agency.com` | `GLbdK2qS` | `mustChangePassword=true` on first login |
| Zabaca agent | `may@agency.com` | `GLbdK2qS` | `mustChangePassword=true` on first login |

## Prerequisites

- [ ] Target environment (local / preview / staging / prod) is reachable
- [ ] DB has been seeded with the admin + agent accounts above
- [ ] Tester has **two fresh email addresses** ready — one for the new patient (§3), one for the new PDA (§4)
- [ ] Tester has access to the inbox for the PDA's email (to click the invite link in §5). On a local/staging env with Resend not wired up, check the server logs instead.

---

## 1. Page-load health

- [ ] App's base URL loads the login page with the form visible
- [ ] Login page logo image renders (not a broken-image icon)
- [ ] Browser devtools console shows no red errors on the login page

## 2. Seeded staff login

- [ ] Enter **admin** credentials (`johnny@zabaca.com`) + click Sign in → lands on admin dashboard (complete the forced password change if prompted, then continue)
- [ ] Logout → back on the login page
- [ ] Enter **Zabaca agent** credentials (`tim@agency.com`) + click Sign in → lands on agent dashboard (complete the forced password change if prompted)
- [ ] Logout → back on the login page

## 3. Patient registration + patient view

- [ ] On the login page, click **Sign up** → register form renders
- [ ] Submit with **fresh email #1** + matching passwords → account created, auto-signed in, lands on the patient dashboard
- [ ] Dashboard renders (onboarding checklist expected for a fresh account)
- [ ] Click **My Profile** in the sidebar → profile form renders (empty for a fresh account)
- [ ] Click **My Providers** in the sidebar → provider list renders (empty)
- [ ] Click **Releases** in the sidebar → renders the prerequisites page (profile + provider must be added before creating a release, so a prereq card is expected)
- [ ] Click **My Records** in the sidebar → records list renders (empty)
- [ ] Stay logged in as this patient for §4

## 4. PDA invitation (from patient session)

- [ ] Click **My Designated Agents** in the sidebar → page renders (no "Assigned by Zabaca" card visible — that feature is hidden per JAM-282)
- [ ] Click **Invite Representative** → modal opens
- [ ] Fill in **fresh email #2**, set a relationship, toggle at least one permission to Viewer or Editor, click Send Invite → modal closes
- [ ] A pending invite row appears in the list with status "pending" and an expiration countdown
- [ ] Invite email is delivered to fresh email #2 (check the inbox, or server logs in envs without real email)
- [ ] Logout

## 5. PDA acceptance via email link

- [ ] Open the invite email for fresh email #2 and click the invite link (`/invite/[token]`)
- [ ] Invite accept page renders showing the patient's name and relationship
- [ ] Register form branch: enter first/last name + password + confirm password → submit
- [ ] Auto-signed in and lands on the representing page (NOT the patient dashboard)
- [ ] Stay logged in as this PDA for §6

## 6. PDA view

- [ ] Representing page lists the patient from §3 (or auto-redirects to `/representing/[patientId]` if the PDA only represents one patient)
- [ ] Click the patient card → patient workspace loads
- [ ] Only the resource cards matching the permissions granted in §4 are visible (e.g., if only Health Records was granted, only that card shows)
- [ ] Logout

## 7. Middleware role routing (direct-URL only)

These require direct URL entry since there's no in-app link to the "wrong" place.

- [ ] **Unauthenticated**: paste the patient dashboard URL into the browser → redirected to the login page
- [ ] Log in as the patient from §3 (fresh email #1), then paste the admin dashboard URL → redirected to the patient dashboard. Stay logged in.
- [ ] Logout. Log in as `tim@agency.com`, then paste the admin dashboard URL → redirected to the agent dashboard. Logout.

## 8. Admin view + agent assignment

- [ ] Log in as admin (`johnny@zabaca.com`)
- [ ] Dashboard shows the patient table with the new patient from §3 visible and **decrypted names** rendered (no ciphertext)
- [ ] Click the new patient's row → patient detail page loads with the full tab strip (Overview, Health Records, Providers, Releases, PDAs, Recorded Calls)
- [ ] PDAs tab shows the PDA relationship created in §4/§5 with status "accepted"
- [ ] **Assign `tim@agency.com` as the agent** for this patient (via the agent-assignment control on the detail page)
- [ ] Click **Agents** in the sidebar → agent list renders, including any pending staff invites
- [ ] Logout

## 9. Agent view + scoping

- [ ] Log in as `tim@agency.com` → dashboard shows the new patient from §3 in the assigned-patients list
- [ ] Logout. Log in as `may@agency.com` → dashboard does NOT include the new patient (scoping confirmed)
- [ ] Logout. Log back in as `tim@agency.com`. Paste a URL for a patient NOT assigned to `tim` → 404 or redirect (direct URL required since there's no link to an unassigned patient)

---

## If anything fails

Stop the smoke run and file a bug with:
- Environment + commit SHA
- The step that failed
- Browser console output
- Network tab status codes for any failed request

Then run the relevant role-specific plan in `qa/test plans/` to scope the regression.
