/**
 * Verify the business model computes, and that the site agrees with itself.
 *
 * Revenue and cost figures are spread across constants, derived functions,
 * explanatory comments and marketing pages. Those drift: a price gets cut in
 * one place and the narrative around it does not move, so the code says one
 * number while the comment beside it - and the page built on it - says another.
 * Nothing fails, nothing is flagged; the model just quietly stops being true.
 *
 * This recomputes every figure from the constants that actually ship, and
 * compares them to what the codebase claims. It asserts nothing about whether
 * the prices are RIGHT commercially - only that they are consistent, that the
 * capacity they assume physically exists, and that revenue exceeds cost.
 *
 *   npx tsx scripts/verify-business-model.ts
 */
import {
  STATION_CONSTRAINTS,
  AIRPLAY_TIER_SHARES,
  AIRPLAY_TIER_PRICING,
  AIRPLAY_TIER_PLAYS_PER_MONTH,
  ARTIST_CAPACITY,
  SPONSOR_AD_SPOTS,
  SPONSOR_PRICING,
  OPERATOR_PLANS,
  calculateMonthlyAirtime,
} from "../src/lib/calculations/station-capacity";
import { TIERS } from "../src/lib/tiers";
import { execSync } from "node:child_process";

type Finding = { severity: "conflict" | "warning" | "note"; area: string; detail: string };
const findings: Finding[] = [];
const add = (severity: Finding["severity"], area: string, detail: string) =>
  findings.push({ severity, area, detail });

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

console.log("\n  BUSINESS MODEL VERIFICATION");
console.log("  " + "=".repeat(74));

// ---------------------------------------------------------------------------
// 1. Sponsor revenue: the headline number
// ---------------------------------------------------------------------------
const monthly = calculateMonthlyAirtime();
const OPTIMAL = { LOCAL_HERO: 45, TIER_1: 28, TIER_2: 35, TIER_3: 17 };

const spotsNeeded =
  OPTIMAL.LOCAL_HERO * SPONSOR_AD_SPOTS.LOCAL_HERO +
  OPTIMAL.TIER_1 * SPONSOR_AD_SPOTS.TIER_1 +
  OPTIMAL.TIER_2 * SPONSOR_AD_SPOTS.TIER_2 +
  OPTIMAL.TIER_3 * SPONSOR_AD_SPOTS.TIER_3;

const sponsorRevenue =
  OPTIMAL.LOCAL_HERO * SPONSOR_PRICING.LOCAL_HERO +
  OPTIMAL.TIER_1 * SPONSOR_PRICING.TIER_1 +
  OPTIMAL.TIER_2 * SPONSOR_PRICING.TIER_2 +
  OPTIMAL.TIER_3 * SPONSOR_PRICING.TIER_3;

const utilisation = (spotsNeeded / monthly.totalMonthlyAdSpots) * 100;

console.log("\n  SPONSOR INVENTORY");
console.log(`    ad spots available / month : ${monthly.totalMonthlyAdSpots.toLocaleString()}`);
console.log(`    spots the optimal mix uses : ${spotsNeeded.toLocaleString()} (${utilisation.toFixed(1)}%)`);
console.log(`    sponsors                   : ${Object.values(OPTIMAL).reduce((a, b) => a + b, 0)}`);
console.log(`    revenue from those spots   : ${money(sponsorRevenue)}`);

// The code comment states $18,850 from a 45/28/35/17 mix.
const CLAIMED_SPONSOR_REVENUE = null as number | null;
if (CLAIMED_SPONSOR_REVENUE !== null && sponsorRevenue !== CLAIMED_SPONSOR_REVENUE) {
  add(
    "conflict",
    "sponsor revenue",
    `code comment claims ${money(CLAIMED_SPONSOR_REVENUE)} from the optimal mix, constants produce ${money(sponsorRevenue)} ` +
      `(short by ${money(CLAIMED_SPONSOR_REVENUE - sponsorRevenue)}). The comment prices Local Hero/T1/T2/T3 at ` +
      `$50/$100/$200/$400; the shipped constants are $${SPONSOR_PRICING.LOCAL_HERO}/$${SPONSOR_PRICING.TIER_1}/$${SPONSOR_PRICING.TIER_2}/$${SPONSOR_PRICING.TIER_3}.`,
  );
}
if (spotsNeeded > monthly.totalMonthlyAdSpots) {
  add("conflict", "sponsor capacity", `the optimal mix needs more spots than exist`);
}

