#!/usr/bin/env bash
# Push the App Store listing metadata to App Store Connect via EAS Metadata.
#
# store.config.json holds the reviewer demo credentials, so only the
# sops-encrypted store.config.enc.json is committed. This decrypts it to the
# gitignored plaintext that `eas metadata:push` reads, then pushes.
#
# Requires: sops + the age identity (same one used for secrets.yaml), and an
# authenticated EAS CLI (`npx eas-cli login`).
#
# After editing the listing copy, re-encrypt with:
#   sops -e apps/mobile/store.config.json > apps/mobile/store.config.enc.json
# (run from the repo root so .sops.yaml picks the right recipients).

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f store.config.enc.json ]]; then
  echo "error: store.config.enc.json not found" >&2
  exit 1
fi

echo "==> Decrypting store.config.enc.json"
sops -d store.config.enc.json > store.config.json

echo "==> Pushing metadata to App Store Connect"
npx eas-cli metadata:push --profile production "$@"

echo "==> Done. (Plaintext store.config.json is gitignored; leaving it in place.)"
