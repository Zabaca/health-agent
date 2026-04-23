# @health-agent/types

Shared Zod schemas and types used across `apps/web` and `apps/mobile`.

## Current state

This package contains `profile` and `release` schemas copied from `apps/web/src/lib/schemas/*`. The web app has **not** yet been migrated to consume them from here — it still imports the originals. A follow-up ticket will redirect web imports to `@health-agent/types` and delete the duplicates.

The mobile app (`apps/mobile`) is the first consumer; all new cross-surface schemas should be added here.

## Usage

```ts
import { profileSchema, releaseSchema } from "@health-agent/types";
```

## Publishing

This is a workspace-local package (`"private": true`). Source TS is exported directly (`"main": "./src/index.ts"`) — consumers transpile it:

- `apps/web` — Next.js SWC via `next.config.mjs` `transpilePackages: ["@health-agent/types"]`
- `apps/mobile` — Metro via `metro.config.js` monorepo config (watchFolders + nodeModulesPaths)
