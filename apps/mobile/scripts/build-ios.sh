#!/usr/bin/env bash
# Build iOS release archive, export IPA, and upload to TestFlight.
# Requires:
#   - macOS with Xcode + active Apple Developer account (automatic signing)
#   - CocoaPods installed (pod install already run in ./ios)
#   - APP_STORE_CONNECT_API_KEY_ID, APP_STORE_CONNECT_ISSUER_ID env vars
#   - AuthKey_<APP_STORE_CONNECT_API_KEY_ID>.p8 placed at ~/.appstoreconnect/private_keys/

set -euo pipefail

cd "$(dirname "$0")/.."

WORKSPACE="ios/HealthAgent.xcworkspace"
SCHEME="HealthAgent"
ARCHIVE_PATH="./build/HealthAgent.xcarchive"
EXPORT_PATH="./build"

echo "==> Cleaning + archiving"
xcodebuild clean archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH"

echo "==> Exporting IPA"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist ios/ExportOptions.plist

echo "==> Uploading to TestFlight"
xcrun altool --upload-app \
  -f "$EXPORT_PATH/HealthAgent.ipa" \
  --type ios \
  --apiKey "$APP_STORE_CONNECT_API_KEY_ID" \
  --apiIssuer "$APP_STORE_CONNECT_ISSUER_ID"

echo "==> Done. Check App Store Connect for TestFlight processing status."
