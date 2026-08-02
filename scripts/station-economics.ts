/**
 * Print station economics and the operator offer.
 *
 * Backs docs/STATION-ECONOMICS.md, so the document can be regenerated rather
 * than maintained by hand - which is how the last set of figures went stale.
 *
 *   npx tsx scripts/station-economics.ts
 */
import {
  teamBreakdown,
  teamCostTotal,
  stationCost,
  stationEconomics,
  operatorOutcome,
  OPERATOR_OFFER,
  SCOUT_COMMISSION_BLENDED,
  PAYMENT_PROCESSING,
} from "../src/lib/calculations/operator-economics";
import { SPONSOR_PRICING, SPONSOR_AD_SPOTS } from "../src/lib/calculations/station-capacity";

const m = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const pad = (s: string | number, n: number) => String(s).padStart(n);

const SCENARIOS = ["LAUNCH", "ESTABLISHED", "FULL"] as const;

console.log("\n  STATION ECONOMICS");
console.log("  " + "=".repeat(76));

const c = stationCost(3);
console.log("\n  COST TO RUN ONE STATION  (24/7, 3 DJ links per hour)");
console.log(`    Claude scripts    ${pad(m(c.scripts), 8)}`);
console.log(`    OpenAI TTS        ${pad(m(c.tts), 8)}`);
console.log(`    features/imaging  ${pad(m(c.features), 8)}`);
console.log(`    infrastructure    ${pad(m(c.infrastructure), 8)}`);
console.log(`    subtotal          ${pad(m(c.total), 8)}`);
console.log(`    AI teams (5 jobs) ${pad(m(teamCostTotal()), 8)}`);
console.log(`    TRUE COST         ${pad(m(c.total + teamCostTotal()), 8)} / month`);

console.log("\n  WHAT EACH AI TEAM OWNS  (at full capacity)");
console.log(`    ${"team".padEnd(26)}${"kind".padEnd(10)}${pad("revenue", 9)}${pad("cost", 8)}`);
for (const t of teamBreakdown("FULL")) {
  console.log(`    ${t.name.padEnd(26)}${t.kind.padEnd(10)}${pad(m(t.revenue), 9)}${pad(m(t.monthlyCost), 8)}`);
}

console.log("\n  COST SENSITIVITY  (talk density is the only real lever)");
console.log(`    ${"links/hr".padEnd(10)}${pad("links/day", 11)}${pad("cost", 9)}`);
for (const vt of [1, 2, 3, 6, 12, 24]) {
  console.log(`    ${String(vt).padEnd(10)}${pad(vt * 24, 11)}${pad(m(stationCost(vt).total), 9)}`);
}

console.log("\n  SPONSOR LADDER  (each step better value than the one below)");
console.log(`    ${"tier".padEnd(12)}${pad("spots", 7)}${pad("price", 8)}${pad("$/spot", 9)}`);
for (const t of ["LOCAL_HERO", "TIER_1", "TIER_2", "TIER_3"] as const) {
  const spots = SPONSOR_AD_SPOTS[t];
  const price = SPONSOR_PRICING[t];
  console.log(`    ${t.padEnd(12)}${pad(spots, 7)}${pad(m(price), 8)}${pad("$" + (price / spots).toFixed(2), 9)}`);
}

console.log(
  `\n  REVENUE BY SCENARIO  (less ${(SCOUT_COMMISSION_BLENDED * 100).toFixed(0)}% commissions, ${(PAYMENT_PROCESSING * 100).toFixed(1)}% processing)`,
);
console.log(
  `    ${"scenario".padEnd(24)}${pad("sponsors", 9)}${pad("gross", 10)}${pad("net", 10)}${pad("cost", 7)}${pad("profit", 10)}`,
);
for (const s of SCENARIOS) {
  const e = stationEconomics(s);
  console.log(
    `    ${e.label.padEnd(24)}${pad(e.sponsors, 9)}${pad(m(e.grossRevenue), 10)}${pad(m(e.netRevenue), 10)}${pad(m(e.cost), 7)}${pad(m(e.profit), 10)}`,
  );
}

console.log(
  `\n  OPERATOR OFFER: ${m(OPERATOR_OFFER.monthlyFee)}/month + ${OPERATOR_OFFER.revenueSharePct}% of net, no setup fee`,
);
console.log(
  `    ${"scenario".padEnd(24)}${pad("op keeps", 11)}${pad("op margin", 11)}${pad("we take", 10)}${pad("our profit", 12)}`,
);
for (const s of SCENARIOS) {
  const o = operatorOutcome(s);
  console.log(
    `    ${o.label.padEnd(24)}${pad(m(o.operatorKeeps), 11)}${pad(o.operatorMarginPct.toFixed(0) + "%", 11)}${pad(m(o.platformTake), 10)}${pad(m(o.platformProfit), 12)}`,
  );
}

console.log(
  "\n  Recommend waiving the monthly fee until a station clears $1,000/month.\n" +
    "  Carrying it through that period costs us about $65/month and removes the\n" +
    "  biggest objection to signing.\n",
);
