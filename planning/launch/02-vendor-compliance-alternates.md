# Vendor compliance alternatives (when our stack isn't all HIPAA-tier)

> **Companion to [01-app-store-submission.md](./01-app-store-submission.md).** Read that first for the launch plan; this doc is the contingency if vendor BAA review (item E5) comes back empty for one or more vendors.

## The honest landscape

Most of our current vendors only offer BAAs on **enterprise tiers** that are expensive or have no PHR-specific pricing. The realistic vendor-compliance picture (verify each as part of E5):

| Vendor | What it stores / does | BAA on our current tier? | BAA on a higher tier? | Cost to upgrade |
|---|---|---|---|---|
| **Resend** (email) | Transactional email — canned templates, no PHI in body | ✅ Yes (already signed) | n/a | $0 incremental |
| **Vercel** (Next.js hosting) | Compute — PHI transits in-memory during request handling | ❌ No | ✅ Enterprise tier | ~$50k+/yr (custom) |
| **Turso / libSQL** (relational DB) | All structured PHI at rest | ❌ No published BAA | Likely no — Turso doesn't market HIPAA tier | Switch vendor |
| **Cloudflare R2** (object storage) | Uploaded medical documents at rest | ❌ Standard | ✅ Enterprise | Custom (4–5 figures/mo) |
| **Faxage** (faxing) | Outgoing fax content includes PHI | ❓ Verify (healthcare-faxing vendors usually do) | n/a | $0 if they offer |
| **Ably** (realtime) | Designed PHI-free — only IDs on wire | ❌ Standard | ✅ Enterprise | ~$500+/mo, custom |

**The strategic question this raises:** if not every vendor will sign a BAA, what's the cleanest path that still lets us ship — and credibly describe our security posture in the privacy policy?

---

## Apple/Google review angle (good news first)

Apple does NOT audit your backend. They don't inspect vendor contracts. App Review looks at:
- Whether your **Privacy Policy accurately describes** your data handling
- Whether your **App Privacy / Data Safety declarations** match the PP and the code
- Whether **account deletion** works
- Whether the **app itself** behaves as advertised

So you can submit with any vendor stack as long as the PP is **honest** about what's used and what the security posture is. The harder question is downstream:
- Reputational/trust risk (users notice "they use vendor X without HIPAA")
- Breach exposure (you hold the bag if a non-HIPAA vendor leaks)
- B2B option-value (future hospital/clinic customers will demand vendor BAAs)
- State law (some state medical-records laws have encryption/storage rules independent of HIPAA)

---

## Four strategies (pick one, can blend)

### Strategy A — Risk-accept + honest disclosure (cheapest, fastest)

**Ship with the current stack.** PP discloses vendors honestly and lists the mitigations we apply.

| Trade-off | Implication |
|---|---|
| ⏱️ Time | 0 added days |
| 💵 Cost | $0 incremental |
| 🛡️ Compliance | Lightest; explicit "not formally HIPAA-certified" disclosure required |
| 🔒 Breach exposure | We carry it; standard vendor security controls apply |
| 🏥 B2B-ready | No — hospital/clinic customers will reject |
| 📱 App Store risk | Low if PP is accurate |

**PP language sketch:** *"Veladon uses third-party infrastructure providers, including Cloudflare (storage), Turso (database), Vercel (hosting), Resend (email — under a signed Business Associate Agreement), and Faxage (faxing). Not all providers are formally HIPAA-certified, but we apply additional controls: field-level AES-256-GCM encryption of sensitive identifiers, TLS in transit, default encryption at rest, append-only audit logging, and minimum-necessary data principles. We are a Personal Health Record (PHR) vendor and not a HIPAA Covered Entity or Business Associate."*

**Best for:** time-to-first-submission matters most; B2C-only commitment; product-market-fit phase.

### Strategy B — Hybrid: harden the high-risk surfaces (recommended)

**Migrate storage only.** DB + object storage are where PHI **lives at rest** — the biggest breach surface. Compute and realtime stay on current vendors.

| Surface | Action | Replacement |
|---|---|---|
| Object storage (Cloudflare R2) | **Migrate** | **AWS S3** (BAA via AWS) or **Backblaze B2** (BAA on B2 Reserve) — both S3-compatible, code change is endpoint URL only |
| Database (Turso) | **Migrate** | **Neon** (BAA on Scale tier ~$700/mo) OR **Supabase** (BAA on Pro+ at ~$25/mo + add-on) OR **AWS RDS PostgreSQL** (BAA via AWS). All require swap from libSQL/SQLite to Postgres |
| Faxing (Faxage) | Confirm BAA, else swap | **Documo** or **Sfax** (both healthcare-focused with BAA) |
| Compute (Vercel) | Keep standard | Document in PP: "PHI transits in-memory during request handling; not retained in compute" |
| Realtime (Ably) | Keep standard | Already designed PHI-free; document in PP |
| Email (Resend) | Keep | Already has BAA ✓ |