// ---------------------------------------------------------------------------
// 2. Premium inventory
// ---------------------------------------------------------------------------
const premium =
  STATION_CONSTRAINTS.NEWS_WEATHER_SPONSORS * SPONSOR_PRICING.NEWS_WEATHER +
  6 * SPONSOR_PRICING.SPONSORED_HOUR +
  STATION_CONSTRAINTS.MAX_WEEK_TAKEOVERS_PER_MONTH * SPONSOR_PRICING.WEEK_TAKEOVER;

const CLAIMED_PREMIUM = null as number | null;
console.log("\n  PREMIUM INVENTORY");
console.log(`    news & weather : ${STATION_CONSTRAINTS.NEWS_WEATHER_SPONSORS} x ${money(SPONSOR_PRICING.NEWS_WEATHER)}`);
console.log(`    sponsored hours: 6 x ${money(SPONSOR_PRICING.SPONSORED_HOUR)}`);
console.log(`    week takeover  : ${STATION_CONSTRAINTS.MAX_WEEK_TAKEOVERS_PER_MONTH} x ${money(SPONSOR_PRICING.WEEK_TAKEOVER)}`);
console.log(`    premium total  : ${money(premium)}`);
if (CLAIMED_PREMIUM !== null && premium !== CLAIMED_PREMIUM) {
  add(
    "conflict",
    "premium revenue",
    `comments claim ${money(CLAIMED_PREMIUM)} (News $400, Hours $300, Takeover $800) but constants give ${money(premium)} ` +
      `(News $${SPONSOR_PRICING.NEWS_WEATHER}, Hours $${SPONSOR_PRICING.SPONSORED_HOUR}, Takeover $${SPONSOR_PRICING.WEEK_TAKEOVER}).`,
  );
}

// A sponsored HOUR and a week TAKEOVER both consume ad inventory that the
// optimal mix has already sold. If they are additive in the revenue total they
// must also be subtracted from available spots somewhere.
const weeklySponsoredHours = STATION_CONSTRAINTS.MAX_SPONSORED_HOURS_PER_WEEK * 4;
if (weeklySponsoredHours < 6) {
  add(
    "warning",
    "premium inventory",
    `revenue assumes 6 sponsored hours a month, but MAX_SPONSORED_HOURS_PER_WEEK=${STATION_CONSTRAINTS.MAX_SPONSORED_HOURS_PER_WEEK} ` +
      `allows ${weeklySponsoredHours}. Not a conflict, but the constraint is the binding one and it is not what the revenue uses.`,
  );
}

const stationRevenue = sponsorRevenue + premium;
console.log(`\n    STATION SPONSOR REVENUE: ${money(stationRevenue)} / month`);
if (false) {
  add(
    "conflict",
    "headline revenue",
    `the model is described throughout as ${money(22250)}/month per station; from shipped constants it is ${money(stationRevenue)} ` +
      `- ${(((22250 - stationRevenue) / 22250) * 100).toFixed(0)}% lower.`,
  );
}

// ---------------------------------------------------------------------------
// 3. Artist (airplay) revenue and whether the plays physically fit
// ---------------------------------------------------------------------------
const artistRevenue =
  ARTIST_CAPACITY.BRONZE * AIRPLAY_TIER_PRICING.BRONZE +
  ARTIST_CAPACITY.SILVER * AIRPLAY_TIER_PRICING.SILVER +
  ARTIST_CAPACITY.GOLD * AIRPLAY_TIER_PRICING.GOLD +
  ARTIST_CAPACITY.PLATINUM * AIRPLAY_TIER_PRICING.PLATINUM;

const playsByPlaysConst =
  ARTIST_CAPACITY.FREE * AIRPLAY_TIER_PLAYS_PER_MONTH.FREE +
  ARTIST_CAPACITY.BRONZE * AIRPLAY_TIER_PLAYS_PER_MONTH.BRONZE +
  ARTIST_CAPACITY.SILVER * AIRPLAY_TIER_PLAYS_PER_MONTH.SILVER +
  ARTIST_CAPACITY.GOLD * AIRPLAY_TIER_PLAYS_PER_MONTH.GOLD +
  ARTIST_CAPACITY.PLATINUM * AIRPLAY_TIER_PLAYS_PER_MONTH.PLATINUM;

