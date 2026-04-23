# App Store / Play Store Setup — HealthAgent

One-time configuration checklist for publishing the mobile app. Code-side scaffolding lives in `apps/mobile/`; the items below are console-side (Apple Developer portal, App Store Connect, Google Play Console).

## iOS / Apple

### App Store Connect

- [ ] Register bundle ID `com.zabaca.healthagent` under the Zabaca team in the Apple Developer portal
- [ ] Create the app record in App Store Connect (iOS + App Store distribution)
- [ ] Fill in App Information: privacy policy URL (e.g. `https://zabaca.com/privacy`), category, support URL
- [ ] Upload app icon (1024×1024, no alpha, no transparency)
- [ ] Upload required screenshots (6.7", 6.5", 5.5" — see Apple's current size matrix)
- [ ] Fill in App Privacy > Data Collection declarations:
  - Health & Fitness data (HealthKit read/write — NSHealthShareUsageDescription, NSHealthUpdateUsageDescription)
  - Contact Info (email, phone)
  - Identifiers (user account)
  - Usage Data (analytics, if any)
- [ ] Answer encryption export compliance (document non-exempt crypto if applicable)
- [ ] Set minimum iOS version to **16.0**
- [ ] Enable HealthKit entitlement on the App ID
- [ ] Generate App Store Connect API key; download `.p8`, store in 1Password/secrets vault
- [ ] Create TestFlight internal test group; invite Zabaca engineering + QA

### Local signing setup

- [ ] Sign into Apple Developer account in Xcode (Xcode → Settings → Accounts)
- [ ] Enable automatic signing for the `HealthAgent` target
- [ ] Fill in `apps/mobile/ios/ExportOptions.plist` with the real `teamID`
- [ ] Install CocoaPods 1.15+ (`sudo gem install cocoapods` or via Homebrew)

## Android / Google

### Play Console

- [ ] Create the app in Play Console with package name `com.zabaca.healthagent`
- [ ] Fill in store listing: description, icon, screenshots, category, privacy policy URL
- [ ] Declare Data Safety (mirror App Store Privacy declarations)
- [ ] Set minimum SDK to **28** (Android 9)
- [ ] Set up internal testing track
- [ ] Configure App Signing by Google Play (recommended) OR upload production keystore

### Local signing setup

- [ ] Generate release keystore once:
  ```
  keytool -genkey -v -keystore health-agent.keystore \
    -alias health-agent -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Store keystore in Zabaca secrets vault (NOT git)
- [ ] Add signing config to `apps/mobile/android/app/build.gradle` (inside `android { signingConfigs { … } buildTypes { release { … } } }`) referencing keystore via env / `~/.gradle/gradle.properties`
- [ ] Populate env from `apps/mobile/.env.example`:
  - `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`

## EAS (Expo Application Services)

- [ ] Log in: `eas login`
- [ ] Link project: `eas init` (writes `extra.eas.projectId` into `app.json`)
- [ ] Replace `https://u.expo.dev/FILL_IN_PROJECT_ID` in `app.json` with the real update URL
- [ ] Verify `eas.json` profiles (`preview`, `production`) match our OTA channel policy

## Release checklist (recurring)

Before every production submission:

- [ ] Bump `expo.version` in `app.json` (and `ios.buildNumber`, `android.versionCode` if needed)
- [ ] Run `./scripts/build-ios.sh` for TestFlight smoke testing
- [ ] Verify all HealthKit permission prompts trigger correctly
- [ ] Run through critical flows in TestFlight build
- [ ] Submit via EAS Build (`eas build --profile production --platform all`)
- [ ] Submit to stores (`eas submit --profile production --platform all`)
- [ ] Tag the release commit: `git tag v1.x.y`
