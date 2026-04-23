# Health Agent

A Bun-workspace monorepo for the Zabaca HealthAgent product:

- **`apps/web`** — Next.js 14 patient portal for managing medical record release forms across three roles: **patients**, **agents**, and **admins**. Patients register, complete their profile, and submit record release forms. Agents and admins manage assigned patients.
- **`apps/mobile`** — Expo bare-workflow React Native app (iOS + Android) — scaffolded and ready for HealthKit integration.
- **`packages/types`** — Shared Zod schemas consumed by both web and mobile.

```
health-agent/
├── apps/
│   ├── web/          ← Next.js
│   └── mobile/       ← Expo (iOS + Android)
├── packages/
│   └── types/        ← shared Zod schemas
└── package.json      ← Bun workspace root
```

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
- **File storage**: Cloudflare R2 via S3-compatible API (`@aws-sdk/client-s3`) — all uploads (avatars, insurance cards, signatures, fax PDFs) stored in R2 and served through `/api/files/[key]`
- **Fax integration**: Faxage API — admins and agents can fax a release directly from the release view page (see [Faxage Integration](#faxage-integration))
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

Copy the example below into `apps/web/.env` (web-specific). Mobile env vars live in `apps/mobile/.env` — see `apps/mobile/.env.example`.

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
| `FAXAGE_USERNAME` | No* | Faxage account username |
| `FAXAGE_COMPANY` | No* | Faxage company identifier |
| `FAXAGE_PASSWORD` | No* | Faxage account password |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `S3_ACCESS_KEY_ID` | Yes | S3-compatible API token access key ID |
| `S3_SECRET_ACCESS_KEY` | Yes | S3-compatible API token secret access key |
| `S3_BUCKET` | Yes | R2 bucket name |

> \* Required to send faxes. The app runs without them, but clicking **Fax Request** will fail until all three are set.

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

The release view pages for **agents** and **admins** share a common set of actions available when the release is not voided:

- **Fax Request** — opens a modal pre-filled with the first provider's name and fax number (both editable). On send, the release is rendered as a Deflate-compressed TIFF and transmitted to the provider via the Faxage API. Every attempt (success or failure) is recorded in the **Release Request History** table at the bottom of the page.
- **Export TIFF** — downloads a multi-page, Deflate-compressed TIFF of the release at 600 DPI, with smart page breaks and a footer showing the release code and page number.
- **Print** — opens the browser print dialog.
- **Void Release** — irreversibly voids the release (staff only).

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

## Faxage Integration

Admins and agents can fax a release record directly from the release view page using the [Faxage](https://www.faxage.com) HTTP API.

### How it works

1. Click **Fax Request** on any non-voided release.
2. A modal pre-fills the recipient name and fax number from the first provider on the release (both are editable before sending).
3. The release page is rendered to canvas via `html2canvas`, split into 8.5×11" pages at 600 DPI, and encoded as a Deflate-compressed TIFF (browser-native `CompressionStream` — no extra dependencies).
4. The TIFF is base64-encoded and POSTed to `/api/fax`, which forwards it to `https://api.faxage.com/httpsfax.php`.
5. Every attempt — success or failure — is logged to the `ReleaseRequestLog` table and displayed in the **Release Request History** section at the bottom of the release page.

### Configuration

Add the following to your `.env`:

```env
FAXAGE_USERNAME="your-faxage-username"
FAXAGE_COMPANY="your-faxage-company"
FAXAGE_PASSWORD="your-faxage-password"
```

### Database

The `ReleaseRequestLog` table stores:

| Column | Description |
|--------|-------------|
| `id` | UUID primary key |
| `releaseId` | Foreign key → `Release` (cascade delete) |
| `type` | `"fax"` (extensible for future send types) |
| `service` | `"faxage"` |
| `status` | `"success"` or `"failed"` |
| `faxNumber` | Destination fax number |
| `recipientName` | Provider name used as the fax recipient |
| `apiResponse` | Raw response string from Faxage (always recorded) |
| `error` | Boolean — `true` if Faxage returned an error or the request threw |
| `createdAt` | ISO timestamp |

---

## Secrets Management (SOPS + age)

Secrets are encrypted in the repo using [SOPS](https://github.com/getsops/sops) with [age](https://github.com/FiloSottile/age) encryption — no cloud KMS required.

### First-time setup

1. **Install tools**

   ```bash
   brew install age sops
   ```

2. **Generate your age keypair**

   ```bash
   age-keygen -o ~/Library/Application\ Support/sops/age/keys.txt
   ```

   Share your **public key** (printed to stdout) with the team so it can be added to `.sops.yaml`.

3. **Get added to `.sops.yaml`**

   A team member adds your public key to the `age` recipients list in `.sops.yaml` and re-encrypts existing files:

   ```bash
   sops --rotate --add-age age1yourpublickey... --in-place path/to/secret.yaml
   ```

### Encrypting a new file

```bash
sops --encrypt --in-place secrets.yaml
```

SOPS reads `.sops.yaml` for encryption rules and recipient keys automatically.

### Editing an encrypted file

```bash
sops secrets.yaml
```

Opens your `$EDITOR`, decrypts for editing, and re-encrypts on save.

### Decrypting to stdout

```bash
sops --decrypt secrets.yaml
```

### Key location

| OS | Default path |
|----|-------------|
| macOS | `~/Library/Application Support/sops/age/keys.txt` |
| Linux | `~/.config/sops/age/keys.txt` |

Or set `SOPS_AGE_KEY_FILE` to a custom path.

### CI/CD

Store the age private key as a CI secret named `SOPS_AGE_KEY` and SOPS will use it automatically for decryption.

---

## Available Scripts

All root scripts proxy into `apps/web`. Run mobile commands from `apps/mobile`.

### Web (run from repo root)

| Command | Description |
|---------|-------------|
| `bun dev` | Start the Next.js dev server at http://localhost:3000 |
| `bun build` | Production build |
| `bun start` | Start the production server (after `bun build`) |
| `bun lint` / `bun lint:fix` | oxlint |
| `bun type-check` | `tsc --noEmit` |
| `bun db:generate` | Generate a new Drizzle migration |
| `bun db:migrate` | Apply pending migrations |
| `bun seed:staff` | Seed initial admin + agent accounts |
| `bun migrate:encrypt-pii` | One-time PII encryption migration |

### Mobile (run from `apps/mobile`)

| Command | Description |
|---------|-------------|
| `bun ios` | Build + launch in iOS simulator (requires Xcode + `cd ios && pod install`) |
| `bun android` | Build + launch on Android emulator (requires Android Studio) |
| `bun start` | Metro bundler only |
| `bun prebuild:clean` | Regenerate native `ios/` and `android/` folders |
| `./scripts/build-ios.sh` | Archive + export IPA + upload to TestFlight |
| `./scripts/build-android.sh` | `./gradlew assembleRelease` → signed APK |

See `apps/mobile/README.md` for mobile-specific setup (CocoaPods, signing, App Store config).

---

## Project Structure

```
health-agent/
├── apps/
│   ├── web/                        # Next.js 14 app
│   │   ├── src/app/
│   │   │   ├── (auth)/             # login, register, forgot/reset password, invites
│   │   │   ├── (protected)/        # patient: dashboard, profile, providers, records, releases
│   │   │   ├── (admin)/admin/      # admin-only pages
│   │   │   ├── (agent)/agent/      # agent-only pages
│   │   │   ├── (patient-designated-agent)/representing/  # PDA workspace
│   │   │   └── api/                # route handlers (ts-rest contract + fax/upload)
│   │   ├── src/components/         # auth, dashboard, release-form/-view, release,
│   │   │                             my-providers, designated-agents, schedule-call, staff
│   │   ├── src/lib/
│   │   │   ├── api/                # ts-rest contract + client + response schemas
│   │   │   ├── crypto.ts           # AES-256-GCM PII encryption
│   │   │   ├── db/                 # Drizzle client, schema, inferred types
│   │   │   ├── r2.ts               # Cloudflare R2 via S3 API
│   │   │   ├── schemas/release.ts  # Release Zod schemas (profile now in packages/types)
│   │   │   └── utils/releaseCode.ts
│   │   ├── drizzle/                # SQL migrations
│   │   ├── scripts/                # seed + migration scripts
│   │   ├── public/                 # static assets (uploads go to R2)
│   │   └── next.config.mjs / tsconfig.json / drizzle.config.ts / .env
│   └── mobile/                     # Expo bare-workflow app
│       ├── App.js / index.js
│       ├── app.json                # bundle ID com.zabaca.healthagent, HealthKit usage strings
│       ├── metro.config.js         # monorepo resolver (watches packages/types)
│       ├── ios/                    # native iOS (Xcode project + Podfile + Podfile.lock)
│       ├── android/                # native Android (Gradle)
│       ├── scripts/                # build-ios.sh, build-android.sh
│       ├── eas.json                # EAS Build + Update config
│       └── README.md               # mobile-specific dev + release docs
├── packages/
│   └── types/                      # @health-agent/types — shared Zod schemas (web + mobile)
├── docs/
│   └── app-store-checklist.md      # App Store / Play Store setup checklist
├── bunfig.toml                     # linker = "hoisted" (required for Metro)
├── vercel.json                     # deploys apps/web
└── package.json                    # workspace root (bun workspaces)
```
