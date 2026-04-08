# TrueFans RADIO — Team Operations Guide

A practical "how it works / how to pressure-test" reference for the
station operator. Five teams, each with their own pages, APIs, and
day-to-day actions. For every team this doc lists:

- **Purpose** — what the team does for the station
- **Pages and routes** — where the operator goes
- **Daily actions** — the operator's normal workflow
- **Pressure test** — concrete steps to verify each flow end-to-end
- **Known gaps** — pages still rendering mock data (so pressure-test
  expectations are realistic)

> Test data note: when a step says "create / approve / launch
> something", do it on a clearly-fake test record so it can be safely
> deleted afterwards. None of the actions below are destructive at the
> station level — they only touch their own model rows.

---

## 1. Riley's Team — Artist Acquisition

`/riley` · `Users` icon, purple

### Purpose
Recruit indie artists, move them through a 7-stage pipeline
(`discovered → contacted → responded → invited → submitted → approved
→ activated`), assign them to a subscription tier (FREE/BRONZE/SILVER/
GOLD/PLATINUM), and pay them out of the artist pool every month.

### Pages
| Path | What it does |
|---|---|
| `/riley` | Dashboard — top-level KPIs + automation runner |
| `/riley/artists` | Full roster, filter by tier / engagement |
| `/riley/discovery` | Spotify search → import to pipeline |
| `/riley/outreach` | Send email/phone/Instagram contact, log responses |
| `/riley/pipeline` | 7-stage funnel view, move artists between stages |
| `/riley/submissions` | Track submission queue (passes work to Cassidy) |
| `/riley/pool-calculator` | Monthly per-tier payout math |
| `/riley/upgrade-opportunities` | FREE-tier artists ripe for BRONZE upgrade |
| `/riley/workflows` | Cron + automation history |

### Daily actions
1. Run **Daily Automation** from `/riley` (dry run first, then execute).
2. Review `/riley/outreach` for any artist stuck in `discovered` or
   `contacted` >3 days — flag, contact, or escalate.
3. Hit `/riley/discovery`, run a Spotify search by genre, import 5–10
   promising candidates into the pipeline.
4. Glance at `/riley/upgrade-opportunities` weekly — every artist with
   engagement ≥4.0 is a BRONZE pitch waiting to happen.

### Pressure test
| # | Action | Verify |
|---|---|---|
| 1 | `/riley` → "Daily Automation" → **Dry Run** | Returns counts (follow-ups, reminders, wins) with **0 errors** |
| 2 | `/riley` → "Daily Automation" → **Execute** | Counts > 0 and the values appear in `/riley/workflows` |
| 3 | `/riley/discovery` → search "Sarah Jarosz" → click an artist → **Import** | Artist appears on `/riley/pipeline` in stage `discovered` |
| 4 | `/riley/pipeline` → click that artist → **Move to next stage** | Stage updates immediately, days-in-stage resets to 0 |
| 5 | `/riley/upgrade-opportunities` → click **Contact** on top artist | mailto opens with pre-filled upgrade pitch |
| 6 | `/riley/pool-calculator` → check per-share value | Matches `(Harper monthly sponsor revenue × 0.8) ÷ total shares` |

### API endpoints (for direct testing)
```bash
GET  /api/riley/stats                        # totals
GET  /api/cron/riley-daily?dry_run=true      # automation preview
GET  /api/cron/riley-daily?dry_run=false     # automation execute
GET  /api/discovery/spotify/search?q=NAME    # discovery search
POST /api/discovery/social                   # import to pipeline
GET  /api/artists?limit=100                  # full roster
```

### Known gaps
- `/riley/artists` artist-detail tabs (Track History, Play History,
  Revenue History, Tier History) are placeholders — they'll render
  but the data inside is the same loading skeleton.

---

## 2. Cassidy's Team — Submission Review

`/cassidy` · `Award` icon, teal

