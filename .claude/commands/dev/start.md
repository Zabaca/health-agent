Automate the full health-agent dev environment setup. Run each step sequentially and stop if any step fails. Use the Bash tool for commands and AskUserQuestion when input is needed.

## Steps

1. **Check prerequisites**
   - Verify Bun is installed and version is `>=1.0.0` (run `bun -v`)
   - If Bun is not installed, tell the user to install it from https://bun.sh and stop

2. **Install dependencies**
   - Run `bun install`

3. **Environment file**
   - Check if `.env` exists in the project root
   - If it does NOT exist, ask the user: "No .env found. Would you like to: (a) Paste your env contents so I can create the file, or (b) Create one from the template and fill in values yourself?"
   - If they choose (a), ask them to paste the contents, then write to `.env`
   - If they choose (b), create `.env` with the following template and tell them to fill in `AUTH_SECRET`:
     ```
     DATABASE_URL="file:./dev.db"
     AUTH_SECRET=""
     NEXTAUTH_URL="http://localhost:3000"
     ```
   - Generate a suggested `AUTH_SECRET` value by running `openssl rand -base64 32` and show it to the user
   - If the file already exists, confirm it exists and move on

4. **Run database migrations**
   - Run `bun db:migrate`
   - This creates the SQLite database at `./dev.db` and applies all Drizzle migrations

5. **Run type check**
   - Run `bun type-check` to verify everything compiles cleanly
   - If there are errors, report them and ask if the user wants to continue anyway

6. **Start dev server**
   - Run `bun dev` in the background
   - Tell the user the app is starting at http://localhost:3000

Done! Summarize what was set up. Remind them they can register a new account at `/register` to get started.
