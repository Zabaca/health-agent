# Veladon — `apps/www` Style Guide

This is the operational style guide for the Veladon marketing site (`apps/www`). It encodes the design tokens, voice, and component conventions used to build the landing page and legal pages. The visual aesthetic mirrors [foothillmetabolic.com](https://foothillmetabolic.com/) — captured in [`DESIGN.md`](./DESIGN.md). This file is the **Veladon-flavored** application of that system.

> If you're touching the look of the marketing site, read `DESIGN.md` first for the reference and the reasoning. Use this guide for what to actually type.

---

## 1. Voice

The site sounds like the same person who wrote Foothill Metabolic — declarative, plain English, no marketing puffery. Every sentence earns its place.

**Do**
- "Your medical record. Yours."
- "Vitals scattered across your phone. Records locked in patient portals."
- "We do not sell your data. We do not train AI on it. We do not show ads."

**Don't**
- "Revolutionizing your health journey."
- "Empower yourself with cutting-edge insights."
- "Seamless. Powerful. Beautiful."

Rules of thumb:
- Numbers in **bold**, not in colored pill chips.
- Use the domain word, not a synonym. "FHIR clinical records", "AES-256-GCM at rest", "User-Designated Agent" — these are the words.
- Frame the wedge: "the thing your hospital portal doesn't give you" beats "all-in-one health hub".
- One CTA per page. "Download on the App Store." That is the action.

---

## 2. Brand foundation

| Token | Value | Use |
| --- | --- | --- |
| Brand name | **Veladon** | Product name. Never "Veladon App" or "the Veladon platform" — just Veladon. |
| Legal entity | **Zabaca, LLC** | California LLC. Footer + legal pages only. |
| Tagline | "Your medical record. Yours." | Hero H1 only. Don't reuse. |
| Eyebrow | "Veladon · Your personal health record storage" | Hero eyebrow. Frames Veladon as the storage layer the user controls. |
| Domain | `veladon.com` | Public-facing. |
| Email | `info@veladon.com` | Single mailbox for everything user-facing — support, privacy, legal, regulatory. Don't introduce category-specific aliases (`support@`, `privacy@`, `legal@`) on the marketing site; the docs route everything through `info@`. |
| Mailing address | `Zabaca, LLC, 717 Brea Canyon Rd Ste 6, Walnut, CA 91789` | Used in Privacy Policy §16 and the support page. |
| Platform | iOS first (iPhone) | Hide Google Play until launch. |

---

## 3. Color tokens

Defined as CSS custom properties in `app/globals.css`. **Always reference the token**, never the hex literal.

```css
:root {
  --color-bg:           #FBFAF7;  /* page cream */
  --color-bg-subtle:    #F3EFE5;  /* band between sections */
  --color-text:         #2D2C25;  /* primary ink */
  --color-text-muted:   #6B6759;  /* eyebrows, meta, captions */
  --color-border:       #DCD6C7;  /* warm tan rule */
  --color-button-bg:    #14140F;  /* near-black */
  --color-button-fg:    #FBFAF7;
  --color-accent:       #C9572D;  /* burnt sienna — used sparingly */
  --color-link:         #2D2C25;  /* same as text; underlined */
}
```

**Accent rule.** The burnt-sienna accent appears in exactly one place per page — the terminal period of the H1. Resist the urge to color anything else.

---

## 4. Typography

Loaded via `next/font/google` in `app/layout.tsx`:
- `Newsreader` (weights 400, 500) — serif, headings & body
- `Inter Tight` (weights 500, 600) — sans, eyebrows & meta only

```css
:root {
  --font-serif: var(--font-newsreader), "Iowan Old Style", Georgia, "Source Serif Pro", "Times New Roman", serif;
  --font-sans:  var(--font-inter-tight), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

### Scale (desktop → mobile, via `clamp()`)

| Token | Size | Line-height | Weight | Family | Use |
| --- | --- | --- | --- | --- | --- |
| `display` | `clamp(56px, 8vw, 90px)` | 0.96 | 500 | serif | Hero H1, once per page |
| `h1` | `clamp(40px, 5.5vw, 64px)` | 1.05 | 500 | serif | Legal page titles |
| `h2` | `clamp(36px, 4.5vw, 54px)` | 1.1 | 500 | serif | Section heads |
| `h3` | `clamp(22px, 2.2vw, 28px)` | 1.25 | 500 | serif | Sub-heads |
| `lead` | `clamp(19px, 1.6vw, 22px)` | 1.5 | 400 | serif | Hero subhead, opening paragraphs |
| `body` | `17px` | 1.55 | 400 | serif | Default paragraphs |
| `small` | `14px` | 1.5 | 400 | sans | Meta, captions |
| `eyebrow` | `13px` | 1.4 | 500 | sans, `uppercase`, `letter-spacing: 0.08em` | Above every H2 |

Headings get `text-wrap: balance`. Body copy gets `text-wrap: pretty`.

---

## 5. Spacing & layout

8px base unit.

| Token | Value | Use |
| --- | --- | --- |
| `--space-1` | 4px | |
| `--space-2` | 8px | |
| `--space-3` | 16px | inline gaps |
| `--space-4` | 24px | paragraph-to-paragraph |
| `--space-5` | 40px | heading-to-paragraph |
| `--space-6` | 64px | sub-block separation |
| `--space-7` | 96px | section padding (mobile) |
| `--space-8` | 160px | section padding (desktop) |

### Containers
| Token | Width | Use |
| --- | --- | --- |
| `--col-narrow` | 720px | legal text |
| `--col-prose` | 880px | landing prose sections |
| `--col-wide` | 1040px | hero block + footer row |

Section padding: `padding-block: clamp(80px, 12vw, 160px)`. Horizontal: `padding-inline: clamp(20px, 4vw, 40px)`.

### Radii & shadows
- `--radius`: **2px**. Apply to buttons, inputs, and any badge. Nothing is pill-shaped. Nothing is fully square.
- **No box-shadows.** Anywhere. If something needs separation, use a 1px border or a `--color-bg-subtle` band.

---

## 6. Components

### 6.1 Eyebrow
```tsx
<p className="eyebrow">Veladon · A personal health record for iOS</p>
```
- Sans, uppercase, tracked, `--color-text-muted`, 13px. Sits 0.5em above every H2.

### 6.2 Buttons
- **Primary** — `bg: --color-button-bg`, `fg: --color-button-fg`, padding `14px 22px`, radius 2px, no shadow. Hover: background `#2A2A22`. Used once per page.
- **App Store badge** — primary button styled with the Apple logo SVG to the left of "Download on the App Store". This is the only CTA on the landing page.

### 6.3 Section
```tsx
<section className="section">
  <div className="col col-prose">
    <p className="eyebrow">…</p>
    <h2>…</h2>
    <p>…</p>
  </div>
</section>
```
Sections alternate `--color-bg` and `--color-bg-subtle`. No card backgrounds inside sections.

### 6.4 Two-column row (label + body)
Used in "What you get". Left column = small sans label (eyebrow-styled). Right column = serif paragraph. Collapses to stacked on `< 720px`.

### 6.5 FAQ row
```tsx
<details className="faq">
  <summary>What is a PHR?</summary>
  <p>…</p>
</details>
```
Plain `<details>` — no JS. Plus icon via `::marker` swap or `::after` content. 1px top border between rows.

### 6.6 Footer
Single row. Left: `Veladon · A Zabaca product · veladon.com`. Right: links to Terms, Privacy, Support. `--color-text-muted`, 14px.

### 6.7 Legal page
- `col-narrow` width (720px), single column.
- H1 = page title. Below it: effective date + version in `--color-text-muted` 14px.
- H2 are section headings (numbered as in the source HTML — preserve the numbering, it's part of the legal text).
- The canonical text lives in [`/docs/legal/terms.html`](../../docs/legal/terms.html) and [`/docs/legal/privacy.html`](../../docs/legal/privacy.html). The Next.js page reads the `<main>` content at build time and renders it inside the site shell. **Do not duplicate the text** — edit the HTML source, the site picks it up.

---

## 7. Pages

The site is intentionally tiny — its only job is sending people to the App Store.

| Route | Purpose | Source of truth |
| --- | --- | --- |
| `/` | Landing | This guide + `app/page.tsx` |
| `/terms` | Terms of Service | `docs/legal/terms.html` |
| `/privacy` | Privacy Policy | `docs/legal/privacy.html` |
| `/support` | Contact / help | `app/support/page.tsx` |

---

## 8. Landing page section order

This is the canonical section ordering. Match the rhythm; don't reorder casually.

1. **Hero** — Eyebrow → display H1 (with sienna `.`) → lead subhead → App Store CTA. No meta line beneath the CTA. **Do not mention pricing anywhere on the marketing site** — no "free", no "$0", no "during launch". Pricing is decided elsewhere and putting it in marketing copy commits us prematurely.
2. **The wedge** — "Your record lives in eight places. None of them are you." Sets up *why* Veladon exists: provider fragmentation.
3. **How it works** — Three labelled rows: Add a provider → Sign the release → Request and store. This is the moat — lead with it.
4. **What you get** — Six labelled rows: Releases, Apple Health, Your record (organized), Documents, Providers & insurance, Designated Agents.
5. **Your data, your device** — Privacy + security manifesto. Plain English. No badges.
6. **Who Veladon is for** — Three audience archetypes: complex care, caregivers, anyone tired of chasing records.
7. **Not a replacement for your doctor** — Liability disclaimer rendered as editorial copy, not as a footnote.
8. **FAQ** — `<details>` rows.
9. **Closing CTA** — Single repeat of the App Store button, no form.
10. **Footer**.

### Positioning rules

- **Lead with the Release / record-request flow**, not with any specific data source. Veladon's wedge is "we help you request your records and give you one place to keep them". That is what makes the app different from a wellness tracker. **Don't describe the delivery mechanism (fax, mail, secure portal) in marketing copy** — that's an implementation detail and it dates the product. Stick to "request", "submit", "deliver", "send".
- **Veladon helps you request — it does not act as the records custodian on your behalf.** The user signs the authorization; the provider sends the records to wherever the user directs (their home, their inbox, the next visit); the user uploads them into Veladon for safekeeping. **Never write copy that implies records are auto-ingested into the user's account by Veladon.** Phrases to avoid: "we get your records", "records land in your account", "records flow back to us", "we ingest the records". Phrases to prefer: "we help you request", "you direct where the records go", "store them in Veladon once they arrive". This distinction matters legally (Veladon is a self-help PHR, not a records intermediary) and for the App Store review narrative.
- **Don't frame Veladon as "for iPhone" in branding copy.** The current shipping surface is iOS, but the product is a personal health record, not an iPhone accessory. The hero eyebrow, page descriptions, and OG/Twitter blurbs should say *"a personal health record"* or *"a personal health record you control"* — not *"for iPhone"*. Platform is fine to mention in **honest direct answers** (e.g. the FAQ "Android?" reply that explains iPhone-first roadmap) and in product/eng documentation. It's not fine as a defining marketing attribute.
- **Don't *headline* Apple Health, HealthKit, FHIR, or any other source-platform name.** Those are inputs the app supports; they are not the value proposition. Naming them up front reframes Veladon as a HealthKit viewer, which is wrong. They *may* be named in body sections (e.g. an "Apple Health" row in **What you get**) as one of several data lanes alongside the Release flow — just never in the hero, the wedge, or the primary CTA. Source names are also fine in legal copy (Privacy Policy) where accuracy demands it.
- **Frame the Release as the headline feature** in "What you get" — it goes first in the list, and the "How it works" section exists primarily to teach it.

---

## 9. Accessibility

- Body contrast: `#2D2C25` on `#FBFAF7` = ratio 13.4:1. ✓
- Muted contrast: `#6B6759` on `#FBFAF7` = ratio 4.9:1. ✓ (do not go lighter)
- Min target size 44×44 for buttons/links on mobile.
- Visible focus ring: `outline: 2px solid var(--color-accent); outline-offset: 3px;`. Never `outline: none`.
- All images need `alt`. Decorative SVGs get `aria-hidden="true"`.
- `<details>` summaries are keyboard-accessible by default — don't replace with `<div onClick>`.

---

## 10. Performance defaults

- Static export (`output: 'export'`) is fine — the site is purely informational.
- One full-bleed product screenshot maximum. PNG ≤ 200KB after compression, or AVIF.
- No analytics scripts at launch (PostHog is on the mobile app; the marketing site stays clean unless we add Vercel Web Analytics).
- No client JS for FAQs (`<details>`), CTAs (plain `<a>`), or layout.

---

## 11. Don'ts (the short list)

- Don't use color for emphasis other than the single hero `.` accent.
- Don't add card shadows, gradients, or glassmorphism.
- Don't pluralize the brand: "Veladon", never "Veladons" or "the Veladon team" (use "we").
- Don't link to Google Play — iOS first, hidden until Android ships.
- Don't write the legal text inline in `app/terms/page.tsx`. Edit `docs/legal/*.html`; the page reads from there.
- Don't add a blog, a changelog, or a newsletter at launch.

---

## 12. Updating this guide

When you change a token here, also update:
- `app/globals.css` — the actual CSS custom properties.
- `DESIGN.md` — if the change reflects a reinterpretation of the reference site, note it there too.

Section numbering in this guide is referenced from PR descriptions and code review. Don't renumber casually.
