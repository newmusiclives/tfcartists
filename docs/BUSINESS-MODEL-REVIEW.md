# Business Model Review

Run `npx tsx scripts/verify-business-model.ts` to reproduce every figure here.
It recomputes the model from the constants that actually ship and fails (exit 1)
if the site stops agreeing with itself.

**Scope.** This checks that the model is *internally consistent*, that the
capacity it assumes *physically exists*, and that revenue *exceeds cost*. It
does not judge whether the prices are right commercially — that is a market
question, not a code question.

---

## Verdict

The model works. Capacity is real, the airplay ladder is sound, and the margin
is very large. But **the revenue narrative is stale by about 27%**, and that
stale number is on five customer-facing pages.

| | Claimed | Actually computes | Gap |
|---|---|---|---|
| Sponsor revenue (optimal mix) | $18,850 | **$13,940** | −$4,910 |
| Premium inventory | $3,400 | **$2,400** | −$1,000 |
| **Station total** | **$22,250** | **$16,340** | **−27%** |

The cause is a price cut that was applied to the constants but never to the
story around them. The comments describe Local Hero / T1 / T2 / T3 at
$50/$100/$200/$400; the shipped prices are $30/$80/$150/$300. Same for premium:
comments say News $400, Sponsored Hour $300, Takeover $800; the constants are
$300/$200/$600.

Nothing is broken — the site just quotes a number its own pricing cannot produce.

---

## What is sound

**Sponsor capacity is real.** The optimal mix of 125 sponsors needs 13,380 ad
spots against 17,280 available — 77.4% utilisation, leaving genuine headroom.
The arithmetic in the capacity model is correct; only the prices attached to it
are stale.

**The airplay ladder is well designed and deliberately conservative.** Shares
are rotation weight; plays-per-month is the promise. Allocating the pool by
share over-delivers on every tier:

| Tier | Shares | Promised | Delivered | $/play |
|---|---|---|---|---|
| Free | 1 | 1 | 1.2 | — |
| Bronze | 5 | 5 | 5.9 | $1.00 |
| Silver | 30 | 20 | 35.6 | $0.75 |
| Gold | 100 | 65 | 118.7 | $0.62 |
| Platinum | 250 | 250 | 296.7 | $0.40 |

Promising less than you deliver is the right way round, and cost-per-play
improves monotonically with tier, so there is no rung where upgrading is bad
value. Total demand is 7,280 plays against 8,640 slots — it fits.

**Margin is not the constraint.** A 24/7 station costs about **$514/month**, of
which $462 is Claude script generation and only $6 is infrastructure. Against
$19,540 of revenue at full capacity that is a **97.4% gross margin**, and
breakeven is **2.6% of capacity** — roughly three Local Hero sponsors. Even a
station selling almost nothing is profitable. This is the direct consequence of
owning the music: no per-play licensing.

---

## Conflicts to resolve

**1. The $22,250 headline is published.** Hard-coded on 7 pages, 5 of them
customer-facing: `/docs`, `/capacity`, `/station`, `/revenue/projections`,
`/revenue`. A prospective operator is being quoted revenue the platform's own
pricing cannot produce. This is the one with real commercial consequence — fix
before any operator sees it.

*Decision needed:* raise prices back to the $50/$100/$200/$400 ladder, or
restate the model at $16,340. Both are defensible; $16,340 at 97% margin is
still a strong story, and the lower prices are easier to sell into local
businesses.

**2. Operator plans contradict the entitlement code.** `OPERATOR_PLANS.STARTER`
sells 2 DJs; `TIERS.basic` — the code that actually gates DJ creation — grants
4. The agreed product is a 4-DJ basic station, so marketing undersells what the
platform hands over. `TIERS` wins at runtime, so customers get more than they
bought.

**3. `OPERATOR_PLANS` has prices; `TIERS` does not.** The tier system that
enforces limits carries no price, and the plan list that carries prices enforces
nothing. Nothing connects a paid plan to an entitlement, so there is currently
no mechanism by which paying more grants more.

**4. Sold "12h/day" is not a real limit.** Starter is sold as 12 hours; nothing
in the playout chain enforces an hours cap — a station is either 24/7 or off
air. So the cheapest plan costs exactly as much to serve as the dearest. Either
enforce it or drop it from the plan description.

**5. Premium inventory is double-counted against ad spots.** Sponsored hours and
week takeovers consume inventory the optimal mix has already sold, but premium
revenue is added on top without subtracting the spots. At 77% utilisation there
is room to absorb it, so the total stands — but the two should be netted
explicitly rather than by luck. Also, revenue assumes 6 sponsored hours a month
while `MAX_SPONSORED_HOURS_PER_WEEK` permits 8; the binding constraint is not
the one the revenue uses.

---

## Costs worth watching

**Claude script generation is 90% of the cost base** ($462 of $514). It is the
only line that scales with station count and it is the only one worth
optimising. Everything else — TTS at $46, infrastructure at $6 — is noise.

**The cost calculator defaults to Gemini TTS** ($0.004/generation) while the
deployed system uses OpenAI. Gemini was abandoned in production because its free
quota ran out mid-show. The calculator therefore models a provider we do not
use; the OpenAI Std figures in the same page are the real ones.

**Scout/referral commissions are not in the model at all.** 25% lifetime on
prepurchase conversions, 20% for three months then 12% ongoing, plus a 50%
first-month sponsor referral bonus. None of this is subtracted anywhere. At 125
sponsors these are material and should be modelled before the revenue-share
conversation with any station operator.

---

## Recommendation

1. Decide the price ladder, then make the constants the single source and delete
   every hard-coded figure from the pages.
2. Reconcile `OPERATOR_PLANS` with `TIERS`, and connect price to entitlement.
3. Model scout commissions as a cost line.
4. Keep `verify-business-model.ts` in CI so the narrative cannot drift from the
   constants again.
