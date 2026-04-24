# Smoke Test Plan — Web App

Quick health check for the patient flow on the web app. A tester can confirm a build is fundamentally working in under 5 minutes.

Test style: whenever possible, navigate via normal UI (clicking sidebar links, buttons, cards) instead of pasting URLs — this implicitly verifies that links and click-throughs aren't broken.

---

## Prerequisites

- [ ] Target environment (local / preview / staging / prod) is reachable
- [ ] Tester has **one fresh email address** ready for the new patient account

---

## 1. Page-load health

- [ ] App's base URL loads the login page with the form visible
- [ ] Login page logo image renders (not a broken-image icon)
- [ ] Browser devtools console shows no red errors on the login page

## 2. Patient registration + patient view

- [ ] On the login page, click **Sign up** → register form renders
- [ ] Submit with the fresh email + matching passwords → account created, auto-signed in, lands on the patient dashboard
- [ ] Dashboard renders (onboarding checklist expected for a fresh account)
- [ ] Click **My Profile** in the sidebar → profile form renders (empty for a fresh account)
- [ ] Click **My Providers** in the sidebar → provider list renders (empty)
- [ ] Click **Releases** in the sidebar → renders the prerequisites page (profile + provider must be added before creating a release, so a prereq card is expected)
- [ ] Click **My Records** in the sidebar → records list renders (empty)
- [ ] Click **My Designated Agents** in the sidebar → page renders (no "Assigned by Zabaca" card visible — that feature is hidden per JAM-282)
- [ ] Logout → back on the login page

## 3. Unauthenticated route guard

- [ ] Paste the patient dashboard URL into the browser → redirected to the login page

---

## If anything fails

Stop the smoke run and file a bug with:
- Environment + commit SHA
- The step that failed
- Browser console output
- Network tab status codes for any failed request

Then run `qa/test plans/patient-test-plan.md` to scope the regression.
