# App Store Metadata — Veladon

Text submission assets for the App Store listing (the screenshots/imagery are produced
separately; this covers the **copy**). Voice and claims are drawn from the marketing site
(`apps/www`) and the [mobile launch plan](./mobile-launch-plan.md) requirements.

> **Source of truth for claims.** Mirror the landing page wording. Two rules that must
> survive any edit:
> 1. **The mechanic:** Veladon does *not* fetch your records. *You* generate a
>    HIPAA-compliant **authorization**, *you* submit it, the **provider sends the records
>    to you**, and *you* upload them into Veladon. Never write "Veladon gets/retrieves
>    your records."
> 2. **HIPAA:** the **authorization form** is "HIPAA-compliant" (true); the **security**
>    is "HIPAA-equivalent." Never flatly call the app itself "HIPAA-compliant" — Zabaca is
>    a PHR vendor, likely not a HIPAA Covered Entity.
>
> **Do not mention Android, web, or "other platforms" anywhere in App Store copy** — it is
> a concrete Apple rejection trigger. (The source FAQ talks about Android; do not carry it over.)

---

## Reference / canonical values

| Field | Value |
|-------|-------|
| App name (brand) | Veladon |
| Developer / seller | Zabaca, LLC |
| Bundle ID | `com.zabaca.veladon` |
| Apple App ID | `6773436877` |
| App Store URL | https://apps.apple.com/us/app/veladon/id6773436877 |
| Support URL | https://www.veladon.com/support |
| Marketing URL | https://www.veladon.com |
| Privacy Policy URL | https://www.veladon.com/privacy |
| Terms URL | https://www.veladon.com/terms |
| Support email | info@veladon.com |
| Copyright | © 2026 Zabaca, LLC |

---

## App Store Connect — text fields (iOS, the live submission)

### App Name — *max 30 chars*
```
Veladon: Health Records
```
*(23 chars. Brand-only "Veladon" wastes the single most-weighted ASO field, so the name
also carries "Health Records.")*

### Subtitle — *max 30 chars*
```
Your medical record. Yours.
```
*(27 chars. Adds "medical" to the indexed terms.)*

### Promotional Text — *max 170 chars; editable any time without review*
```
Request your medical records from any provider, organize them in one place, and share them on your terms — your whole health history, somewhere you actually control.
```

### Keywords — *max 100 chars; comma-separated, no spaces, singular, no words already in name/subtitle*
```
PHR,lab,result,immunization,medication,allergy,caregiver,release,HIPAA,provider,history,doctor,scan
```
*Excluded on purpose (already indexed via name/subtitle, so repeating wastes space):*
*health, records, medical, record, yours. Apple auto-combines individual words into
phrases and partial-matches plurals, so "result" covers "results."*

### Description — *max 4000 chars; first ~170 chars show above the "…more" fold, so they are front-loaded*
```
Your medical record. Yours.

Veladon is your personal health record storage. Request your records from any provider, organize them in one app, and share them on your terms.

Your health history lives in eight different places — every clinic, lab, and hospital behind its own portal, its own login, its own release form. Veladon brings it together. You generate the authorization; the provider sends the records to you; you keep them somewhere you actually look.

HOW IT WORKS
1. Add a provider — search for the clinic, hospital, lab, or specialist and pick what you want: everything on file, or a specific date range and record type.
2. Sign the release — Veladon generates a HIPAA-compliant authorization, pre-filled with your information. Sign it on the glass, set an expiration date, and submit. Void it any time before it's acted on.
3. Request and store — the provider sends the records wherever you direct them: your mailbox, your inbox, the front desk at your next visit. Upload them to Veladon and keep your whole history in one place.

WHAT VELADON DOES
• Releases — the headline feature. Generate a HIPAA-compliant authorization, sign it on the glass, and direct where your records go: to you, your home, or another provider you name. Revoke any release before it's acted on.
• Apple Health — connect Apple Health to bring in the vitals and clinical data already on your iPhone: heart rate, sleep, activity, lab results, immunizations, medications, and more — alongside the records you request from providers.
• Your record, organized — everything sorted by provider and date, with allergies, conditions, immunizations, lab results, medications, procedures, vital signs, and coverage rendered in plain English.
• Documents — upload photos or scans of the paper records you already have. Tag them by type and provider. Encrypted at rest, retrievable in a tap.
• Providers & insurance — every clinician you've seen and every plan that covers you, member IDs included, in one place instead of a stack of cards.
• Designated Agents — delegate access to a family member or caregiver, per category and per permission. View only, or view and edit. Revoke instantly.

BUILT TO A HIPAA-EQUIVALENT STANDARD
Sensitive identifiers and health data are encrypted at rest with AES-256-GCM. Every connection to our servers uses TLS. Sessions are per-device, locked with Face ID / Touch ID, and revocable from any other device in seconds.

We do not sell your health information. We do not serve targeted ads against it. We do not use your protected health information to train AI models — ours or anyone else's.

WHO IT'S FOR
• Anyone whose care lives across multiple providers — primary care here, specialists there, labs and imaging somewhere else again.
• Caregivers helping a parent, partner, or child navigate the system — without a password handoff.
• Anyone tired of printing a release form and spending two weeks on hold to confirm it landed.

NOT A SUBSTITUTE FOR CARE
Veladon does not diagnose, treat, cure, or prevent any condition. It collects the records your providers already hold and puts them in front of you so you can show up informed. Decisions about your care belong with you and your clinician. If you think you may be having a medical emergency, call your local emergency number.

Built by Zabaca, LLC. Questions: info@veladon.com
Privacy Policy: https://www.veladon.com/privacy
Terms of Use: https://www.veladon.com/terms
```

