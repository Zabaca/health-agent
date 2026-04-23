# Getting Started — Health Agent

Developer guide for setting up and working with the health-agent monorepo.

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- For mobile development: Xcode (iOS) + CocoaPods 1.15+ / Android Studio (Android)

## Repo layout

Bun-workspace monorepo. See `README.md` for the full tree.

```
health-agent/
├── apps/
│   ├── web/          ← Next.js 14 patient portal
│   └── mobile/       ← Expo bare-workflow (iOS + Android)
├── packages/
│   └── types/        ← @health-agent/types (shared Zod schemas)
└── package.json      ← workspace root (proxy scripts)
```

## Quick Setup — Web

```bash
bun install                                    # Install all workspace deps
cp apps/web/.env.example apps/web/.env         # Copy env template (then fill in AUTH_SECRET, etc.)
bun db:migrate                                 # Create SQLite DB and run migrations (proxies into apps/web)
bun dev                                        # Start dev server at http://localhost:3000
```

Or use the Claude Code command: `/dev/start`

## Quick Setup — Mobile

```bash
cd apps/mobile
cp .env.example .env                           # Mobile build/release secrets (not needed for dev)
cd ios && pod install && cd ..                 # CocoaPods 1.15+ required
bun run ios                                    # Build + launch on iOS simulator
# or
bun run android                                # Android emulator
```

See `apps/mobile/README.md` for release builds (TestFlight, App Store, APK).

## Environment Variables

### Web (`apps/web/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path — `file:./dev.db` for local dev |
| `AUTH_SECRET` | Yes | Random 32+ char string for NextAuth session signing |
| `NEXTAUTH_URL` | Yes | App URL — `http://localhost:3000` for local dev |
| `ENCRYPTION_KEY` | Yes | 64-char hex string (32 bytes) for AES-256-GCM PII encryption |
| `RESEND_API_KEY` | No* | Resend — for password reset / invite / notification emails |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `R2_ACCOUNT_ID` | Yes | Cloudflare R2 via S3 API — file uploads |
| `FAXAGE_USERNAME`, `FAXAGE_COMPANY`, `FAXAGE_PASSWORD` | No* | Faxage — outbound faxing from release detail pages |
| `FAXAGE_WEBHOOK_SECRET` | No* | Shared secret for `/api/fax/incoming` + `/api/fax/confirm` webhooks |

> \* Needed for the associated feature to work; app still runs without them.

Generate secure values:

```bash
openssl rand -base64 32    # AUTH_SECRET
openssl rand -hex 32       # ENCRYPTION_KEY
```

### Mobile (`apps/mobile/.env`)

Only needed for releases (TestFlight uploads, Android signing). See `apps/mobile/.env.example`.

## Database

- **Engine**: SQLite (`apps/web/dev.db`), or Turso/libSQL URL for production
- **ORM**: Drizzle ORM with `drizzle-kit` for migrations
- **Schema**: `apps/web/src/lib/db/schema.ts` — single source of truth
- **Migrations**: `apps/web/drizzle/` (auto-generated SQL + meta)

### Common database commands (run at repo root)

| Command | What it does |
|---------|-------------|
| `bun db:migrate` | Apply pending migrations |
| `bun db:generate` | Generate a new migration after schema changes |
| `bun migrate:encrypt-pii` | One-time PII encryption backfill |
| `bun seed:staff` | Seed initial admin + agent accounts |

### Key tables

- **User** — accounts with email/password auth, profile fields (name, DOB, address, SSN). PII encrypted.
- **Release** — medical record release forms with patient info, authorization, signature, release code
- **Provider** — healthcare providers attached to a release (ordered, with record-request details)
- **UserProvider** — saved provider templates per user
- **PatientAssignment** — links a patient to their Zabaca-assigned agent
- **PatientDesignatedAgent** — PDA (family/caregiver) invitations with per-resource permissions
- **ZabacaAgentRole** — marks a user as a Zabaca staff agent
- **IncomingFile** — all inbound files (faxes + manual uploads), optionally linked to a patient + release
- **ReleaseRequestLog** — fax send audit trail
- **StaffInvite** — admin/agent onboarding invite tokens
- **ScheduledCall** — patient ↔ agent call bookings (feature currently nav-hidden)

## Architecture

### Tech Stack

- **Next.js 14** (App Router, TypeScript) — `apps/web`
- **Expo SDK 52 / React Native 0.76** (bare workflow) — `apps/mobile`
- **Mantine v7** — UI components (web)
- **Drizzle ORM** + libSQL — database (web)
- **NextAuth.js v5** — authentication (credentials, JWT sessions)
- **ts-rest** — type-safe API contracts
- **react-hook-form** + **zod** — form handling and validation
- **@dnd-kit** — drag-to-reorder
- **react-signature-canvas** — signature capture
- **Resend** — transactional email
- **Faxage** — outbound + inbound faxing
- **Cloudflare R2** via S3 API — file storage

### Auth (split config pattern)

