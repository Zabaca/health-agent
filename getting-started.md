# Getting Started — Health Agent

Developer guide for setting up and working with the health-agent codebase.

## Prerequisites

- [Bun](https://bun.sh) v1.0+

## Quick Setup

```bash
bun install                       # Install dependencies
cp .env.example .env              # Copy env template (then fill in AUTH_SECRET)
bun db:migrate                    # Create SQLite DB and run migrations
bun dev                           # Start dev server at http://localhost:3000
```

Or use the Claude Code command: `/dev/start`

## Environment Variables

Create a `.env` file in the project root:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path — use `file:./dev.db` for local dev |
| `AUTH_SECRET` | Yes | Random 32+ char string for NextAuth session signing |
| `NEXTAUTH_URL` | Yes | App URL — `http://localhost:3000` for local dev |

Generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Database

- **Engine**: SQLite (local file `dev.db`, or Turso/libSQL URL for production)
- **ORM**: Drizzle ORM with `drizzle-kit` for migrations
- **Schema**: `src/lib/db/schema.ts` — single source of truth

### Common database commands

| Command | What it does |
|---------|-------------|
| `bun db:migrate` | Apply pending migrations |
| `bun db:generate` | Generate a new migration after schema changes |

### Tables

- **User** — accounts with email/password auth, profile fields (name, DOB, address, SSN)
- **Release** — medical record release forms with patient info, authorization, signature
- **Provider** — healthcare providers attached to a release (ordered, with record request details)
- **UserProvider** — saved provider templates per user (drag-to-reorder)

## Architecture

### Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Mantine v7** — UI components
- **Drizzle ORM** + libSQL — database
- **NextAuth.js v5** — authentication (credentials, JWT sessions)
- **react-hook-form** + **zod** — form handling and validation
- **@dnd-kit** — drag-to-reorder
- **react-signature-canvas** — signature capture

### Auth (split config pattern)

NextAuth uses a split config for Edge compatibility:

- `src/auth.config.ts` — Edge-safe config used by middleware (JWT strategy, callbacks, pages)
- `src/auth.ts` — Full config with Credentials provider + DB lookup (Node.js only)
- `src/middleware.ts` — Protects routes; redirects unauthenticated users to `/login`

### Route Groups

- `(auth)/` — Public auth pages (`/login`, `/register`)
- `(protected)/` — Auth-gated pages (`/dashboard`, `/releases/*`, `/my-providers`, `/profile`)

### API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/[...nextauth]` | * | NextAuth handler |
| `/api/register` | POST | Create new account |
| `/api/releases` | GET, POST | List releases / create new release |
| `/api/releases/[id]` | GET, PATCH, DELETE | View / void / delete a release |
| `/api/my-providers` | GET, POST, PATCH, DELETE | CRUD for saved provider templates |
| `/api/profile` | GET, PATCH | View / update user profile |
| `/api/upload` | POST | File upload (signatures, membership cards) |

### Key Patterns

- **Zod schemas** in `src/lib/schemas/` are the single source of truth for form validation (shared between client and API)
- **Provider backfill**: When a release is submitted, the API backfills empty user profile fields and updates saved UserProviders from the submitted data
- **Void over delete**: Releases support a `voided` flag — soft-delete pattern for audit trail
- **File uploads** go to `public/uploads/` (signatures as PNG, membership cards as images)

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server at http://localhost:3000 |
| `bun build` | Build for production |
| `bun start` | Start production server (requires build first) |
| `bun lint` | Run oxlint on source files |
| `bun lint:fix` | Run oxlint with auto-fix |
| `bun type-check` | TypeScript type check (no emit) |
| `bun db:generate` | Generate a Drizzle migration from schema changes |
| `bun db:migrate` | Apply pending database migrations |

## Project Structure

```
src/
├── app/
│   ├── (auth)/                   # Login & register pages
│   ├── (protected)/              # Auth-gated pages
│   │   ├── dashboard/            # Release list
│   │   ├── releases/             # New release form & read-only view
│   │   ├── my-providers/         # Saved provider templates
│   │   └── profile/              # User profile
│   └── api/                      # API routes
├── components/
│   ├── auth/                     # LoginForm, RegisterForm
│   ├── dashboard/                # ReleaseList table
│   ├── layout/                   # AppShell, Sidebar
│   ├── my-providers/             # Provider template management
│   ├── profile/                  # Profile form
│   ├── release-form/             # Form sections and fields
│   └── release-view/             # Read-only view components
├── lib/
│   ├── auth-helpers.ts           # Password hashing (bcryptjs)
│   ├── upload.ts                 # File upload handling
│   ├── db/
│   │   ├── index.ts              # Drizzle client singleton
│   │   ├── schema.ts             # Table definitions & relations
│   │   └── types.ts              # Inferred DB types
│   └── schemas/                  # Zod validation schemas
└── types/                        # Shared type re-exports
drizzle/                          # SQL migrations (auto-generated)
public/uploads/                   # Uploaded files (git-ignored)
```
