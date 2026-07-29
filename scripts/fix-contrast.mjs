#!/usr/bin/env node
/**
 * Repair failing Tailwind contrast pairs found by check-contrast.mjs.
 *
 * Scoped edits only: a className string is rewritten only when it contains BOTH
 * the text and background utility, so `bg-amber-600` elsewhere (paired with dark
 * text, where it is fine) is never touched.
 *
 * Strategy per failing pair:
 *   - light text on a chromatic fill  -> step the FILL darker until it passes
 *   - anything else                   -> step the TEXT away from the background
 *
 * Every candidate is re-measured before being accepted; if no shade in the
 * family passes, the pair is reported as unresolved rather than guessed at.
 *
 *   node scripts/fix-contrast.mjs           # dry run
 *   node scripts/fix-contrast.mjs --write   # apply
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const WRITE = process.argv.includes("--write");

const PALETTE = JSON.parse(readFileSync(join(ROOT, "scripts/tw-palette.json"), "utf8"));
const SURFACE_FAMILIES = new Set(["gray", "zinc", "neutral", "slate", "stone", "white", "black"]);
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const PAGE_SURFACE = "#0a0a0b";

const FAMILIES = Object.keys(PALETTE).join("|");
const UTIL = (kind) =>
  new RegExp(`(?<![\\w-])${kind}-(${FAMILIES})(?:-(\\d{2,3}))?(?:\\/(\\d{1,3}))?(?![\\w-])`, "g");

function mix(hex, alpha, base) {
  const p = (h) => [0, 2, 4].map((i) => parseInt(h.replace("#", "").slice(i, i + 2), 16));
  const [r1, g1, b1] = p(hex), [r2, g2, b2] = p(base);
  return "#" + [[r1, r2], [g1, g2], [b1, b2]]
    .map(([c, b]) => Math.round(c * alpha + b * (1 - alpha)).toString(16).padStart(2, "0"))
    .join("");
}

function resolve(family, shade, opacity) {
  const group = PALETTE[family];
  if (!group) return null;
  const base = group[shade ?? ""] ?? group[shade] ?? null;
  if (!base) return null;
  return opacity === undefined ? base : mix(base, Number(opacity) / 100, PAGE_SURFACE);
}

const lum = (hex) => {
  const c = [0, 2, 4].map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const targetFor = (cls) =>
  /text-(2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/.test(cls) ||
  (/text-(lg|xl)/.test(cls) && /font-(bold|semibold|extrabold|black)/.test(cls))
    ? 3.0 : 4.5;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e.startsWith(".")) continue;
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else if (/\.(tsx|jsx)$/.test(e)) out.push(f);
  }
  return out;
}

const isVariant = (cls, index) => {
  const before = cls.slice(0, index);
  return before.slice(before.lastIndexOf(" ") + 1).includes(":");
};

const changes = [];
const unresolved = [];

for (const file of walk(SRC)) {
  let source = readFileSync(file, "utf8");
  let fileChanged = false;

  const classNames = [...source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)];

  for (const m of classNames) {
    const original = m[1] ?? m[2] ?? "";
    if (original.includes("contrast-ok")) continue;

    const texts = [...original.matchAll(UTIL("text"))].filter((t) => !isVariant(original, t.index));
    const bgs = [...original.matchAll(UTIL("bg"))].filter((b) => !isVariant(original, b.index));
    if (!texts.length || !bgs.length) continue;

    const t = texts[0], b = bgs[0];
    const fg = resolve(t[1], t[2], t[3]);
    const bg = resolve(b[1], b[2], b[3]);
    if (!fg || !bg) continue;

    const target = targetFor(original);
    if (ratio(fg, bg) >= target) continue;

    const textIsLight = t[1] === "white" || (t[2] && Number(t[2]) <= 200);
    const bgIsChromatic = !SURFACE_FAMILIES.has(b[1]);

    let replacement = null;

    if (textIsLight && bgIsChromatic && b[3] === undefined) {
      // Darken the fill; keep the hue so branding survives
      for (const shade of SHADES.filter((s) => s > Number(b[2] ?? 500))) {
        const candidate = resolve(b[1], shade, undefined);
        if (candidate && ratio(fg, candidate) >= target) {
          replacement = { from: b[0], to: `bg-${b[1]}-${shade}`, why: "fill darkened" };
          break;
        }
      }
    }

    if (!replacement) {
      // Move the text away from the background luminance, but only as far as
      // needed. Jumping straight to the extreme shade passes the check and
      // destroys the visual hierarchy, so walk out from the current shade and
      // take the FIRST shade that passes.
      const bgLight = lum(bg) > 0.18;
      const family = t[1] === "white" || t[1] === "black" ? (bgIsChromatic ? b[1] : "gray") : t[1];
      const current = t[2] ? Number(t[2]) : (t[1] === "white" ? 50 : 950);
      const ordered = bgLight
        ? SHADES.filter((s) => s > current)                 // darken, nearest first
        : SHADES.filter((s) => s < current).reverse();      // lighten, nearest first
      for (const shade of ordered) {
        const candidate = resolve(family, shade, undefined);
        if (candidate && ratio(candidate, bg) >= target) {
          replacement = { from: t[0], to: `text-${family}-${shade}`, why: "text adjusted" };
          break;
        }
      }
    }

    if (!replacement) {
      unresolved.push({ file: relative(ROOT, file), cls: original.slice(0, 70) });
      continue;
    }

    const updated = original.replace(replacement.from, replacement.to);
    if (updated === original) continue;

    const oldFull = m[0];
    const newFull = oldFull.replace(original, updated);
    source = source.replace(oldFull, newFull);
    fileChanged = true;
    changes.push({
      file: relative(ROOT, file),
      from: replacement.from,
      to: replacement.to,
      why: replacement.why,
    });
  }

  if (fileChanged && WRITE) writeFileSync(file, source);
}

const grouped = {};
for (const c of changes) {
  const key = `${c.from} -> ${c.to}  (${c.why})`;
  grouped[key] = (grouped[key] || 0) + 1;
}
console.log(`\n  ${WRITE ? "APPLIED" : "DRY RUN"} - ${changes.length} className edits\n`);
for (const [k, n] of Object.entries(grouped).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}x  ${k}`);
}
if (unresolved.length) {
  console.log(`\n  ${unresolved.length} unresolved (no passing shade in family):`);
  for (const u of unresolved.slice(0, 10)) console.log(`    ${u.file}: ${u.cls}`);
}
if (!WRITE) console.log("\n  Re-run with --write to apply.");
