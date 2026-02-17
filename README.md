# Medical Record Release Form

A Next.js web app that allows patients to register, log in, and create medical record release & request forms. Each form captures patient info, unlimited healthcare provider entries with record request details, and an authorization section with a drawn signature.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **UI**: Mantine v7
- **Database**: SQLite via Prisma ORM
- **Auth**: NextAuth.js v5 (credentials — email/password)
- **Forms**: react-hook-form + zod
- **Signature**: react-signature-canvas

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example below into a `.env` file at the project root (one already exists if you cloned this repo):

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-random-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
npx prisma migrate dev
```

This creates the SQLite database at `prisma/dev.db` and runs all migrations.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. **Register** at `/register` — creates a new account
2. **Log in** at `/login`
3. **Dashboard** (`/dashboard`) — lists all your releases with edit and delete actions
4. **New Release** (`/releases/new`) — fill out patient info, add one or more healthcare providers, draw a signature, and submit
5. **Edit Release** (`/releases/[id]`) — modify any previously saved release

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server (requires build first) |
| `npx prisma migrate dev` | Apply database migrations |
| `npx prisma studio` | Open Prisma Studio to browse the database |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login         # Login page
│   ├── (auth)/register      # Register page
│   ├── (protected)/
│   │   ├── dashboard        # Release list
│   │   └── releases/        # New & edit release pages
│   └── api/                 # API routes (auth, register, releases, upload)
├── components/
│   ├── auth/                # LoginForm, RegisterForm
│   ├── dashboard/           # ReleaseList table
│   ├── layout/              # AppShell, Sidebar
│   └── release-form/        # Form sections and field components
├── lib/                     # Prisma client, auth helpers, upload utility
└── types/                   # Shared TypeScript interfaces
prisma/
├── schema.prisma            # Database schema
└── dev.db                   # SQLite database (auto-generated)
public/
└── uploads/                 # Uploaded files (signature PNGs, membership card photos)
```