### Purpose
Listen to artist track submissions, assign each to a rotation tier
(BRONZE/SILVER/GOLD/PLATINUM) with a weekly spin count, and steer the
station toward an 80% indie / 20% mainstream rotation balance.

### Pages
| Path | What it does |
|---|---|
| `/cassidy` | Dashboard — placement rate, review time, indie progress |
| `/cassidy/submissions` | Review queue: listen, assign tier, rationale |
| `/cassidy/rotation` | 80/20 indie progress bar + recently placed tracks |
| `/cassidy/tier-management` | Tier distribution audit (BRONZE 60% / SILVER 25% / GOLD 12% / PLATINUM 3% target) |

### Daily actions
1. Open `/cassidy/submissions?status=PENDING`.
2. For each submission: play preview, choose tier + spins/week, write
   a one-line rationale, click **Assign Tier**.
3. Open `/cassidy/rotation` to confirm placements landed and the indie
   percentage moved in the right direction.

### Pressure test
| # | Action | Verify |
|---|---|---|
| 1 | `/cassidy/submissions` → filter `PENDING` → open one | Detail modal shows artist contact, audio player, tier dropdown |
| 2 | Assign tier `BRONZE`, 5 spins/week, rationale "ptest" → **Assign** | Submission status flips to `PLACED`, modal closes, list refreshes |
| 3 | `/cassidy/rotation` → check "Recently Placed" | The submission you just placed appears at the top |
| 4 | `/cassidy/tier-management` | BRONZE bar moves up by 1 |

### API endpoints
```bash
GET  /api/cassidy/stats
GET  /api/cassidy/submissions?status=PENDING
POST /api/cassidy/tiers/assign
     # body: { submissionId, tierAwarded, rotationSpinsWeekly, decisionRationale }
```

### Known gaps
- None — this team is the most fully-wired of the five.

---

## 3. Harper's Team — Sponsor Acquisition

`/harper` · `Building2` icon, green

### Purpose
Sell sponsorships, move prospects through a sales pipeline
(prospect → discovery call → pitch → close → active), invoice them,
and renew/upsell.

### Pages
| Path | What it does |
|---|---|
| `/harper` | Dashboard — active sponsors, monthly revenue, calls this month |
| `/harper/sponsors` | Sponsor roster with tier, contract dates, satisfaction |
| `/harper/pipeline` | Sales pipeline by stage |
| `/harper/calls` | Scheduled + completed sales calls |
| `/harper/billing` | Invoices, payment status, revenue distribution |
| `/harper/inventory` | Available ad slots inventory |
| `/harper/operations` | Day-to-day ops dashboard |
| `/harper/outreach` | Cold-outreach tracking |
| `/harper/workflows` | Cron + automation history |

### Daily actions
1. Check `/harper` for sponsors flagged "ending soon" — pitch upgrades.
2. Open `/harper/calls` and step through today's scheduled calls
   (discovery / pitch / close).
3. Reconcile any overdue invoices on `/harper/billing` and click
   **Send Reminder** if needed.

### Pressure test
| # | Action | Verify |
|---|---|---|
| 1 | `/harper` | Sponsor count, monthly revenue, and "calls this month" all render numbers (no `—`) |
| 2 | `/harper/sponsors` | Sponsor list loads. Filter "ending_soon" returns at least the test sponsors |
| 3 | `/harper/pipeline` | Each stage column has counts; click a card to open detail |
| 4 | `/harper/billing` | Invoices render with status badges (paid/pending/overdue) |
| 5 | `/harper/calls` | Today's scheduled calls show with phone numbers |

### API endpoints
```bash
GET  /api/harper/stats
GET  /api/harper/deals?limit=5
GET  /api/harper/sponsors            # currently mock UI data
GET  /api/harper/billing             # currently mock UI data
GET  /api/harper/calls               # currently mock UI data
```

