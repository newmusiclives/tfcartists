# Handover — 1 August 2026

Everything below is done, deployed and verified unless it says otherwise.

---

## Read this first

**The station is OFF AIR**, as you asked, to save costs.

```
liquidsoap: inactive / disabled     (won't restart on reboot)
watchdog:   inactive                (disabled first, or it would have restarted it)
Icecast sources: 0
STATION_PAUSED=true on Netlify      (already set — all 13 AI cron jobs skip)
```

**To bring it back:**
```bash
ssh root@89.167.23.152 'systemctl enable --now liquidsoap; systemctl enable --now truefans-watchdog.timer'
```
Then set `STATION_PAUSED=false` in Netlify if you want the AI content jobs running.

The Hetzner box (~$5/mo) still bills. Nothing else is spending.

---

## What I need YOU to decide

These are business calls, not code ones. I have not guessed at any of them.

**1. The published revenue figure is 27% too high.** The model is described
everywhere as **$22,250/month per station**. From the constants that actually
ship it computes to **$16,340**. Prices were cut ~35% and the story around them
never moved. It is hard-coded on 7 pages, **5 customer-facing**: `/docs`,
`/capacity`, `/station`, `/revenue/projections`, `/revenue`.

Either restore the old prices ($50/$100/$200/$400 sponsor tiers) or restate the
model at $16,340. Both defensible — $16,340 at 97% margin is still a strong
story, and the lower prices are easier to sell to local businesses. Full detail
in `docs/BUSINESS-MODEL-REVIEW.md`; re-check any time with
`npx tsx scripts/verify-business-model.ts`.

**2. Three artists are on air but not name-cleared.** `Cypress Junction`
(unchecked), `Sarah Martinez` (partial), `Callum Dreher` (pending — because you
just renamed it). LABEL's `clearance_status` is *artist-name* clearance, not
music rights — the same check that made you rename Ryan Mitchell. Their music
rights are fine; we own the recordings.

I listed them on the artists page (their names are already public via the
stream) but gave them **no profile page**. Get them cleared in LABEL and re-run
`npx tsx scripts/import-roster.ts /tmp/mf-new.json --commit`.

**3. Scout commissions are not modelled anywhere.** 25% lifetime on prepurchase
conversions, 20% falling to 12%, plus 50% first-month sponsor referral bonus.
None of it is subtracted from revenue. Material at 125 sponsors — worth settling
before any operator revenue-share conversation.

**4. Railway still won't deploy.** `railway up` times out indexing the repo
(678MB venv). Until it lands: the rights-gate fix, the analytics date-filter
fix, and DJ voice tracks all stay undeployed. Needs a look in the dashboard, or
add a `.dockerignore`.

---

## What I did

### Contrast — your main complaint
The cause was not a palette choice. The site **defaults to dark**, but large
parts only ever had light values, so text switched to its dark colour while the
surface behind it stayed light. `35`, `$390.00`, `584` were rendering white on
near-white; some pairs were exactly 1.00:1.

**630 issues → 96** on the pages I measured before/after; 5 → 13 clean.
`/admin/station-costs` went from 85 issues to fully legible.

Fixed in four verified passes (greys, backgrounds/text/borders, colour ramps,
gradients) plus a base-layer rule for form controls. Each pass was measured
before the next — my first attempt made it *worse* (620→630) by darkening cards
without darkening their text, so both halves must move together.

Re-check any time: `node scripts/audit-site-contrast.mjs` (logs in as admin —
the old auditor could not see the 57 admin pages at all, and reported a clean
site having never rendered one).

**Still outstanding: ~700 issues across 87 pages** on the full sweep. Worst are
`/elliot/content` (80), `/station-admin/ad-targeting` (68),
`/riley/pool-calculator` (42). Same families, just not yet swept.

### Station & catalogue
- **Rotation bug fixed** — you heard 3–4 tracks repeating because
  `reload=1800` used Liquidsoap's default `reload_mode="seconds"`, which
  **restarts the playlist from the top**. You were hearing the first ~10 of 55
  on a loop. Now `reload_mode="rounds"`.
- **Artist separation** — no artist closer than 4 tracks, and the wrap-around
  between passes is clean too (7 apart).
- **Station IDs** — 12 IDs, two voices, $0.018 one-time, one every 4 songs.
- **Artwork** — all 55 tracks, both databases, embedded in the files.
- **Major-label catalogue removed from every path to air** — 1,200 files
  quarantined to `/mnt/quarantine/major-label` (not deleted), both DBs retired,
  API source disabled, gate now fails closed. `verify_licensed_only.py` checks
  all six links.
