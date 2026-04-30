# @health-agent/mobile

React Native / Expo bare-workflow app for HealthAgent.

- **Bundle ID**: `com.zabaca.healthagent`
- **Min iOS**: 16.0 · **Min Android**: 9 (SDK 28)
- **Expo SDK**: 52 (bare workflow — native `ios/` and `android/` committed)

## Dev

```bash
# from repo root
bun install

# from apps/mobile
bun run ios        # opens simulator
bun run android    # opens emulator
bun run start      # Metro bundler only
```

**Note:** Running `ios` requires `cd ios && pod install` first. Requires CocoaPods 1.15+.

## Release

### TestFlight (preview builds)

```bash
./scripts/build-ios.sh
```

Needs `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, and `AuthKey_<ID>.p8` at `~/.appstoreconnect/private_keys/`. Also fill in `ios/ExportOptions.plist` with the Zabaca team ID.

### Android APK (sideloading)

```bash
./scripts/build-android.sh
```

Needs release keystore configured (see `.env.example`).

### App Store / Play Store (production)

Use EAS Build:

```bash
eas build --profile production --platform ios     # → App Store via eas submit
eas build --profile production --platform android # → Play Store
```

### OTA hotfixes (JS-only)

```bash
eas update --branch preview       # TestFlight testers
eas update --branch production    # live App Store users
```

EAS Build is reserved for store releases to preserve the free tier. TestFlight builds use the local `build-ios.sh` script instead.

## Env vars

See `.env.example`. Mobile-specific — nothing from `apps/web/.env` is needed here.

`EXPO_PUBLIC_API_URL` — base URL of the web API. Defaults to `http://localhost:3000` (works for iOS simulator). Android emulator users should set `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`. For physical devices, use the Mac's LAN IP.

## Project structure

- `App.js` · `index.js` — entry points
- `app.json` — Expo config (bundle ID, splash, icons, HealthKit usage strings)
- `metro.config.js` — monorepo resolver (watches `packages/types`)
- `ios/`, `android/` — native projects (committed; regenerate with `bun run prebuild:clean`)
- `scripts/` — build pipelines
- `eas.json` — EAS Build + Update config
