# `apps/www` — Veladon marketing site

Tiny Next.js 14 site whose only job is to send people to the App Store and host the public Terms / Privacy / Support pages.

- **Design reference:** [`DESIGN.md`](./DESIGN.md) — the foothillmetabolic.com extraction this site clones.
- **Style guide:** [`STYLE_GUIDE.md`](./STYLE_GUIDE.md) — tokens, voice, page structure for Veladon's site.
- **Legal source of truth:** [`/docs/legal/terms.html`](../../docs/legal/terms.html) and [`/docs/legal/privacy.html`](../../docs/legal/privacy.html). The legal pages render those files inside the site shell — don't duplicate the text.

## Run locally

```bash
cd apps/www
bun install        # only if you haven't from the root
bun run dev        # http://localhost:3001
```

Dev port is **3001** so the patient portal (`apps/web`, port 3000) and the marketing site can run side-by-side.

## Deploy

This is a separate Vercel project from `apps/web` — point it at `apps/www`. The repo's root `vercel.json` only covers `apps/web`; do not modify it.