- **Callum Dreher** rename propagated to all seven places the name lived.

### Platform
- **Artists page live** with portraits, bios, origins and per-artist pages.
- **Plays now sync** to the platform every 15 min — analytics, royalties and
  the fairness protocol were reading a table nothing had ever written.
- **Listener analytics** built (`/admin/analytics`), including a
  rotation-balance warning.
- **hq_stream is now a real addon** — 320k was being given to everyone, so the
  paid tier granted nothing. Standard is 128k; HQ enabled for the NCR demo.

### A data bug worth knowing about
Building the analytics page exposed it: the top "artist" was **North Country
Radio at 49% of airplay** — 182 plays of a track called `Off Air`.
`/api/track_played` recorded whatever it was handed, callers poll it with the
current now-playing value, and with the station stopped that value is the
string "Off Air". One phantom play every ten seconds.

That feeds royalty and fairness figures, so it diluted every real artist's
share. Guarded at the write point, 60-second dedupe added (polling was also
turning one song into dozens of plays), 280 phantom rows removed.

---

## Not done

- **Feature flags still unwired**: `podcast_replays`, `live_requests`,
  `sponsor_self_serve`, `smart_clocks`, `ai_show_recaps`, `multi_station`,
  `signature_voices`, `extra_djs`.
- **`OPERATOR_PLANS` and `TIERS` are disconnected** — one carries prices and
  enforces nothing, the other enforces limits and carries no price. Nothing
  connects paying more to getting more. Worth fixing before selling a station.
- **12 named DJs have no platform records**, so `djId` is null on every synced
  play.
- **Catalogue depth** — 55 tracks is a ~3 hour cycle; ~140 would be comfortable.
- **22 LABEL tracks** held back on lyric-repetition validation — your editorial
  call.

---

# Update — Railway fixed, pricing restored

## Railway is deployed ✅

The blocker was **build artifacts, not dependencies**. Everyone assumed the
678 MB `venv` and 595 MB `node_modules` — both already excluded. The real
culprits were `frontend/.netlify` (242 MB) and `frontend/.next` (75 MB), listed
nowhere. Excluding them took the tree to ~17 MB and it uploaded first try.

Verified live: the analytics date filter returns 200 where every value used to
return 500, and `song_path` now refuses major-label titles while resolving ours.

**Still worth doing (needs the dashboard):** `railway status` reports
`source: null` — the service has no repo attached, so production runs whatever
was last uploaded from a laptop rather than what is in `main`. Connecting it to
`newmusiclives/BETTERROBODJ` makes pushes deploy. Steps in
`BETTERROBODJ/docs/RAILWAY-DEPLOY.md`.

**To bring the DJs back** (station is off air, as you asked): uncomment
`api_source` in `radio_production.liq` — it has restore instructions inline —
and restart Liquidsoap. The API now only serves cleared audio, so it is safe.

## Pricing restored — see `docs/STATION-ECONOMICS.md`

The old ladder wasn't one: Tier 1 charged **$1.33/spot** against Local Hero's
**$1.00**, so buying more cost more per spot. Fixed to a real volume ladder:

| Tier | Spots | Price | Per spot |
|---|---|---|---|
| Local Hero | 30 | $45 | $1.50 |
| Tier 1 | 60 | $79 | $1.32 |
| Tier 2 | 150 | $169 | $1.13 |
| Tier 3 | 300 | $279 | $0.93 |

**Verifier now reports 0 conflicts.** The headline figure is computed, not
hard-coded on seven pages.

## Cost and profit per station

**$65/month to run** at 3 DJ links per hour. Even at a link between *every
song* it is $369 — under 11% of launch-stage revenue. Cost is not the
constraint; sponsor count is.

| | Launch (25 sponsors) | Established (60) | Full (125) |
|---|---|---|---|
| Net revenue | $3,536 | $8,890 | $18,751 |
| **Profit** | **$3,471** | **$8,825** | **$18,686** |

## What to charge local operators

**$249/month + 10% of net, no setup fee.**

| | Launch | Established | Full |
|---|---|---|---|
| Operator keeps | $2,934 (83%) | $7,752 (87%) | $16,627 (89%) |
| Our profit | $538 | $1,073 | $2,059 |

Two recommendations: **waive the monthly fee until a station clears
$1,000/month** (costs us $65 to carry, removes the biggest objection), and
**drop the old $500–$1,000 setup fee** — it recovers nothing real against a $65
cost base and lands when the operator is least convinced.
