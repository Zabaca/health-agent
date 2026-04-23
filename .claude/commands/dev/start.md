Automate the full health-agent web dev environment setup. Run each step sequentially and stop if any step fails. Use the Bash tool for commands and AskUserQuestion when input is needed.

This is a Bun-workspace monorepo. The web app lives at `apps/web/`. Root scripts proxy into it — prefer running commands at the repo root.

direnv is configured via `.envrc` to load `.env` from the repo root into the shell. Subprocesses (Next.js, drizzle-kit) inherit these via `process.env`. Do not create `.env` files inside `apps/*`.

## Steps

1. **Check prerequisites**
   - Verify Bun is installed and version is `>=1.0.0` (run `bun -v`)
   - If Bun is not installed, tell the user to install it from https://bun.sh and stop

2. **Install dependencies**
   - Run `bun install` at the repo root (installs for all workspaces)

3. **Environment file**
   - Check if `.env` exists at the repo root
   - If it does NOT exist, ask the user: "No root `.env` found. Would you like to: (a) Paste your env contents so I can create the file, or (b) Create one from `.env.example` and fill in values yourself?"
   - If they choose (a), ask them to paste the contents, then write to `.env`
   - If they choose (b):
     - Copy `.env.example` to `.env`
     - Generate suggested values and show them to the user to paste in:
       - `AUTH_SECRET`: `openssl rand -base64 32`
       - `ENCRYPTION_KEY`: `openssl rand -hex 32` (must be 64-char hex)
     - Remind them to also set `DATABASE_URL` — either `file:./local.db` for a local SQLite file or a Turso `libsql://…` URL (with `DATABASE_AUTH_TOKEN` for remote)
   - After the file exists, if direnv is installed, remind the user to run `direnv allow` once so `.envrc` can load it
   - If the file already exists, confirm it exists and move on

4. **Run database migrations**
   - Run `bun db:migrate` at the repo root (proxies to `apps/web`)
   - For a local `file:` DATABASE_URL this creates the SQLite DB and applies all Drizzle migrations; for a remote Turso URL it applies migrations against the configured database

5. **Run type check**
   - Run `bun type-check` at the repo root
   - If there are errors, report them and ask if the user wants to continue anyway

6. **Start dev server**
   - Run `bun dev` at the repo root in the background (proxies to `next dev` in `apps/web`)
   - Tell the user the app is starting at http://localhost:3000

Done! Summarize what was set up. Remind them they can register a new account at `/register` to get started.
