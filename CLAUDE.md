## Repo layout

Bun-workspace monorepo. Do not run commands at the repo root expecting Next.js behavior; root scripts proxy into `apps/web`.

- `apps/web/` — Next.js 14 app (patient portal). All Next.js code lives here: `src/`, `public/`, `drizzle/`, `scripts/`, `.env*`, `next.config.mjs`, `tsconfig.json`, `drizzle.config.ts`.
- `apps/mobile/` — Expo bare-workflow React Native app. Native `ios/` and `android/` trees are committed. Metro config (`metro.config.js`) watches `packages/types` at the workspace root.
- `packages/types/` — `@health-agent/types`: shared Zod schemas (consumed by both apps). Source TS is exported directly; no build step. Web picks it up via `transpilePackages`, mobile via Metro's `watchFolders`.
- `bunfig.toml` — `linker = "hoisted"`. Required for Metro compatibility; also makes transitive deps visible to Next.js. Don't switch to `isolated`.
- `vercel.json` — deploys `apps/web` only (`cd apps/web && bun run build`).

## Working inside the workspace

- Root `bun dev`, `bun build`, `bun lint`, `bun type-check`, `bun db:migrate`, etc., all proxy into `apps/web`. Prefer these at the repo root.
- For mobile, `cd apps/mobile` and use `bun ios` / `bun android` / `bun start`. iOS requires `cd ios && pod install` first (CocoaPods 1.15+).
- When adding a new dependency used by only one app/package, declare it in **that** workspace's `package.json`, not at the root. Root `package.json` has no deps — it's workspace-only.
- New cross-surface Zod schemas go in `packages/types/src/schemas/` and are imported as `@health-agent/types`. Don't add new schemas to `apps/web/src/lib/schemas/`. (The legacy `release.ts` still lives there pending a migration; `profile.ts` already moved.)
- Test web after a structural change: `bun run type-check && bun run lint && bun run build` at root.
- Test mobile Metro resolution: `cd apps/mobile && node -e "require('./metro.config.js')"` (catches workspace-resolver breakage cheaply).
- Always use your ORM's migration utilities (e.g., Dizzle) to handle database changes. NEVER write or edit raw SQL files by hand when updating the schema.
  - ## Core Rules:
    1. **Always use CLI generators:** Always use generator to produce the migration.
    2. **Never hardcode SQL:** All database operations—including creating tables, altering tables, dropping tables, and defining relationships—must be written in TypeScript/JavaScript using drizzle-orm schema syntax. NEVER manually create, edit, or delete any .sql migration files. NEVER touch, modify, or inspect the meta/_journal.json file manually. Drizzle must manage this exclusively.
    3. **Rollbacks:** You are strictly forbidden from performing database rollbacks. If a schema change needs to be undone or corrected, you must write a new forward-fixing schema change in your TypeScript files and generate a new forward migration. You must never delete past migrations to "go back in time."
    4. **PRODUCTION:** Migrations should NEVER run on production environments. This task is solely performed by CI.

## Secrets & env

- For local dev, env lives at the **repo root** (`.env` / `.env.example`). direnv (`.envrc`) loads `.env` into the shell; subprocesses like `next dev` and `drizzle-kit` pick it up via `process.env`. Do not add `.env` / `.env.example` inside `apps/*` — keep them at the root only.
- Never commit real `.env` — only `.env.example`. Signing keys (`*.jks`, `*.p8`, `*.p12`) are gitignored.
- Vercel env vars apply to `apps/web` only. The "Root Directory" field in the Vercel dashboard **must be empty** — `vercel.json` handles the `cd apps/web`. Setting it to a subpath will compound and break builds.

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
