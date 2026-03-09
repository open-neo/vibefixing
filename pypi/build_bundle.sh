#!/usr/bin/env bash
# Build the Node.js CLI and bundle it into the Python package.
# Run from the repository root or from pypi/.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUNDLE_DIR="$REPO_ROOT/pypi/vibefixing_wrapper/_bundled"

echo "==> Building Node.js CLI..."
(cd "$REPO_ROOT" && pnpm build)

echo "==> Preparing bundle directory..."
rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR/dist/bin"

echo "==> Copying artefacts..."
cp "$REPO_ROOT/dist/bin/vibefixing.js" "$BUNDLE_DIR/dist/bin/vibefixing.js"
cp -r "$REPO_ROOT/skills" "$BUNDLE_DIR/skills"

# Minimal package.json so upgrade.ts can read the version
node -e "
  const pkg = require('$REPO_ROOT/package.json');
  const fs = require('fs');
  fs.writeFileSync(
    '$BUNDLE_DIR/package.json',
    JSON.stringify({ name: pkg.name, version: pkg.version }, null, 2) + '\n'
  );
"

echo "==> Bundle ready at $BUNDLE_DIR"
