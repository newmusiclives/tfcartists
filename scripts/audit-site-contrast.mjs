#!/usr/bin/env node
/**
 * Whole-site contrast sweep, including authenticated admin pages.
 *
 * The existing auditor covers eight public pages. Most of this site is behind
 * a login - 57 of 179 routes are admin - and an unauthenticated visit to any
 * of them REDIRECTS to /login, which loads fine and passes. So the old sweep
 * could report a clean site having never rendered a single admin screen, which
 * is exactly where the unreadable numbers were reported.
 *
 * This logs in first, then verifies each page is the page it asked for. A
 * route that bounced to login is reported as NOT AUDITED, never as passing.
 *
 *   node scripts/audit-site-contrast.mjs
 *   node scripts/audit-site-contrast.mjs --shots        # save screenshots
 *   node scripts/audit-site-contrast.mjs --limit 40
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { EVAL } from "./lib/contrast-eval.mjs";

const BASE = process.env.BASE_URL || "http://localhost:3111";
const SHOTS = process.argv.includes("--shots");
const SHOT_DIR = "/tmp/tfc-site-shots";
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true });

// Real values for dynamic segments. Anything without one is skipped and
// REPORTED - a silently skipped route is indistinguishable from a passing one.
const DYNAMIC = {
  "/artists/[slug]": "/artists/copper-and-clay",
};

function routes() {
  const found = execSync('find src/app -name "page.tsx"', { encoding: "utf8" })
    .trim()
    .split("\n")
    .map((f) => f.replace("src/app", "").replace("/page.tsx", "") || "/")
    // Route groups like (marketing) are not part of the URL.
    .map((r) => r.replace(/\/\([^)]+\)/g, ""))
    .map((r) => r || "/");
  return [...new Set(found)].sort();
}

function readPassword() {
  try {
    const env = readFileSync(".env", "utf8");
    const m = env.match(/^ADMIN_PASSWORD=(.*)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

const all = routes();
const skipped = [];
const targets = [];
for (const r of all) {
  if (r.includes("[")) {
    if (DYNAMIC[r]) targets.push(DYNAMIC[r]);
    else skipped.push(r);
  } else {
    targets.push(r);
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();

// Audit a specific theme. The site defaults to dark, and `dark:` variants only
// apply when the root carries .dark - so the same markup can pass in one mode
// and be invisible in the other. Auditing only the default hides half the site.
const themeArg = process.argv.indexOf("--theme");
const THEME = themeArg > -1 ? process.argv[themeArg + 1] : "dark";
await context.addInitScript((t) => {
  try { localStorage.setItem("theme", t); } catch (e) {}
}, THEME);

// --- log in -----------------------------------------------------------------
const password = readPassword();
let loggedIn = false;
if (password) {
  try {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
    await page.fill('input[name="username"], input#username', "admin");
    await page.fill('input[name="password"], input#password', password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 60000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(1500);
    loggedIn = !page.url().includes("/login");
  } catch (e) {
    console.log(`  login threw: ${String(e).slice(0, 90)}`);
  }
}
console.log(
  `\n  login: ${loggedIn ? "OK (admin)" : "FAILED - admin pages cannot be audited"}`,
);
console.log(`  routes: ${targets.length} to visit, ${skipped.length} skipped\n`);

// --- sweep ------------------------------------------------------------------
const failures = [];
const notAudited = [];
let audited = 0;
let clean = 0;

for (const route of targets.slice(0, LIMIT)) {
  const url = BASE + route;
  let status = 0;
  try {
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    status = res?.status() ?? 0;
  } catch {
    notAudited.push({ route, why: "failed to load" });
    continue;
  }

  const landed = new URL(page.url()).pathname;
  if (landed !== route && (landed === "/login" || landed.startsWith("/login"))) {
    notAudited.push({ route, why: "redirected to login" });
    continue;
  }
  if (status >= 400) {
    notAudited.push({ route, why: `HTTP ${status}` });
    continue;
  }

  await page.waitForTimeout(400);
  let results = [];
  try {
    results = await page.evaluate(EVAL);
  } catch {
    notAudited.push({ route, why: "eval failed" });
    continue;
  }

  audited++;
  if (results.length === 0) {
    clean++;
  } else {
    failures.push({ route, results });
    if (SHOTS) {
      await page
        .screenshot({
          path: `${SHOT_DIR}/${route.replace(/[^\w]+/g, "_") || "root"}.png`,
          fullPage: false,
        })
        .catch(() => {});
    }
  }
  process.stdout.write(
    `\r  audited ${audited}/${targets.length}  failing ${failures.length}   `,
  );
}
process.stdout.write("\n");

// --- report -----------------------------------------------------------------
console.log(`\n  AUDITED : ${audited}`);
console.log(`  CLEAN   : ${clean}`);
console.log(`  FAILING : ${failures.length}`);

const totalIssues = failures.reduce((n, f) => n + f.results.length, 0);
console.log(`  ISSUES  : ${totalIssues}\n`);

if (failures.length) {
  console.log("  WORST PAGES");
  console.log("  " + "-".repeat(76));
  for (const f of failures
    .slice()
    .sort((a, b) => b.results.length - a.results.length)
    .slice(0, 25)) {
    const worst = Math.min(...f.results.map((r) => r.ratio));
    console.log(
      `   ${String(f.results.length).padStart(3)} issue(s)  worst ${worst.toFixed(2)}:1   ${f.route}`,
    );
  }

  // The same token pair usually causes failures on many pages at once, so
  // fixing by colour pair is far more efficient than fixing page by page.
  const pairs = new Map();
  for (const f of failures) {
    for (const r of f.results) {
      const key = `${r.color} on ${r.bg}`;
      const e = pairs.get(key) ?? { count: 0, ratio: r.ratio, sample: r.text, pages: new Set() };
      e.count++;
      e.ratio = Math.min(e.ratio, r.ratio);
      e.pages.add(f.route);
      pairs.set(key, e);
    }
  }
  console.log("\n  MOST COMMON FAILING COLOUR PAIRS");
  console.log("  " + "-".repeat(76));
  for (const [k, v] of [...pairs].sort((a, b) => b[1].count - a[1].count).slice(0, 20)) {
    console.log(
      `   ${String(v.count).padStart(4)}x  ${v.ratio.toFixed(2)}:1  ${v.pages.size} page(s)  ${k}`,
    );
    console.log(`          e.g. "${v.sample}"`);
  }

  writeFileSync(
    "/tmp/contrast-report.json",
    JSON.stringify(
      failures.map((f) => ({ route: f.route, results: f.results })),
      null,
      2,
    ),
  );
  console.log("\n  full detail: /tmp/contrast-report.json");
}

if (notAudited.length) {
  console.log(`\n  NOT AUDITED (${notAudited.length}) - these are NOT passes`);
  console.log("  " + "-".repeat(76));
  const byReason = new Map();
  for (const n of notAudited) {
    byReason.set(n.why, (byReason.get(n.why) ?? []).concat(n.route));
  }
  for (const [why, list] of byReason) {
    console.log(`   ${why}: ${list.length}`);
    for (const r of list.slice(0, 12)) console.log(`      ${r}`);
    if (list.length > 12) console.log(`      ... and ${list.length - 12} more`);
  }
}

if (skipped.length) {
  console.log(`\n  SKIPPED dynamic routes (no sample value): ${skipped.length}`);
  for (const s of skipped) console.log(`      ${s}`);
}

if (SHOTS) console.log(`\n  screenshots: ${SHOT_DIR}`);

await browser.close();
process.exit(
  (totalIssues > 0 || notAudited.length > 0) && process.argv.includes("--strict")
    ? 1
    : 0,
);
