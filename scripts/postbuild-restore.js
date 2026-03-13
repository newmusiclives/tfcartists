/**
 * Postbuild Restore Script
 *
 * Moves large asset directories back into .next/static or the publish
 * directory after Next.js build so Netlify CDN can serve them.
 *
 * The prebuild-slim.js moved them to .tmp-large-assets/ to keep the
 * Next.js build output small. This script restores them to the publish
 * output so they're uploaded to the CDN.
 */

const fs = require("fs");
const path = require("path");

const STASH_DIR = path.join(process.cwd(), ".tmp-large-assets");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const LARGE_DIRS = ["audio", "team", "djs"];

function restoreDir(name) {
  const src = path.join(STASH_DIR, name);
  const dest = path.join(PUBLIC_DIR, name);

  if (!fs.existsSync(src)) {
    console.log(`[postbuild-restore] skip ${name} (not in stash)`);
    return;
  }

  // If dest already exists (shouldn't, but just in case), remove it
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  fs.renameSync(src, dest);
  console.log(`[postbuild-restore] restored .tmp-large-assets/${name} -> public/${name}`);
}

console.log("[postbuild-restore] Restoring large asset dirs to public/...");

for (const dir of LARGE_DIRS) {
  restoreDir(dir);
}

// Clean up empty stash dir
if (fs.existsSync(STASH_DIR)) {
  try { fs.rmdirSync(STASH_DIR); } catch {}
}

console.log("[postbuild-restore] Done. Assets will be uploaded to Netlify CDN.");
