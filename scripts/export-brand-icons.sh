#!/usr/bin/env bash
# Regenerate toolbar icons from public/brand/logo.png (macOS sips).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/brand/logo.png"
OUT="$ROOT/public/icons"
if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC — add your logo as public/brand/logo.png first."
  exit 1
fi
mkdir -p "$OUT"
for size in 16 32 48 128; do
  sips -z "$size" "$size" "$SRC" --out "$OUT/icon-${size}.png" >/dev/null
  echo "Wrote icon-${size}.png"
done
echo "Done. Run: npm run build"