NextAuth uses a split config for Edge compatibility:

- `apps/web/src/auth.config.ts` — Edge-safe config used by middleware (JWT strategy, callbacks, pages)
- `apps/web/src/auth.ts` — Full config with Credentials provider + DB lookup (Node.js only); derives session flags (`isAgent`, `isPda`, `isPatient`, `mustChangePassword`, `disabled`) from DB rows
- `apps/web/src/middleware.ts` — Role-based routing; redirects unauthenticated users to `/login`; routes admins to `/admin/*`, agents to `/agent/*`, PDA-only users to `/representing`

### Route Groups (apps/web)

- `(auth)/` — Public: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/invite/[token]`, `/staff-invite/[token]`, `/suspended`
- `(protected)/` — Patient view: `/dashboard`, `/profile`, `/my-providers`, `/my-records`, `/releases/*`, `/my-designated-agents`, (`/schedule-call`, `/scheduled-calls` — currently feature-flagged off)
- `(patient-designated-agent)/` — PDA view: `/representing`, `/representing/[patientId]/*`, `/account`
- `(admin)/admin/` — Admin: dashboard, patients, agents, call-schedule, records, releases/lookup, profile, change-password
- `(agent)/agent/` — Zabaca agent: dashboard, patients, call-schedule, records, releases/lookup, profile, change-password

### API Routes (apps/web/src/app/api/)

Organized by role-scope:
- `/api/auth/*` — NextAuth
- `/api/register`, `/api/password/*`, `/api/invites/*`, `/api/staff-invite/*` — public onboarding
- `/api/profile`, `/api/releases/*`, `/api/my-providers/*`, `/api/my-records`, `/api/my-designated-agents/*` — patient
- `/api/representing/*` — PDA
- `/api/admin/*` — admin-only (patients, agents, records, staff-invites, releases lookup)
- `/api/agent/*` — agent-only (scoped to assigned patients)
- `/api/staff/*` — shared admin + agent endpoints
- `/api/fax`, `/api/fax/incoming`, `/api/fax/confirm` — Faxage outbound + webhooks
- `/api/upload`, `/api/files/[...key]`, `/api/records/upload`, `/api/documents/[id]` — file handling

Most routes use the ts-rest contract in `apps/web/src/lib/api/contract.ts`.

### Key Patterns

- **Zod schemas** — `packages/types/` is the shared source of truth for schemas used in both web and mobile. Web-only schemas remain in `apps/web/src/lib/schemas/` for now; new cross-surface schemas should land in `packages/types/`.
- **PII encryption** — SSN (last 4), DOB, names, address encrypted at rest (`apps/web/src/lib/crypto.ts`). Decrypted only at display time.
- **Void over delete** — Releases use a `voided` flag for audit trail.
- **File uploads** — all go to R2 (via `apps/web/src/lib/r2.ts`), served through `/api/files/[key]`.

## Available Scripts

All web scripts proxy from the repo root into `apps/web`.

### Web (run from repo root)

| Command | Description |
|---------|-------------|
| `bun dev` | Next.js dev server at http://localhost:3000 |
| `bun build` | Production build |
| `bun start` | Start production server (after build) |
| `bun lint` / `bun lint:fix` | oxlint |
| `bun type-check` | `tsc --noEmit` |
| `bun db:generate` / `bun db:migrate` | Drizzle |
| `bun seed:staff` | Seed admin + agent accounts |
| `bun migrate:encrypt-pii` | PII backfill |

### Mobile (run from `apps/mobile`)

| Command | Description |
|---------|-------------|
| `bun run ios` | Build + launch iOS simulator |
| `bun run android` | Build + launch Android emulator |
| `bun start` | Metro bundler only |
| `bun run prebuild:clean` | Regenerate native `ios/` and `android/` |
| `./scripts/build-ios.sh` | Release archive → TestFlight |
| `./scripts/build-android.sh` | Release APK |

## Troubleshooting

- **Metro can't find `@health-agent/types` or transitive deps** — check `bunfig.toml` still sets `linker = "hoisted"`. Isolated linker breaks Metro's monorepo resolution.
- **Next.js picocolors / module-not-found errors after switching branches** — clear `.next` and restart: `rm -rf .next && bun dev`.
- **`pod install` fails after changing Expo SDK or installing a new native module** — delete `apps/mobile/ios/Pods` + `apps/mobile/ios/Podfile.lock`, then re-run `pod install`. If Xcode is open, quit it first.
- **Vercel deploy fails with "can't cd apps/web"** — Root Directory in the Vercel dashboard must be empty (or remove the `cd` from `vercel.json` and set Root Directory to `apps/web`).

## Reference

- **Monorepo layout + conventions**: `CLAUDE.md`
- **Mobile-specific setup / releases / App Store**: `apps/mobile/README.md`, `docs/app-store-checklist.md`
- **Shared types usage**: `packages/types/README.md`
- **Full README with stack details, release codes, Faxage integration, SOPS secrets**: `README.md`
