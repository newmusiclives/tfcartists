# TrueFans RADIO — Platform Deep Dive

Audit of every page, system, backend and admin surface. 30 July 2026.

**Headline: this platform is far more built than it looks.** 175 pages, 240 API
routes, 80 database models of which 78 are actively used, 13 scheduled jobs. The
gaps are narrow and specific, not structural. What was missing was not features —
it was one wrong URL, and nothing watching the stream.

---

## 1. System map

Three services, two repositories, two databases.

| Component | Tech | Host | Repo | State |
|---|---|---|---|---|
| Web platform | Next.js 14, TypeScript, Tailwind, Prisma | Netlify | `tfcartists` | ✅ live |
| Scheduled jobs | 13 Netlify functions on cron | Netlify | `tfcartists` | ✅ live (kill-switchable) |
| Playout API | FastAPI, 15 routers, ~17k LOC | Railway | `BETTERROBODJ` | ✅ live |
| Transmitter | Liquidsoap + Icecast 2.4.4 | Hetzner CX23, Helsinki | `BETTERROBODJ` | ⏸️ stopped by request |

**Databases:** the Prisma database (organisations, artists, sponsors, listeners,
revenue) and the FastAPI's Postgres (songs, artists, plays, clocks). These are
**separate stores with overlapping concepts** — see §4.

---

## 2. Built and complete

### Public site
Home, about, pricing, licensing, contact, privacy, terms, cookies, network,
capacity, case-study, community-radio, genres (+ per-genre), stations, station,
schedule, whats-playing, podcasts, showreel, player, visualizer, docs, developers
(+ API docs, keys, native app), demo, demo-station, airplay, revenue (+
projections), opportunities (artists/listeners/sponsors).

### Listener-facing interaction
`/requests`, `/vote`, `/shoutouts`, `/voicemail`, `/dedications`, `/rewards`
(artist/listener/leaderboard/redeem), `/newsletter` (+ preferences,
unsubscribe), `/listen/register`, gamification (leaderboard, profile), push
notifications via VAPID/web-push.

### Embeds — a genuine differentiator
`/embed/player`, `/embed/now-playing`, `/embed/heatmap`, `/embed/builder`.
Station operators can drop the player on their own site. This is a real
distribution channel and it's finished.

### The five team consoles
Each is a full workspace, not a dashboard shell:

| Console | Purpose | Sub-pages |
|---|---|---|
| **Riley** | Artist acquisition | artists, discovery, outreach, pipeline, submissions, workflows, upgrade-opportunities, pool-calculator, team |
| **Harper** | Sponsor sales | sponsors, pipeline, outreach, calls, inventory, billing, operations, workflows, team |
| **Elliot** | Listener growth | analytics, campaigns, community, content, team |
| **Cassidy** | Music review panel | submissions, rotation, tier-management, team |
| **Parker** | Programming | music, programming, traffic, listeners, team |

Each has matching API routes (`/api/riley/*`, `/api/harper/*`, …) and an activity
model in Prisma. Each has a nightly cron job.

### Station admin — 30 pages
clocks, schedule-editor, dj-editor, music (+ import), imaging, imaging-packages,
sponsor-ads, ad-targeting, features, shows, show-prep, transitions, podcasts,
social, listeners, requests, dedications, voicemail, branding, embed, webhooks,
stream, stream-health, monitoring, cron-logs, compliance, licensing, invoices,
recommendations, clone, wizard.

### Operator & portals
Operator: signup, dashboard, analytics, network, pnl, templates, forgot/reset
password, provisioning, onboarding email, email verification.
Artist portal: profile, tracks, submit, stats, earnings, payments, invoice.
Sponsor portal: dashboard, campaigns, analytics, billing, reach, roi.

### Infrastructure that already exists
- **Object storage (R2/S3)** — already integrated, 39 references
- **Messaging via GoHighLevel** — email and SMS, with CRM pipeline sync
- **Social posting** — real Twitter/X OAuth 1.0a signing implemented
- **Webhooks** — endpoints, config, deliveries, test, manifest
- **Developer API** — `/api/v1/*` (now-playing, schedule, station), keys, docs
- **Compliance** — logging, licensing reports, exports
- **AI** — OpenAI (87 refs), Gemini (34), Anthropic (17), ElevenLabs (13), Spotify (67)

### The 13 scheduled jobs
`voice-tracks-hour` (every 10 min in daypart), `voice-tracks-daily`,
`voice-tracks-catchup`, `features-daily`, `cassidy/elliot/harper/parker/riley-daily`,
`newsletter-weekly`, `promoter-payouts`, `revenue-monthly`, plus `stream-health`.
All respect the `STATION_PAUSED` kill switch (commit `70d672f`).

---

## 3. Started but not complete

### 3.1 Payments — the biggest gap 🔴
There is **no payment processor**. No Stripe, no PayPal, no GHL payments call.

What exists: billing pages, invoice generation, payout calculation, subscription
models, commission maths, `AirplayPayment`, `RadioRevenuePool`, `RadioEarnings`,
scout monthly payouts, sponsor contracts and ROI reports.

What happens: `/api/payments/subscribe` and `/api/payments/payouts` **record rows
in the database**. Nothing charges a card or moves money.

So the entire revenue model is modelled and reported but not transacted.
Everything is effectively an invoice you settle by hand.

### 3.2 Social posting — partially wired 🟡
Twitter/X is genuinely implemented (OAuth 1.0a request signing, media upload).
Other platforms are not: *"API keys will be used when platform OAuth is
connected. For now, posts are logged locally."* (`station-admin/social`)

