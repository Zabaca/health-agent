#!/usr/bin/env bash
# Run Maestro E2E flows against a booted iOS Simulator.
#
# Usage:
#   ./scripts/e2e.sh                       # run the whole suite (.maestro)
#   ./scripts/e2e.sh flows/smoke.yaml      # run a single flow
#   ./scripts/e2e.sh --include-tags smoke  # run flows by tag
#
# Credentials for login-gated flows are read from .maestro/.env (see
# .maestro/.env.example) and forwarded to Maestro as -e KEY=VALUE.
#
# Prereqs: Maestro CLI (`brew install mobile-dev-inc/tap/maestro`), and the app
# already built + installed on a booted simulator (`bun run ios`).
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v maestro >/dev/null 2>&1; then
  echo "error: maestro not found. Install with:" >&2
  echo "  brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro" >&2
  exit 1
fi

# Load .maestro/.env (if present) and turn each non-comment line into a
# `-e KEY=VALUE` argument for Maestro.
env_args=()
env_file=".maestro/.env"
if [[ -f "$env_file" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    env_args+=("-e" "$line")
  done < "$env_file"
fi

# Default target: the whole workspace. Override by passing a flow path/flags.
target=".maestro"
extra=()
if [[ $# -gt 0 ]]; then
  case "$1" in
    -*) extra=("$@") ;;       # flags only (e.g. --tags smoke) → keep default target
    *)  target="$1"; shift; extra=("$@") ;;
  esac
fi

set -x
exec maestro test "${env_args[@]}" "${extra[@]}" "$target"
