/**
 * Prebuild Slim Script
 *
 * Moves large asset directories out of public/ before Next.js build
 * so the Netlify function handler stays under 250MB.
 *
 * Netlify CDN still serves these files because it uploads the publish
 * directory (which includes public/) separately from the function bundle.
 *
 * Dirs moved: public/audio (~138MB), public/team (~43MB), public/djs (~25MB)
 */

const fs = require("fs");
const path = require("path");

const STASH_DIR = path.join(process.cwd(), ".tmp-large-assets");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const LARGE_DIRS = ["audio", "team", "djs"];

function moveDir(name) {
  const src = path.join(PUBLIC_DIR, name);
  const dest = path.join(STASH_DIR, name);

  if (!fs.existsSync(src)) {
    console.log(`[prebuild-slim] skip ${name} (not found)`);
    return;
  }

  fs.mkdirSync(STASH_DIR, { recursive: true });

  // If dest already exists (from a previous build), remove it first
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  fs.renameSync(src, dest);
  console.log(`[prebuild-slim] moved public/${name} -> .tmp-large-assets/${name}`);
}

console.log("[prebuild-slim] Moving large asset dirs out of public/...");

for (const dir of LARGE_DIRS) {
  moveDir(dir);
}

console.log("[prebuild-slim] Done. Next.js build will have a slim public/ dir.");