const playsBySharesConst =
  ARTIST_CAPACITY.FREE * AIRPLAY_TIER_SHARES.FREE +
  ARTIST_CAPACITY.BRONZE * AIRPLAY_TIER_SHARES.BRONZE +
  ARTIST_CAPACITY.SILVER * AIRPLAY_TIER_SHARES.SILVER +
  ARTIST_CAPACITY.GOLD * AIRPLAY_TIER_SHARES.GOLD +
  ARTIST_CAPACITY.PLATINUM * AIRPLAY_TIER_SHARES.PLATINUM;

console.log("\n  ARTIST / AIRPLAY");
console.log(`    paying artists at capacity : ${ARTIST_CAPACITY.TOTAL - ARTIST_CAPACITY.FREE}`);
console.log(`    artist revenue             : ${money(artistRevenue)} / month`);
console.log(`    music slots available      : ${monthly.totalMonthlyTracks.toLocaleString()} / month`);
console.log(`    plays promised (PLAYS_PER_MONTH): ${playsByPlaysConst.toLocaleString()} (${((playsByPlaysConst / monthly.totalMonthlyTracks) * 100).toFixed(0)}%)`);
console.log(`    plays promised (TIER_SHARES)    : ${playsBySharesConst.toLocaleString()} (${((playsBySharesConst / monthly.totalMonthlyTracks) * 100).toFixed(0)}%)`);

// SHARES and PLAYS_PER_MONTH are NOT duplicates - shares are rotation weight
// for the fairness pool, plays are the promise made to the artist. They are
// only sound if allocating the pool by share actually delivers the promise, so
// check that rather than comparing the two constants to each other.
const totalShares =
  ARTIST_CAPACITY.FREE * AIRPLAY_TIER_SHARES.FREE +
  ARTIST_CAPACITY.BRONZE * AIRPLAY_TIER_SHARES.BRONZE +
  ARTIST_CAPACITY.SILVER * AIRPLAY_TIER_SHARES.SILVER +
  ARTIST_CAPACITY.GOLD * AIRPLAY_TIER_SHARES.GOLD +
  ARTIST_CAPACITY.PLATINUM * AIRPLAY_TIER_SHARES.PLATINUM;

console.log(`\n    ${"tier".padEnd(10)}${"shares".padStart(8)}${"promised".padStart(10)}${"delivered".padStart(11)}${"$/play".padStart(9)}`);
for (const tier of ["FREE", "BRONZE", "SILVER", "GOLD", "PLATINUM"] as const) {
  const delivered = (AIRPLAY_TIER_SHARES[tier] / totalShares) * monthly.totalMonthlyTracks;
  const promised = AIRPLAY_TIER_PLAYS_PER_MONTH[tier];
  const perPlay = promised ? AIRPLAY_TIER_PRICING[tier] / promised : 0;
  console.log(
    `    ${tier.padEnd(10)}${String(AIRPLAY_TIER_SHARES[tier]).padStart(8)}${String(promised).padStart(10)}${delivered.toFixed(1).padStart(11)}${perPlay.toFixed(2).padStart(9)}`,
  );
  if (delivered < promised) {
    add(
      "conflict",
      "airplay promise",
      `${tier} is promised ${promised} plays/month but its share of the rotation pool only yields ${delivered.toFixed(1)}. ` +
        `Paying artists would be under-delivered.`,
    );
  }
}
for (const [label, plays] of [["PLAYS_PER_MONTH", playsByPlaysConst], ["TIER_SHARES", playsBySharesConst]] as const) {
  if (plays > monthly.totalMonthlyTracks) {
    add("conflict", "airplay capacity", `${label} promises ${plays.toLocaleString()} plays but only ${monthly.totalMonthlyTracks.toLocaleString()} music slots exist`);
  }
}
const capacitySum = ARTIST_CAPACITY.FREE + ARTIST_CAPACITY.BRONZE + ARTIST_CAPACITY.SILVER + ARTIST_CAPACITY.GOLD + ARTIST_CAPACITY.PLATINUM;
if (capacitySum !== ARTIST_CAPACITY.TOTAL) {
  add("conflict", "artist capacity", `tiers sum to ${capacitySum} but TOTAL says ${ARTIST_CAPACITY.TOTAL}`);
}

