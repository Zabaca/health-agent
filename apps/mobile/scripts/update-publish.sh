#!/usr/bin/env bash
# Publish a SIGNED OTA hotfix to the production branch via EAS Update.
#
# JS/asset changes ONLY — native changes (pods, permissions, SDK, app config)
# need a new build + App Store review.
#
# The shipped binary embeds a code-signing certificate and therefore REQUIRES
# every update to be signed. This decrypts the sops-encrypted private key and
# passes it to `eas update` (which reads the cert + metadata from app.json and
# signs the manifest). The key lives in keys/ but eas defaults to certs/, so we
# pass --private-key-path explicitly.
#
# Requires:
#   - sops + the age identity (same one used for secrets.yaml / store.config)
#   - an authenticated EAS CLI (`npx eas-cli login`)
#   - .env.production present so the bundle ships the prod API URL, NOT localhost
#     (EXPO_PUBLIC_* is inlined at bundle time — verify the published bundle).
#
# ONE-TIME, before the first hotfix actually reaches devices: map the channel to
# the branch the binary listens on:
#   npx eas-cli channel:create production   # maps channel "production" -> branch "production"
#
# Usage: ./scripts/update-publish.sh -m "fix: <what changed>"

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f keys/private-key.pem.enc ]]; then
  echo "error: keys/private-key.pem.enc not found" >&2
  exit 1
fi

echo "==> Decrypting code-signing private key"
sops -d keys/private-key.pem.enc > keys/private-key.pem

echo "==> Publishing SIGNED update to branch: production"
npx eas-cli update \
  --branch production \
  --private-key-path keys/private-key.pem \
  "$@"

echo "==> Done. (keys/private-key.pem is gitignored; leaving it in place.)"
