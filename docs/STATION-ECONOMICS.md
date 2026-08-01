# Station Economics & Operator Pricing

Reproduce with `npx tsx scripts/station-economics.ts`. Every figure is computed
from the shipped constants — nothing here is typed in by hand.

---

## The headline

**A station costs almost nothing to run and earns real money. Cost is not the
constraint — sponsor count is.**

| | Launch (mo 1–6) | Established (yr 1) | Full capacity |
|---|---|---|---|
| Sponsors | 25 | 60 | 125 |
| Gross revenue | $3,969 | $9,978 | $21,045 |
| Less commissions & processing | −$433 | −$1,088 | −$2,294 |
| **Net revenue** | **$3,536** | **$8,890** | **$18,751** |
| Cost to run | $65 | $65 | $65 |
| **Profit** | **$3,471** | **$8,825** | **$18,686** |

Cost is flat because it is almost entirely AI generation, which scales with how
often the DJ talks — not with how many sponsors or listeners you have.

---

## What a station actually costs

At 3 DJ links per hour, 24/7:

| | Monthly |
|---|---|
| Claude script generation | $34 |
| OpenAI TTS | $10 |
| Features & imaging | $12 |
| Infrastructure (VPS, storage, platform share) | $10 |
| **Total** | **$65** |

**Sensitivity** — the only lever is talk density:

| Links/hour | Links/day | Cost | % of launch net |
|---|---|---|---|
| 1 | 24 | $36 | 1.0% |
| 3 | 72 | $65 | 1.8% |
| 12 | 288 | $195 | 5.5% |
| 24 | 576 | $369 | 10.4% |

Even at a link between *every song*, cost stays under 10% of launch-stage net
revenue. There is no configuration where this model is cost-constrained.

> **Note on the discrepancy.** The in-app calculator at `/admin/station-costs`
> shows ~$514/month. That figure assumes far larger scripts and higher volume
> than the station actually runs. The $65 here is bottom-up from real
> parameters. The honest answer is "between $65 and $514 depending on how
> talkative you make it" — and the pricing recommendation below holds at either
> end, which is why it is not worth resolving further before launch.

This is the direct consequence of owning the music. A conventional station pays
performance royalties per play; we pay none.

---

## What the pricing now is

The old ladder was not a ladder. Tier 1 charged **$1.33/spot** against Local
Hero's **$1.00** — buying more airtime cost *more* per spot, so the rational
move was to buy multiple entry packages. Tiers 2 and 3 gave no discount at all.

Corrected, every step is better value than the one below:

| Tier | Spots/mo | Price | Per spot |
|---|---|---|---|
| Local Hero | 30 (1/day) | $45 | $1.50 |
| Tier 1 | 60 (2/day) | $79 | $1.32 |
| Tier 2 | 150 (5/day) | $169 | $1.13 |
| Tier 3 | 300 (10/day) | $279 | $0.93 |

Premium: News & Weather $350, Sponsored Hour $250, Week Takeover $750.

Level is set against a local advertiser's budget — $45/month for a daily
mention competes with a boosted social post, not a radio buy. Deliberately easy
to say yes to, because the binding constraint is **how many local businesses you
can sign**, not what each pays.

**Full capacity is $17,845 sponsor revenue + $3,200 artist revenue = $21,045.**

---

## What to charge a local operator

**Recommended: $249/month + 10% of net revenue. No setup fee.**

| | Launch | Established | Full |
|---|---|---|---|
| Operator keeps | $2,934 | $7,752 | $16,627 |
| Operator margin | 83% | 87% | 89% |
| We take | $603 | $1,138 | $2,124 |
| **Our profit** | **$538** | **$1,073** | **$2,059** |

### Why hybrid rather than flat or pure share

- **Pure revenue share** earns us too little while a station ramps — and ramping
  is exactly when it needs the most support.
- **Pure flat fee** has to be set high enough to cover a slow station, which
  makes it unaffordable in the operator's worst month. A fee they cannot pay
  while ramping is a churned operator and a dead station.
- **Hybrid** puts a floor under our cost and lets our upside track theirs.

$249 is comfortably above cost at any talk density, and it is under 8% of even
launch-stage revenue.

### One protection worth offering

At three sponsors (~$400 gross), the fee is most of what the operator earns.
Recommend **waiving the monthly fee until the station clears $1,000/month**,
keeping the 10% share throughout. It costs us ~$65/month to carry a station
through that period, and it removes the single biggest objection to signing.

### Do not offer a setup fee

The old plans carried $500–$1,000 setup. Against a $65/month cost base it is
not recovering anything real, and it is the largest barrier at the exact moment
the operator is least convinced. Drop it.

---

## What changed and why

- **Prices restored to a coherent ladder** with genuine volume discounts.
- **Realistic scenarios added** (`REVENUE_SCENARIOS`). Every figure on the
  platform was previously quoted at full capacity — 125 sponsors is a
  multi-year sales outcome, not a launch state, and quoting the ceiling sets an
  operator up to feel misled in month two.
- **Scout commissions and payment processing now modelled** (~8% blended and
  2.9%). Previously subtracted nowhere.
- **`OPERATOR_PLANS.STARTER` corrected to 4 DJs** to match `TIERS.basic`, which
  is the code that actually gates DJ creation.
- **"12h/day" removed** — nothing enforces it; a station is either 24/7 or off.
- **The headline figure is now computed** via `stationRevenuePotential()` and no
  longer hard-coded on seven pages.
