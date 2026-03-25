#!/usr/bin/env bash
# build-native.sh — Build Next.js static export and sync to Capacitor native projects
set -euo pipefail

echo "==> Building Next.js production bundle..."
npm run build

echo "==> Generating static export..."
npx next export

echo "==> Syncing web assets to native projects..."
npx cap sync

echo ""
echo "Done! Open the native projects with:"
echo "  npx cap open ios"
echo "  npx cap open android"