### Known gaps
- `/harper/sponsors`, `/harper/billing`, `/harper/calls` render UI from
  hardcoded mock arrays. The pages work, the actions don't persist.
  Fix is to wire each to a real API route + Prisma model.
- `POST /api/harper/sponsors/[id]` (update status/tier) — not implemented.

---

## 4. Elliot's Team — Listener Growth

`/elliot` · `Target` icon, blue

### Purpose
Grow and retain the listener base via campaigns, viral content, and
community engagement. Tracks listeners across four tiers
(Casual/Regular/Super Fan/Evangelist).

### Pages
| Path | What it does |
|---|---|
| `/elliot` | Dashboard — listeners, avg session, returning %, total views |
| `/elliot/analytics` | Demographics, retention cohorts, device mix, time slot performance |
| `/elliot/campaigns` | Launch + track viral / referral campaigns |
| `/elliot/community` | Top Super Fans + Evangelists, exclusive event planning |
| `/elliot/content` | Create social posts, track conversion-to-listener |

### Daily actions
1. Open `/elliot` and confirm yesterday's listener growth ≥ baseline.
2. Hit `/elliot/content` and post 1 piece for the highest-engagement
   platform (currently TikTok > Instagram).
3. Open `/elliot/community`, identify a new Evangelist, send a perk
   invite (manual today, automated later).
4. Once a week, review `/elliot/analytics` cohort retention and adjust
   campaign targeting.

### Pressure test
| # | Action | Verify |
|---|---|---|
| 1 | `/elliot` | All four KPI cards render numbers |
| 2 | `/elliot/campaigns` → **New Campaign** → name "ptest", type viral_push, goal 50 | Campaign appears in list with goal bar at 0% |
| 3 | `/elliot/content` → **New Post** → title "ptest", platform tiktok, content "test" | Post appears in content library |
| 4 | `/elliot/community` | Super Fan + Evangelist lists populate from real listeners |
| 5 | `/elliot/analytics` | Daily-growth chart renders, device mix shows three+ buckets |

### API endpoints
```bash
GET  /api/elliot/stats
GET  /api/elliot/analytics
GET  /api/elliot/campaigns?status=all
POST /api/elliot/campaigns
     # body: { name, type, targetAudience, goalType, goalTarget }
GET  /api/elliot/content?limit=4
POST /api/elliot/content
     # body: { title, platform, content, mediaUrl? }
GET  /api/elliot/listeners?tier=SUPER_FAN&sortBy=engagementScore&limit=10
```

### Known gaps
- `/elliot/analytics` time-slot performance and device breakdown are
  derived from mock arrays — the chart renders but the underlying
  numbers aren't yet pulled from real listening sessions.

---

## 5. Parker's Team — Station Management

`/parker` · `Radio` icon, rose

### Purpose
Run the on-air product. Maintain the music library, schedule DJs,
manage clock templates, handle listener requests + contests, and own
the streaming pipeline (cron jobs, voice tracks, imaging, sponsor
ads). This is the team that owns everything you've been debugging
the last few sessions.

### Pages
| Path | What it does |
|---|---|
| `/parker` | Dashboard — songs, DJs, clock templates, total revenue |
| `/parker/music` | Library view, rotation categories (Heavy/Medium/Light/Recurrent/Library), genre balance |
| `/parker/programming` | DJ schedule grid (weekday / Saturday / Sunday), format compliance |
| `/parker/listeners` | Live song requests, contests, social media stats |
| `/parker/traffic` | Sponsor ad rotation + traffic log |

### Daily actions
1. Confirm `/parker` shows the right active DJ count (5) and song count.
2. Open `/parker/programming` and verify all 24 hours are filled for
   today's day-type. (Today the entire week runs the same 5-DJ rotation
   so this should always be 100%.)
3. Hit `/parker/music` once a week to confirm rotation isn't bloated
   (Heavy >35 tracks, Library >150 tracks).
