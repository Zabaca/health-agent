# Health Agent

A Next.js web app for managing medical record release forms across three roles: **patients**, **agents**, and **admins**. Patients register, complete their profile, schedule calls, and submit record release forms. Agents and admins manage assigned patients, review submissions, and coordinate scheduled calls.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **UI**: Mantine v7 (core, dates, hooks, notifications) + Tabler Icons
- **Database**: SQLite via Drizzle ORM + libSQL (`@libsql/client`)
- **Auth**: NextAuth.js v5 (credentials — email/password, Edge-compatible split config)
- **API contract**: ts-rest (`@ts-rest/core`, `@ts-rest/next`) — type-safe client/server contract
- **Forms**: react-hook-form + zod
- **Drag & drop**: dnd-kit (provider reordering)
- **Signature**: react-signature-canvas
- **PII encryption**: Node.js built-in `crypto` (AES-256-GCM) for SSN, address, phone
- **Release codes**: Short, time-based human-readable identifiers for each release form (see [Release Codes](#release-codes))
- **Dates**: dayjs
- **Linter**: oxlint

## Prerequisites

- [Bun](https://bun.sh) v1.0 or higher

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Copy the example below into a `.env` file at the project root:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-random-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="replace-with-a-64-char-hex-string"
```

Generate secure values:

```bash
# AUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY (must be 64 hex chars = 32 bytes for AES-256)
openssl rand -hex 32
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite file path (e.g. `file:./dev.db`) |
| `AUTH_SECRET` | Yes | NextAuth.js secret — at least 32 random characters |
| `NEXTAUTH_URL` | Yes | Base URL of the app (e.g. `http://localhost:3000`) |
| `ENCRYPTION_KEY` | Yes | 64-character hex string (32 bytes) used to AES-256-GCM encrypt PII fields (SSN, address, phone) |

### 3. Set up the database

```bash
bun db:migrate
```

Creates the SQLite database at `./dev.db` and applies all Drizzle migrations.

### 4. Seed staff accounts (optional)

```bash
bun seed:staff
```

Creates initial admin and agent accounts for testing.

### 5. Start the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

### Patient

1. **Register** at `/register` — creates a patient account
2. **Log in** at `/login`
3. **Complete profile** — fill in personal info (name, DOB, address, phone, SSN)
4. **Dashboard** (`/dashboard`) — view your releases and scheduled calls
5. **Schedule a call** (`/schedule-call`) — book a call with your assigned agent
6. **My Providers** (`/my-providers`) — manage a saved list of healthcare providers
7. **New Release** (`/releases/new`) — submit a medical record release form with provider entries and a drawn signature

### Agent (`/agent/`)

- Dashboard lists assigned patients
- View patient detail, profile, releases, and scheduled calls
- Cancel scheduled calls
- Look up any of their patient's releases by release code (`/agent/releases/lookup`)

### Admin (`/admin/`)

- Full access to all patients, agents, and scheduled calls
- Same patient detail views as agents
- Look up any release by release code regardless of assigned agent (`/admin/releases/lookup`)

---

## Release Codes

Every release form is assigned a short, human-readable **release code** at creation time. Codes are generated in `src/lib/utils/releaseCode.ts`:

```ts
// base36(unix_seconds_since_epoch) + 2 random chars → e.g. "LMQ3X8K2"
const timePart   = Math.floor(Date.now() / 1000).toString(36).toUpperCase(); // ~7 chars
const randomPart = Math.random().toString(36).substring(2, 4).toUpperCase(); // 2 chars
return timePart + randomPart;
```

**Properties:**
- **Time-based** — the timestamp component is monotonically increasing, making collisions extremely unlikely without needing UUID-length strings.
- **Short** — typically 8–9 characters, easy to read aloud or type.
- **Unique** — enforced at the database level via a `UNIQUE` index on the `releaseCode` column.

Codes are stored on the `Release` row, displayed in the Authorization section of every release view/print page, and used by the admin and agent lookup pages to quickly retrieve a specific release.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server at http://localhost:3000 |
| `bun build` | Run migrations then build for production |
| `bun start` | Start production server (requires build first) |
| `bun lint` | Run oxlint on all source files |
| `bun lint:fix` | Run oxlint with auto-fix |
| `bun type-check` | Run TypeScript type checking |
| `bun db:generate` | Generate a new Drizzle migration from schema changes |
| `bun db:migrate` | Apply pending database migrations |
| `bun seed:staff` | Seed initial admin and agent accounts |
| `bun migrate:encrypt-pii` | Encrypt existing plaintext PII in the database |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login               # Login page
│   │   └── register            # Register page
│   ├── (protected)/            # Patient-facing pages
│   │   ├── dashboard           # Release list + scheduled calls
│   │   ├── profile             # Patient profile
│   │   ├── my-providers        # Saved provider list
│   │   ├── schedule-call       # Book a call
│   │   ├── scheduled-calls/    # Call detail + reschedule
│   │   └── releases/           # New release & read-only view
│   ├── (admin)/admin/          # Admin-only pages
│   │   ├── dashboard           # All patients
│   │   ├── patients/[id]       # Patient detail + releases
│   │   ├── releases/lookup     # Look up any release by code
│   │   ├── call-schedule/      # Admin call management
│   │   ├── profile             # Admin profile
│   │   └── change-password
│   ├── (agent)/agent/          # Agent-only pages (mirrors admin)
│   │   └── releases/lookup     # Look up assigned-patient releases by code
│   └── api/                    # API routes (ts-rest contract handlers)
├── components/
│   ├── auth/                   # LoginForm, RegisterForm
│   ├── dashboard/              # ReleaseList, scheduled call cards
│   ├── layout/                 # AppShell, Sidebar (role-aware)
│   ├── release-form/           # Form sections and field components
│   └── release-view/           # Read-only view, DeleteReleaseButton
├── lib/
│   ├── api/
│   │   ├── contract.ts         # ts-rest API contract definition
│   │   ├── contract-handler.ts # Server-side handler factory
│   │   ├── client.ts           # Type-safe frontend client
│   │   └── response-schemas.ts # Shared Zod response shapes
│   ├── crypto.ts               # AES-256-GCM encrypt/decrypt for PII
│   ├── db/                     # Drizzle client, schema, and inferred DB types
│   ├── schemas/                # Zod schemas (single source of truth for form types)
│   └── utils/
│       └── releaseCode.ts      # Time-based short release code generator
└── types/                      # Re-export barrel for shared types
scripts/
├── seed-admins.ts              # Seeds admin/agent accounts
└── encrypt-existing-pii.ts     # One-time migration to encrypt plaintext PII
drizzle/                        # SQL migrations (auto-generated by drizzle-kit)
dev.db                          # SQLite database file (auto-generated, git-ignored)
public/
└── uploads/                    # Uploaded files (signature PNGs, membership card photos)
```
