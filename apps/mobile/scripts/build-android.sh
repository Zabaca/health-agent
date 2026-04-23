#!/usr/bin/env bash
# Build signed Android APK for sideloading.
# Requires:
#   - Android SDK installed + ANDROID_HOME set
#   - Release keystore configured in android/app/build.gradle
#   - Keystore password + alias available via env or gradle.properties

set -euo pipefail

cd "$(dirname "$0")/../android"

echo "==> Building release APK"
./gradlew assembleRelease

APK_PATH="app/build/outputs/apk/release/app-release.apk"
echo "==> Done. APK: apps/mobile/android/$APK_PATH"
