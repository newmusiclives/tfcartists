/**
 * Stamp Service Worker with build timestamp
 *
 * Replaces __BUILD_TIMESTAMP__ in public/sw.js so each deploy
 * gets a unique cache name, forcing the browser to re-fetch assets.
 */

const fs = require("fs");
const path = require("path");

const SW_PATH = path.join(process.cwd(), "public", "sw.js");
const timestamp = Date.now().toString(36);

const content = fs.readFileSync(SW_PATH, "utf-8");
const stamped = content.replace(/__BUILD_TIMESTAMP__/g, timestamp);
fs.writeFileSync(SW_PATH, stamped, "utf-8");

console.log(`[stamp-sw] Cache version set to: tfr-cache-${timestamp}`);