| Trade-off | Implication |
|---|---|
| ⏱️ Time | +3–5 days (storage migrations) |
| 💵 Cost | +$50–700/mo depending on DB choice |
| 🛡️ Compliance | PHI-at-rest fully covered; compute is residual risk we disclose |
| 🔒 Breach exposure | Significantly reduced (the breach surface that matters most) |
| 🏥 B2B-ready | Closer — still need a Vercel Enterprise BAA before B2B, but the data layer is ready |
| 📱 App Store risk | Lower; clearer story |

**PP language sketch:** *"PHI is stored on HIPAA-compliant infrastructure (AWS S3, Neon) under signed Business Associate Agreements. Application compute runs on Vercel under their standard security controls; PHI is not retained in compute (held only briefly in memory during request handling)."*

**Best for:** strong privacy positioning; want option-value for B2B; willing to spend a week and a few hundred dollars/month for material risk reduction.

### Strategy C — Full HIPAA stack

Replace **every** vendor with a BAA-covered alternative. Vercel → AWS Amplify or self-host on EC2/ECS; Cloudflare → AWS S3; Turso → AWS RDS / Aurora; Ably → Soketi self-hosted (no BAA needed) or Ably Enterprise; Resend → keep (BAA ✓) or migrate to AWS SES (BAA ✓).

| Trade-off | Implication |
|---|---|
| ⏱️ Time | +2–4 weeks |
| 💵 Cost | +$500–2000/mo realistic; Vercel Enterprise alone is ~$4k+/mo |
| 🛡️ Compliance | Best; full BA-chain provable |
| 🏥 B2B-ready | Yes — can sell to hospitals/clinics day 1 of being ready |
| 📱 App Store risk | Lowest |

**Best for:** committed B2B path; have funding for it; can absorb a multi-week migration before launch.

### Strategy D — Encrypt-first / zero-knowledge (limited applicability)

Client-side encryption before data hits backend. Vendors see only ciphertext → vendor BAAs become less relevant for those fields.

**Where it works**:
- Uploaded medical **documents** — encrypt the file client-side with a user-derived key before R2 upload. R2 stores opaque bytes. Useful even in Strategy A as a defense-in-depth.