### What's New (release notes) — *max 4000 chars; v1.0.0*
```
Welcome to Veladon — your medical record, finally yours.

This first release lets you:
• Request records from any provider with a pre-filled, HIPAA-compliant authorization you sign on the glass
• Connect Apple Health to bring your vitals and clinical data into one place
• See your history organized by provider and date, in plain English
• Upload and tag photos or scans of paper records
• Delegate access to a trusted family member or caregiver — and revoke it instantly

We're a small team and we read every message. Tell us what you think: info@veladon.com
```

### Category
- **Primary:** Medical
- **Secondary:** Health & Fitness

### Age rating
Expect **12+**. In Apple's questionnaire, the app displays the user's own
**Medical/Treatment Information**, which typically lands at 12+. Answer honestly; do not
under-rate.

---

## Screenshot caption copy (overlay text)

The text that sits on each marketing screenshot. Pair each headline with its subline; keep
headlines ≤ ~30 chars so they read on a phone thumbnail. Six core frames (drop #6 if only
five are produced):

| # | Headline | Subline |
|---|----------|---------|
| 1 | Your medical record. Yours. | Request it, organize it, share it — on your terms. |
| 2 | Request from any provider | A HIPAA-compliant authorization, pre-filled and ready to sign. |
| 3 | Sign the release on the glass | Set an expiration. Revoke any time before it's acted on. |
| 4 | Apple Health, brought in | Vitals, labs, medications, and more — alongside your records. |
| 5 | Your whole history, in plain English | Sorted by provider and date. Allergies to vital signs. |
| 6 | Delegate to a caregiver | Per category, per permission. View only, or view and edit. |

---

## App Privacy (data declarations) — *secondary; the [Privacy Policy](https://www.veladon.com/privacy) is the source of truth*

Fill App Store Connect → App Privacy from the privacy policy, not from memory. Summary of
what to declare for v1.0.0:

| Data type | Collected? | Linked to identity? | Used for tracking? | Notes |
|-----------|-----------|---------------------|--------------------|-------|
| Health & Fitness | Yes | Yes | No | HealthKit data, requested records, uploaded documents. Read-only **while the app is open** — no background delivery. Never used for advertising, marketing, or data mining (Apple HealthKit rule). |
| Contact Info | Yes | Yes | No | Email (and name) for the account. |
| Identifiers | Yes | Yes | No | Account/user ID. |
| Usage Data | Yes | No | No | Anonymous product analytics (PostHog) — captured without `identify()`, not linked to a user, not used for third-party tracking or ads. |

Must stay consistent with the privacy policy's "we do not sell / do not track / do not
train AI on PHI" commitments. Encryption export compliance: declare per the launch plan
(non-exempt crypto if applicable; HealthKit/TLS standard crypto is generally exempt).

---

## Google Play (Android) — *FUTURE / not the current submission*

Android is on the roadmap, not in this release. Hold this copy until the Android build is
ready; Play allows platform-neutral phrasing, so the iOS description above can be reused
verbatim for the full description.

- **Title** (max 30): `Veladon: Health Records`
- **Short description** (max 80):
  ```
  Request, organize, and share your medical records — your personal health record.
  ```
- **Full description** (max 4000): reuse the iOS Description above.
- **Data safety:** mirror the App Privacy declarations.

---

## Pre-submit checklist (text assets)

- [ ] App Name ≤ 30 · Subtitle ≤ 30 · Promo ≤ 170 · Keywords ≤ 100 · Description ≤ 4000
- [ ] No "Android" / "web" / cross-platform language in any iOS field
- [ ] No "the app is HIPAA-compliant" phrasing (authorization = compliant; security = equivalent)
- [ ] Description does not claim Veladon retrieves records on the user's behalf
- [ ] URLs resolve: support, marketing, privacy, terms
- [ ] App Privacy matches the live Privacy Policy (incl. anonymous analytics)
- [ ] Screenshot captions match shipped UI
```