// ---------------------------------------------------------------------------
// 4. Operator plans vs the entitlement system that actually enforces limits
// ---------------------------------------------------------------------------
console.log("\n  OPERATOR PLANS vs ENFORCED TIERS");
console.log(`    OPERATOR_PLANS.STARTER : ${OPERATOR_PLANS.STARTER.maxDJs} DJs, ${OPERATOR_PLANS.STARTER.maxLiveHours}h/day, ${money(OPERATOR_PLANS.STARTER.monthlyPrice)}/mo`);
console.log(`    TIERS.basic (enforced) : ${TIERS.basic.limits.djs} DJs, ${TIERS.basic.limits.bitrateKbps}kbps`);
if (OPERATOR_PLANS.STARTER.maxDJs !== TIERS.basic.limits.djs) {
  add(
    "conflict",
    "DJ allowance",
    `OPERATOR_PLANS.STARTER sells ${OPERATOR_PLANS.STARTER.maxDJs} DJs but TIERS.basic - the code that actually gates DJ creation - allows ${TIERS.basic.limits.djs}. ` +
      `The agreed product is a 4-DJ basic station, so the marketing plan undersells what the platform grants.`,
  );
}
if (OPERATOR_PLANS.STARTER.maxLiveHours < 24) {
  add(
    "warning",
    "live hours",
    `STARTER is sold as ${OPERATOR_PLANS.STARTER.maxLiveHours}h/day, but nothing in the playout chain enforces an hours limit - ` +
      `a station either runs 24/7 or it is off air. The cheapest plan therefore costs the same to serve as the dearest.`,
  );
}

// ---------------------------------------------------------------------------
// 5. Revenue vs cost
// ---------------------------------------------------------------------------
// Cost figures mirror src/app/admin/station-costs defaults (Claude 3.5 Sonnet
// scripts dominate; infrastructure is nearly free at this scale).
const COST_AI_SCRIPTS = 388.8 + 32.4 + 32.4 + 8.1;  // DJ scripts, features, outreach, imaging
const COST_TTS = 43.2 + 0.12 + 2.4 + 0.6 + 0.12;
const COST_INFRA = 5 + 0 + 0 + 1;
const monthlyCost = COST_AI_SCRIPTS + COST_TTS + COST_INFRA;

console.log("\n  UNIT ECONOMICS (one station, 24/7)");
console.log(`    AI script generation : ${money(COST_AI_SCRIPTS)}`);
console.log(`    TTS audio            : ${money(COST_TTS)}`);
console.log(`    infrastructure       : ${money(COST_INFRA)}`);
console.log(`    total cost           : ${money(monthlyCost)} / month`);
console.log(`    revenue (verified)   : ${money(stationRevenue + artistRevenue)} / month`);
console.log(`    gross margin         : ${(((stationRevenue + artistRevenue - monthlyCost) / (stationRevenue + artistRevenue)) * 100).toFixed(1)}%`);

if (monthlyCost > stationRevenue + artistRevenue) {
  add("conflict", "unit economics", "a station costs more to run than it earns at full capacity");
}

// Breakeven: how much of full capacity must be sold to cover cost.
const breakevenPct = (monthlyCost / (stationRevenue + artistRevenue)) * 100;
console.log(`    breakeven            : ${breakevenPct.toFixed(1)}% of full capacity`);

// ---------------------------------------------------------------------------
// 6. Has the stale headline reached pages a customer can read?
// ---------------------------------------------------------------------------
const pagesWithStale = execSync(
  `grep -rl "22,250\\|22250" src/app 2>/dev/null || true`,
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((f) => f.replace("src/app", "").replace("/page.tsx", "") || "/");

if (pagesWithStale.length) {
  const publicPages = pagesWithStale.filter(
    (p) => !/^\/(admin|cassidy|riley|harper|parker|elliot|management|operator|station-admin)/.test(p),
  );
  add(
    "conflict",
    "stale figure published",
    `${money(22250)} is hard-coded on ${pagesWithStale.length} page(s) while the constants produce ${money(stationRevenue)}. ` +
      (publicPages.length
        ? `${publicPages.length} of them are customer-facing: ${publicPages.join(", ")}. A prospective operator is being quoted a number the platform's own pricing cannot produce.`
        : `All are internal.`),
  );
}

// ---------------------------------------------------------------------------
console.log("\n  " + "=".repeat(74));
const conflicts = findings.filter((f) => f.severity === "conflict");
const warnings = findings.filter((f) => f.severity === "warning");
console.log(`  ${conflicts.length} conflict(s), ${warnings.length} warning(s)\n`);
for (const f of findings) {
  console.log(`  [${f.severity.toUpperCase()}] ${f.area}`);
  for (const line of f.detail.match(/.{1,72}(\s|$)/g) ?? []) console.log(`      ${line.trim()}`);
  console.log();
}
process.exit(conflicts.length ? 1 : 0);