### 3.3 Rights and licensing — inconsistent with the new model 🔴
- `compliance/licensing` bills **every play** at a hardcoded `ROYALTY_PER_PLAY = 0.003`. Under an owned-AI plus artist-permission catalogue the correct figure is zero for cleared tracks, so the report **overstates liability**.
- The Prisma schema has **no rights fields at all** — no `rights_status`, no artist permission records. The rights model exists only in the FastAPI database (migration 021).
- Result: the platform cannot currently distinguish owned from licensed content.

### 3.4 Unused models 🟡
`Referral` and `SponsorCommission` are defined in the schema but referenced
nowhere in code — schema built, feature never wired.

### 3.5 Play recording (backend) 🔴
`report_track_played` hardcoded a station UUID that no longer exists, so every
play insert failed with a foreign key violation. **Fixed in code, not yet
deployed.** Until it deploys, analytics and the fairness protocol stay frozen at
16 March.

### 3.6 Voice cache economics (backend) 🟡
`AUDIO_CACHE_PATH` defaults to `/tmp` on Railway (wiped every deploy) and intros
are cached on a hash of the generated script, which never repeats — so the cache
never hits and every clip is re-bought. Fixing both turns ~$33/month into a **$21
one-time** library build. Note: object storage is *already integrated* in
`tfcartists`, so the hard part is done in the wrong repo.

---

## 4. Needs building

### 4.1 A feature-flag system — there isn't one
No flag framework exists anywhere (`FEATURE_*` hits are radio "features", i.e.
show segments — a naming collision worth avoiding). Every capability is either
deployed or absent.

**Recommendation:** the `Config` model already exists in Prisma. Back flags with
it, with an env override for emergencies:

```ts
// src/lib/flags.ts
export async function flag(key: string, fallback = false): Promise<boolean> {
  const env = process.env[`FLAG_${key.toUpperCase()}`];
  if (env !== undefined) return env === "true";        // emergency override
  const row = await prisma.config.findUnique({ where: { key: `flag:${key}` } });
  return row ? row.value === "true" : fallback;
}
```

Per-station flags fit naturally on the `Station` model, which is what the tier
and addon model needs anyway.

### 4.2 The two databases need a defined relationship
Prisma has `Song`, `Artist`, `Station`, `TrackPlayback`. The FastAPI Postgres has
`songs`, `artists`, `stations`, `plays`. They overlap conceptually and are synced
by hand (`scripts/sync-categories-to-railway.ts`, `populate-song-urls.ts`,
`sync-dj-personas.ts`). This is the most likely source of future silent breakage —
exactly like the station UUID that drifted and killed play recording.

Decide: one is authoritative, or define a sync contract with reconciliation checks.

### 4.3 Station tiers and addon gating
Basic = 4 AI DJs, then paid addons. `AirplayTier` and `ListenerTier` exist for
artists and listeners, but there is no **station** tier concept. Needs flags per
station plus enforcement in the playout API.

### 4.4 Listener metering into billing
Listener sessions, geo and counts exist in `tfcartists`, but the playout API
reports `listener_count: 0` because nothing scrapes Icecast. Any per-listener
billing or royalty return depends on this.

### 4.5 Operational
- Deploy the station-ID fix (blocked on the rights-gate decision)
- External monitor on a persistent host (the watchdog is installed on the box; the off-box monitor still needs a home)
- `DEMO-GUIDE-LOCALHOST.md` documents stale credentials and is committed to git — delete it
- `/parker` has no login entry in `TEAM_USERS`, so that console is unreachable

---

## 5. Could be built — feature-flagged

Ordered by leverage against the owned-catalogue model.

| Flag | Feature | Why it fits |
|---|---|---|
| `podcast_replays` | Publish each hour/show as a podcast episode | Every DJ segment is already generated audio; `podcast/episodes` + `podcast/feed` routes already exist. Reach with no extra AI cost. |
| `artist_showcase` | Public page crediting permissioned artists | Directly recruits the artists the catalogue now depends on |
| `sponsor_self_serve` | Advertiser submits copy → AI-voiced ad → scheduled → play-report invoice | Ad pipeline exists; only checkout and reporting are missing |
| `hq_stream` | 320 kbps as a paid upgrade, 128 kbps base | Removes the only cost that scales with success — see `UNIT_ECONOMICS.md` |
| `extra_djs` | Unlock the other 8 personalities | Mostly gating plus a per-DJ voice library build |
| `multi_station` | Genuinely launch a second station | `stations.py:496` currently writes a mock instance record; nothing starts |
| `signature_voices` | ElevenLabs voices per DJ | ~$400 one-time build, high-margin premium tier |
| `live_requests` | Listener requests feeding the playout queue | `/requests`, `/vote`, `/api/requests/queue` all exist; the playout side doesn't consume them |
| `station_payments` | Real card processing | Unblocks every billing surface already built |
| `smart_clocks` | Auto-build clocks from BPM/cue/hits analysis | Analysis scripts exist offline; nothing feeds the scheduler |
| `listener_analytics` | Icecast stats → dashboards, peak-per-daypart | Blocks billing and programming decisions |
| `ai_show_recaps` | Auto recaps, social clips per segment | Social posting is half-built; this gives it something to post |

---

## 6. Honest summary

**What surprised me:** the breadth. Five complete team consoles, 30 admin pages,
an embed system, a developer API, webhooks, GHL messaging, working social
signing. This is not a prototype.

**What's genuinely missing** is narrower than the page count suggests:

1. **Money doesn't move** — everything is modelled, nothing is charged
2. **Rights aren't represented** in the platform database, only in the playout one
3. **No feature-flag system**, so nothing can ship dark or per-tier
4. **Two databases drift** with no reconciliation — this already caused a four-month outage

Fix those four and the platform is sellable. Everything in §5 is upside.
