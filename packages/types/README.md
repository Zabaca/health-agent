# @health-agent/types

Shared Zod schemas and types used across `apps/web` and `apps/mobile`.

## Current state

- **Profile schemas** — consumed by both web and mobile from here (single source of truth). The old `apps/web/src/lib/schemas/profile.ts` has been deleted.
- **Release schemas** — still duplicated at `apps/web/src/lib/schemas/release.ts` for now. Follow-up ticket will migrate those imports (~15 call sites) and delete the web-side copy.

All **new** cross-surface schemas should be added here, never in `apps/web/src/lib/schemas/`.

## Usage

```ts
import { profileSchema, releaseSchema } from "@health-agent/types";
```

## Publishing

This is a workspace-local package (`"private": true`). Source TS is exported directly (`"main": "./src/index.ts"`) — consumers transpile it:

- `apps/web` — Next.js SWC via `next.config.mjs` `transpilePackages: ["@health-agent/types"]`
- `apps/mobile` — Metro via `metro.config.js` monorepo config (watchFolders + nodeModulesPaths)
