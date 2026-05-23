#!/usr/bin/env bash
# Fail if common secrets would be committed.
set -euo pipefail
cd "$(dirname "$0")/.."

fail() {
  echo "verify-safe-to-publish: $1" >&2
  exit 1
}

[[ -f .env.local ]] && git check-ignore -q .env.local 2>/dev/null || fail ".env.local must be gitignored"
[[ -f client_secret.json ]] && fail "Remove client_secret.json from project root"

if compgen -G 'client_secret*.json' >/dev/null 2>&1; then
  fail "Remove client_secret*.json files"
fi

if grep -rE 'GOCSPX-|VITE_GOOGLE_WEB_CLIENT_SECRET=[^[:space:]]' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=backups . 2>/dev/null; then
  fail "Possible client secret in source tree"
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git ls-files --error-unmatch .env.local backups/ dist/ 2>/dev/null; then
    fail "Sensitive paths are tracked by git"
  fi
fi

echo "verify-safe-to-publish: OK"
