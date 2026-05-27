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
SCHEME="Veladon"
ARCHIVE_PATH="./build/Veladon.xcarchive"
EXPORT_PATH="./build"

echo "==> Cleaning + archiving"
xcodebuild clean archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -authenticationKeyPath "$HOME/.appstoreconnect/private_keys/AuthKey_${APP_STORE_CONNECT_API_KEY_ID}.p8" \
  -authenticationKeyID "$APP_STORE_CONNECT_API_KEY_ID" \
  -authenticationKeyIssuerID "$APP_STORE_CONNECT_ISSUER_ID" \
  -allowProvisioningUpdates \
  ENABLE_USER_SCRIPT_SANDBOXING=NO

echo "==> Exporting IPA"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist ios/ExportOptions.plist

# Export names the IPA after the Xcode product (HealthAgent); rename to the Veladon brand.
mv "$EXPORT_PATH/HealthAgent.ipa" "$EXPORT_PATH/Veladon.ipa"

echo "==> Uploading to TestFlight"
xcrun altool --upload-app \
  -f "$EXPORT_PATH/Veladon.ipa" \
  --type ios \
  --apiKey "$APP_STORE_CONNECT_API_KEY_ID" \
  --apiIssuer "$APP_STORE_CONNECT_ISSUER_ID"

echo "==> Done. Check App Store Connect for TestFlight processing status."
