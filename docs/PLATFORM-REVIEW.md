# Platform Review — August 2026

State of the build, the business model per station and per team, and what a
station costs to run and sell.

Every figure regenerates: `npx tsx scripts/station-economics.ts` and
`npx tsx scripts/verify-business-model.ts` (exits non-zero on conflict).

---

## 1. Business model per station

### Cost to run one station

| | Monthly |
|---|---|
| Claude DJ scripts | $34 |
| OpenAI TTS | $10 |
| Features & imaging | $12 |
| Infrastructure (VPS, storage, platform share) | $10 |
| **On-air subtotal** | **$65** |
| Five AI team automations | $65 |
| **True cost to serve** | **$130** |

Cost scales with **talk density only** — not listeners, not sponsors:

| DJ links/hour | Links/day | On-air cost |
|---|---|---|
| 1 | 24 | $36 |
| 3 | 72 | $65 |
| 12 | 288 | $195 |
| 24 | 576 | $369 |

Even at a link between every song, cost stays under 11% of launch-stage
revenue. **The model is not cost-constrained at any setting.** That follows
directly from owning the music — a conventional station pays performance
royalties on every play.

Hard ceilings are already enforced: `AI_DAILY_SPEND_LIMIT` $12/day,
`AI_MONTHLY_BUDGET` $250/month.

### Revenue per station

| | Launch (mo 1–6) | Established (yr 1) | Full capacity |
|---|---|---|---|
| Sponsors | 25 | 60 | 125 |
| Gross | $3,969 | $9,978 | $21,045 |
| Less commissions (8%) & processing (2.9%) | −$433 | −$1,088 | −$2,294 |
| **Net** | **$3,536** | **$8,890** | **$18,751** |
| Cost | $130 | $130 | $130 |
| **Profit** | **$3,406** | **$8,760** | **$18,621** |

Full capacity uses 77% of ad inventory, so the headroom is real. 125 local
sponsors is a multi-year sales outcome — **plan against Launch and
Established**, not the ceiling.

---

## 2. Business model per team

Five AI teams. **Only two bill anyone.** The other three make that billing
possible or defensible — worth stating plainly, because "five AI teams" reads
like five income streams.

| Team | Owns | Revenue at full | Cost | Gap |
|---|---|---|---|---|
| **Harper** — Sponsors | Prospect → pitch → close → renew → invoice | **$17,845** | $16 | `sponsor_self_serve` unwired; every sale manual |
| **Riley** — Artists | Recruitment + paid airplay tiers | **$3,200** | $13 | No submission → payment flow |
| **Cassidy** — Review | Quality/rights gate into rotation | — | $11 | Not wired to the rights model |
| **Parker** — Programming | Clocks, scheduling, traffic | — | $11 | `smart_clocks` unwired; clocks hand-built |
| **Elliot** — Listeners | Audience growth | — | $14 | No listener metrics feed |

**Harper is 85% of station revenue.** If effort is scarce, it goes there.

Elliot is the quiet dependency: sponsor rates rest on audience size, and there
is currently no listener metric to justify a rate rise or prove campaign value.

---

## 3. Pricing to sell a station

**$249/month + 10% of net revenue. No setup fee.**

| | Launch | Established | Full |
|---|---|---|---|
| Operator keeps | $2,934 (83%) | $7,752 (87%) | $16,627 (89%) |
| We take | $603 | $1,138 | $2,124 |
| **Our profit** | **$473** | **$1,008** | **$1,994** |

Plan ladder (single source: `TIERS`, which also enforces the limits):

| Plan | Price | Share | Grants |
|---|---|---|---|
| Launch | $249/mo | 10% | 1 station, 4 DJs, 128kbps |
| Growth | $449/mo | 8% | 1 station, 12 DJs, 320kbps, requests, replays |
| Network | $899/mo | 5% | 10 stations, everything |

Share falls as tier rises: an operator running ten stations is doing the selling
at scale, and a flat percentage punishes exactly that.

**Two recommendations.** Waive the monthly fee until a station clears
$1,000/month — carrying it costs $130 and removes the biggest objection to
signing. And drop setup fees: against a $130 cost base they recover nothing and
land when the operator is least convinced.

---

## 4. What must be done before selling anything

**1. Turn on `station_payments`.** Manifest keys are set, checkout and subscribe
routes exist, the gate is built — the flag is simply off, so billing surfaces
record amounts and charge nothing. Verify end to end with a live card, then
enable. **Nothing else on this list matters until money can move.**

**2. Build the two purchase flows.** Harper can close a sponsor and Riley can
recruit an artist, but neither can take payment. Airplay tiers are not
purchasable and sponsor packages have no self-serve checkout. This is the gap
between a demo and a business.

**3. Clear the three artist names.** `Cypress Junction`, `Sarah Martinez`,
`Callum Dreher` are on air without LABEL name clearance — the same check that
prompted the Ryan Mitchell rename. Music rights are fine; the *name* is
unresolved.

**4. Connect Railway to GitHub.** Deploys work now, but `source: null` means
production runs the last laptop upload, not `main`.

**5. Grow the catalogue.** 55 tracks is a ~3 hour cycle. ~140 is comfortable
for 24/7 without listeners noticing repetition.

---

## 5. What should be done next

- **Listener metrics** (Elliot). Sponsor pricing rests on audience and there is
  no measurement. Also unblocks proving campaign value.
- **`sponsor_self_serve`** (Harper). The highest-revenue team is entirely
  manual; self-serve is the difference between 25 and 125 sponsors.
- **Wire Cassidy to the rights model.** It reviews quality but not clearance,
  so the gate that protects the whole rights position is human-dependent.
- **Finish the contrast sweep.** ~700 issues across 87 pages remain. Same
  families already fixed elsewhere; `node scripts/audit-site-contrast.mjs`.
- **Put the verifiers in CI** — `verify-business-model.ts` and
  `verify_licensed_only.py`. Both exit non-zero and both guard things that fail
  silently.

## 6. What could be done

- `smart_clocks` — automatic clock building (Parker)
- `podcast_replays` — routes exist, zero extra AI cost
- `live_requests` — listener engagement, drives Elliot's numbers
- `ai_show_recaps`, `signature_voices`, `multi_station`
- Human artist submission flow — the roster already carries `rightsBasis` per
  artist, so owned and permissioned artists coexist without schema changes
- LABEL release pipeline so AI tracks earn beyond airplay

**8 of 13 feature flags currently gate nothing.** They are declared, not built.

---

## 7. Honest assessment

**The economics are unusually strong and the rights position is genuinely
defensible.** 97% margin with breakeven around three sponsors is not a
spreadsheet artifact — it is what owning the catalogue buys.

**The recurring failure mode is things that look finished but are not wired
up.** Both Icecast mounts existed but every caller took the expensive one, so
the paid tier granted nothing. `TrackPlayback` existed and nothing wrote to it,
so royalties read an empty table. Four plan definitions disagreed on price.
Eight flags gate nothing. None of this threw an error; it degraded silently
while looking complete.

**Feature surface has outrun depth.** 179 pages and five team dashboards
against a 55-track catalogue and no working checkout. The next phase should
finish what exists rather than add to it.

**The single highest-value next action is turning on payments and building the
two purchase flows.** Everything else — more features, more catalogue, more
polish — is worth less than the ability to take money.