**Where it doesn't work for us**:
- Structured DB fields we **query** on (patient name, DOB, release dates, provider info). Encrypting these breaks search, sort, filter, joins — fatal to the product.
- Document preview (we'd need to decrypt client-side before showing). Doable but adds complexity.

| Trade-off | Implication |
|---|---|
| ⏱️ Time | +2–3 days (document encryption only) |
| 💵 Cost | $0 |
| 🛡️ Compliance | Layered with another strategy |
| 🔑 Key management | Hard — losing the key = losing the data permanently. Need a recovery story (e.g., key escrow with the user's auth method). |
| 🏥 B2B-ready | Doesn't change B2B story alone |

**Best for:** combine with Strategy A or B to give the uploaded-document layer zero-knowledge properties without committing to a vendor migration.

---

## Recommendation matrix

| Your situation | Strategy | Why |
|---|---|---|
| Need to submit this month, B2C-only, validate PMF first | **A** (risk-accept + disclose) | Lowest time-to-submit; honest PP passes review |
| Privacy positioning matters; B2B might come in 6–12mo | **B** (hybrid storage migration) | Best ROI on compliance investment; ~1 wk lift |
| B2B is a known short-term goal (signed LOI, etc.) | **C** (full stack) | Pay now to avoid retrofit; B2B-ready from day 1 |
| Highly sensitive uploaded documents matter most | **A or B** + Strategy D for docs | Layered defense; zero-knowledge upload path |

**My recommendation for your stated situation** (strictly B2C, fastest possible launch): **Strategy A for submission, plan Strategy B as the v1.1 hardening sprint**.

Rationale:
- Strategy A unblocks Apple/Google submission with no added engineering days
- The PP-disclosure language is well-trodden ground (many B2C health apps live here, e.g., consumer fitness/symptom-tracker apps)
- Strategy B becomes a focused 1-week sprint after launch — clean migration with users on the new infrastructure within a release cycle
- Avoids paying for vendor upgrades before product traction is proven

---

## Vendor swap implementation sketches (for Strategy B or C)

### Object storage: Cloudflare R2 → AWS S3 (or Backblaze B2)

Both are S3-compatible. Existing code uses `@aws-sdk/client-s3` (see `apps/web/src/lib/r2.ts`). Swap:
- Endpoint URL (S3 default vs `https://*.r2.cloudflarestorage.com`)
- Credentials (rotate)
- Bucket region/name
- Run a one-time `aws s3 sync` migration script for existing objects
- Update env vars; no code change beyond config

**Effort: ~1 day. Cost: comparable (~$0.023/GB S3 standard vs $0.015/GB R2; egress is the wild card — S3 has egress fees, R2 doesn't).**

### Database: Turso → Neon (Postgres)

Bigger lift. Drizzle schema is SQLite-syntax (`drizzle-orm/sqlite-core`). Migration:
1. Change dialect in `drizzle.config.ts` from `turso` to `pg`
2. Update schema imports from `drizzle-orm/sqlite-core` to `drizzle-orm/pg-core`
3. Rewrite hand-written SQL migrations under `apps/web/drizzle/` for Postgres syntax (`text` is fine; `integer` mode 'boolean' → `boolean`; `text $defaultFn` ISO strings → keep as-is or use `timestamp`)
4. Export from Turso → import into Neon (`pg_dump`-equivalent path; turso has a SQL export)
5. Cut over (small downtime window or read-after-write reconciliation)

**Effort: ~3–5 days. Cost: Neon Scale ~$70/mo base + usage; Supabase Pro $25/mo + BAA add-on.**

Alternative: **stay on libSQL but self-host** on Fly.io with a BAA from Fly (Fly offers BAA on certain plans). No code change. Effort: 1–2 days. Cost: small Fly machine ~$5–30/mo.

### Faxing: Faxage → Documo / Sfax

Both healthcare-focused; both offer BAAs out of the box. API surfaces differ from Faxage. Existing fax code in the route handlers needs an adapter swap.

**Effort: ~2 days (API adapter + smoke). Cost: Documo ~$30/mo base + per-fax fee, comparable to Faxage.**

### Realtime: Ably standard → Soketi self-host

Soketi is Pusher-protocol-compatible. If we adopt Ably (per the realtime plan), the swap path is:
1. Deploy Soketi on Fly.io / Render (small machine)
2. Replace `ably` SDK with `pusher-js` (web) and `pusher-websocket-react-native` (mobile)
3. Update channel auth handler to issue Pusher-format signed channels instead of Ably tokens

**Effort: ~2–3 days. Cost: Soketi self-host ~$5–20/mo VPS vs Ably standard $29/mo. Net savings, but ops burden.**

Or keep Ably standard tier — payloads are designed PHI-free, so BAA isn't strictly needed. Document this in PP.

### Compute: Vercel → AWS Amplify / self-host

The biggest lift. Vercel-specific features (ISR, Edge config, Cron, Blob, etc.) need replacement. Realistically Vercel Enterprise is the path if Vercel matters; AWS migration is a 1–2 week project.

**Recommendation: stay on Vercel standard; disclose in PP.** Vercel handles request processing well; in-memory PHI residual risk is the smallest of the bunch.

---

## What this means for the launch plan (cross-references)

If we choose **Strategy A**, no changes to [01-app-store-submission.md](./01-app-store-submission.md) beyond:
- The PP brief for counsel should explicitly include the "not all vendors formally HIPAA-certified" framing and the list of applied mitigations
- The data-safety declaration stays the same (we're declaring what we collect, not what our vendors are)

If we choose **Strategy B**, additions to the launch plan:
- New ticket: **JAM-3xx — Migrate object storage R2 → S3** (~1 day)
- New ticket: **JAM-3xx — Migrate DB Turso → Neon** (~3–5 days)
- New ticket: **JAM-3xx — Confirm/swap faxing vendor BAA** (~2 days, contingent on E5)
- Timeline impact: +1 week to engineering before submission
- These can all run in parallel with legal review

If we choose **Strategy C**, the launch plan effectively gets a 2–4 week extension before submission. Not recommended unless B2B is committed.

If we choose **Strategy A + Strategy D for documents**, add:
- New ticket: **JAM-3xx — Client-side encryption for uploaded documents** (~2 days)
- Adds key-management complexity — needs a recovery path (likely tying the file-encryption key to the user's auth credential derivation)

---

## What to ask each vendor (template for E5)

```
Subject: HIPAA / Business Associate Agreement availability for [vendor]

Hi [vendor support],

We're evaluating [vendor] for a US-based health-records app handling
ePHI as a Personal Health Record vendor.

Could you please confirm:
1. Do you offer a Business Associate Agreement (BAA)? If yes, on what tier?
2. If not BAA, what's the equivalent Data Processing Addendum (DPA)?
3. Do you publish a security overview (SOC 2 Type II, ISO 27001, etc.)?
4. Where is data stored geographically? Can we restrict to US?
5. What's the encryption-at-rest posture?
6. What's the breach-notification SLA?

Thanks,
[Khoa]
```

Send this to: Cloudflare, Turso, Vercel, Faxage, Ably. Expected turnaround: 3 business days to 2 weeks.

---

## Verification (this doc)

This doc is "done for review" when:
1. You've picked a strategy (A, B, C, or A+D)
2. The choice is reflected back in [01-app-store-submission.md](./01-app-store-submission.md) — at minimum in the Brief for Counsel + the External Requirements (E5) framing
3. Any Strategy B/C tickets are created under Mobile Launch in Linear