4. `/parker/listeners` during live shifts: queue requests, monitor
   contest entries.

### Pressure test
| # | Action | Verify |
|---|---|---|
| 1 | `/parker` | Song count matches `prisma.song.count()`, DJ count = 5 active |
| 2 | `/parker/programming` → toggle Saturday | Schedule still shows full 24h coverage with the weekday DJs |
| 3 | `/parker/music` | Rotation categories sum to total song count |
| 4 | `/parker/listeners` | Recent requests + contest entries render |
| 5 | `/parker/traffic` | Active sponsor ads list matches `/api/sponsor-ads?stationId=…` |

### Pressure-test the cron jobs (Parker owns these)
The actual on-air heartbeat lives in cron jobs, not pages. These are
the ones an operator needs to know how to trigger and verify:

| Cron | What it does | Trigger | Verify |
|---|---|---|---|
| `voice-tracks-daily` | Builds tomorrow's hour playlists, generates DJ scripts via Claude, renders TTS via Gemini | `POST /api/cron/voice-tracks-daily` (or wait for 5 AM MT) | New `HourPlaylist` rows appear with `status="locked"` and `voiceTrack` rows attached |
| `features-daily` | Generates daily features (trivia, weather, etc.) for each DJ | Runs at 4 AM MT | Feature content appears in voice tracks |
| `cassidy-daily` | Auto-progresses submissions through review states | Runs at 6 AM MT | Submission counts shift in `/cassidy/submissions` |
| `riley-daily` | Sends follow-ups, show reminders, win celebrations | Run from `/riley` dashboard or schedule | Counts on `/riley/workflows` |
| `pool-generic-tracks` | (Now no-op since Apr 2026) Used to fill the GenericVoiceTrack pool — kept for legacy compat |  | — |

### Pressure-test the imaging package builder
1. `/station-admin/imaging-packages` → **New Package** → fill form
2. Click **Generate Scripts** (or run `npx tsx scripts/finish-imaging-package.ts`
   from the repo to bypass Netlify's 26s function timeout)
3. Verify 158 elements appear with `status="audio_ready"`, all on
   Gemini, after ~12 minutes
4. Click **Deploy** — confirms 158 ProducedImaging rows are created and
   playout starts pulling from them within ~1 hour

### Known gaps
- `/parker/programming` schedule grid renders mock daypart performance
  data — listener levels and retention % are placeholder until the
  listening-session model is wired up.
- `/parker/music` rotation/genre/recent-adds render from mock data;
  only the headline song count is real.
- `/parker/listeners` requests + contests + social stats are mock.

---

## Cross-team end-to-end pressure test

A 15-minute drill that touches all five teams:

1. **Riley:** import a Spotify artist on `/riley/discovery`
2. **Riley:** move it to `submitted` on `/riley/pipeline`
3. **Cassidy:** open `/cassidy/submissions?status=PENDING` (the new
   submission should be visible if the pipeline + submissions models
   are linked) and assign it BRONZE / 5 spins
4. **Parker:** check `/parker/music` — total song count should
   eventually increment when the placement triggers a `Song` create
5. **Harper:** confirm `/harper` revenue numbers haven't broken
6. **Elliot:** launch a viral_push test campaign on `/elliot/campaigns`
7. Run **Riley's Daily Automation** dry run — should still report 0 errors

If any step fails, the broken hop is exactly the integration to fix
next.

---

## Cleanup after pressure-testing

```sql
-- Test artists
DELETE FROM "Artist" WHERE name LIKE 'ptest%';
-- Test submissions
DELETE FROM "Submission" WHERE notes LIKE '%ptest%';
-- Test campaigns
DELETE FROM "GrowthCampaign" WHERE name LIKE 'ptest%';
-- Test content posts
DELETE FROM "ViralContent" WHERE title LIKE 'ptest%';
```

Or blow it all away in Prisma Studio: `npx prisma studio` → filter
each table by `ptest`.
