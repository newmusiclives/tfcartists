#!/usr/bin/env node
/**
 * Tailwind-aware WCAG contrast audit.
 *
 * The site is forced into dark mode (`<html className="dark">`) but carries
 * light-theme sections and light-theme text utilities left over from earlier
 * theme changes. This finds elements where a text colour and a background colour
 * appear on the SAME element and do not meet WCAG AA.
 *
 * Same-element pairs only: that is provable from the source. Inherited
 * backgrounds from ancestors need a DOM to resolve and are not guessed at here.
 *
 *   node scripts/check-contrast.mjs            # report
 *   node scripts/check-contrast.mjs --strict   # exit 1 on failures (CI)
 *   node scripts/check-contrast.mjs --fix-list # emit machine-readable list
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

// Tailwind v3 default palette for the families this codebase uses.
const PALETTE = {
  white: { "": "#ffffff" },
  black: { "": "#000000" },
  gray: {
    50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af",
    500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827", 950: "#030712",
  },
  zinc: {
    50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa",
    500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b",
  },
  slate: {
    50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8",
    500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617",
  },
  neutral: {
    50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3",
    500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717", 950: "#0a0a0a",
  },
  stone: {
    50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e",
    500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09",
  },
  amber: {
    50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24",
    500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03",
  },
  orange: {
    50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c",
    500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407",
  },
  green: {
    50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80",
    500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16",
  },
  red: {
    50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171",
    500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a",
  },
  blue: {
    50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
    500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554",
  },
  purple: {
    50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc",
    500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764",
  },
  rose: {
    50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185",
    500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519",
  },
};

const FAMILIES = Object.keys(PALETTE).join("|");
// The optional /NN group matters: bg-amber-500/10 is a 10% wash over the page,
// not a solid amber fill. Reading those as solid produces false failures.
const TEXT_RE = new RegExp(`(?<![\\w-])text-(${FAMILIES})(?:-(\\d{2,3}))?(?:\\/(\\d{1,3}))?(?![\\w-])`, "g");
const BG_RE = new RegExp(`(?<![\\w-])bg-(${FAMILIES})(?:-(\\d{2,3}))?(?:\\/(\\d{1,3}))?(?![\\w-])`, "g");

// The app forces dark mode (<html className="dark">), so --background is the
// surface translucent fills composite over.
const PAGE_SURFACE = "#0a0a0b";

function mix(hex, alpha, baseHex) {
  const parse = (h) => [0, 2, 4].map((i) => parseInt(h.replace("#", "").slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(baseHex);
  const out = [[r1, r2], [g1, g2], [b1, b2]].map(([c, b]) =>
    Math.round(c * alpha + b * (1 - alpha))
  );
  return "#" + out.map((c) => c.toString(16).padStart(2, "0")).join("");
}

function resolve(family, shade, opacity) {
  const group = PALETTE[family];
  if (!group) return null;
  const base = group[shade ?? ""] ?? group[shade] ?? null;
  if (!base) return null;
  if (opacity === undefined) return base;
  return mix(base, Number(opacity) / 100, PAGE_SURFACE);
}

function luminance(hex) {
  const v = hex.replace("#", "");
  const parts = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const [r, g, b] = parts.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Large text (>=24px or >=19px bold) only needs 3:1. */
function targetFor(cls) {
  const big = /text-(2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/.test(cls);
  const semiBig = /text-(lg|xl)/.test(cls) && /font-(bold|semibold|extrabold|black)/.test(cls);
  return big || semiBig ? 3.0 : 4.5;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const failures = [];
let pairsChecked = 0;

for (const file of walk(SRC)) {
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");

  // Each className string is one element's styling
  for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const cls = match[1] ?? match[2] ?? "";
    if (cls.includes("contrast-ok")) continue;

    const texts = [...cls.matchAll(TEXT_RE)];
    const bgs = [...cls.matchAll(BG_RE)];
    if (!texts.length || !bgs.length) continue;

    // dark: variants apply on a different surface; only compare same-variant pairs
    const plainText = texts.filter((t) => !isVariant(cls, t.index));
    const plainBg = bgs.filter((b) => !isVariant(cls, b.index));
    if (!plainText.length || !plainBg.length) continue;

    const fg = resolve(plainText[0][1], plainText[0][2], plainText[0][3]);
    const bg = resolve(plainBg[0][1], plainBg[0][2], plainBg[0][3]);
    if (!fg || !bg) continue;

    pairsChecked++;
    const target = targetFor(cls);
    const r = ratio(fg, bg);
    if (r < target) {
      const line = lines.findIndex((l) => l.includes(match[0].slice(0, 60))) + 1;
      failures.push({
        file: relative(ROOT, file),
        line: line || 0,
        fg: `text-${plainText[0][1]}${plainText[0][2] ? "-" + plainText[0][2] : ""}${plainText[0][3] ? "/" + plainText[0][3] : ""}`,
        bg: `bg-${plainBg[0][1]}${plainBg[0][2] ? "-" + plainBg[0][2] : ""}${plainBg[0][3] ? "/" + plainBg[0][3] : ""}`,
        ratio: r,
        target,
      });
    }
  }
}

/** Is the utility at this index prefixed by a variant like dark: or hover:? */
function isVariant(cls, index) {
  const before = cls.slice(0, index);
  const lastSpace = before.lastIndexOf(" ");
  const token = before.slice(lastSpace + 1);
  return token.includes(":");
}

if (process.argv.includes("--fix-list")) {
  console.log(JSON.stringify(failures, null, 2));
} else {
  console.log(`\n  Checked ${pairsChecked} same-element text/background pairs`);
  console.log(`  ${failures.length} below WCAG AA\n`);
  const grouped = {};
  for (const f of failures) {
    const key = `${f.fg} on ${f.bg}`;
    grouped[key] = grouped[key] || { count: 0, ratio: f.ratio, target: f.target, files: new Set() };
    grouped[key].count++;
    grouped[key].files.add(f.file);
  }
  const rows = Object.entries(grouped).sort((a, b) => a[1].ratio - b[1].ratio);
  console.log(`  ${"Combination".padEnd(42)} ${"Ratio".padStart(7)} ${"Need".padStart(5)} ${"Uses".padStart(5)}`);
  console.log("  " + "-".repeat(72));
  for (const [combo, info] of rows) {
    console.log(
      `  ${combo.padEnd(42)} ${info.ratio.toFixed(2).padStart(7)} ${info.target.toFixed(1).padStart(5)} ${String(info.count).padStart(5)}`
    );
  }
  console.log(
    "\n  NOTE: same-element pairs only. Text whose background comes from an" +
    "\n  ancestor needs a rendered DOM to audit and is not covered here."
  );
}

if (failures.length && process.argv.includes("--strict")) process.exit(1);
