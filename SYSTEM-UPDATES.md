# TrueFans RADIO™ System Updates

**Date:** December 12, 2025
**Major Changes:** Payment Processor, 9-Word Line, Data Sourcing

---

## 1. The New 9-Word Line

### ✅ Updated Version
**"Go To True Fans CONNECT dot com Right Now!"**

### Changes From Previous
- **Old:** "Text TRUEFANS to 213-555-FANS to support me tonight"
- **New:** "Go To True Fans CONNECT dot com Right Now!"

### Why This Works Better
1. **Simpler:** Easy to remember and say on stage
2. **Universal:** Works for all shows (no phone number to remember)
3. **Direct:** Sends fans straight to TrueFans CONNECT
4. **Clearer:** "dot com" is easier to hear than a phone number
5. **Action-oriented:** "Right Now!" creates urgency

### How It Works

**Artist says on stage:**
```
"Go To True Fans CONNECT dot com Right Now!"
```

**Fan action:**
1. Opens browser on phone
2. Goes to **TrueFansCONNECT.com**
3. Sees artist's profile
4. Donates directly

**Benefits:**
- No SMS costs
- Better conversion (visual vs text)
- Artist gets more info about donor
- Can collect email for follow-up

---

## 2. Payment Processing: Manifest Financial

### ✅ New Payment Processor
**Manifest Financial** replaces Stripe

### Why Manifest Financial?

**Manifest Financial** is purpose-built for multi-party payouts and music industry payments:

#### Key Features
1. **Instant Payouts** - Artists get paid immediately
2. **Multi-Party Splits** - Automatic revenue distribution
3. **Lower Fees** - 2.5% + $0.10 (vs Stripe 2.9% + $0.30)
4. **Built for Music** - Designed for artist royalties
5. **Compliance** - Handles 1099 forms automatically
6. **Bank Integration** - Direct ACH transfers

#### Manifest vs Stripe

| Feature | Manifest Financial | Stripe |
|---------|-------------------|---------|
| Transaction Fee | 2.5% + $0.10 | 2.9% + $0.30 |
| Payout Speed | Instant | 2-7 days |
| Multi-Party Splits | Native | Manual |
| Music Industry Focus | Yes | General purpose |
| 1099 Handling | Automatic | Manual |
| Artist Onboarding | Optimized | Standard |

#### Cost Savings Example
```
$100 donation:
- Stripe: $100 - $3.20 = $96.80 to artist
- Manifest: $100 - $2.60 = $97.40 to artist

$0.60 more per transaction!

At 1,000 donations/month: $600/month savings
At 10,000 donations/month: $6,000/month savings
```

### Integration Points

#### For Artists (Riley's Team)
```javascript
// Artist airplay tier subscriptions
Manifest.createSubscription({
  customerId: artist.id,
  plan: "tier_20", // $20/month
  amount: 2000, // cents
  interval: "monthly"
});
```

#### For Sponsors (Harper's Team)
```javascript
// Sponsor monthly packages
Manifest.createSubscription({
  customerId: sponsor.id,
  plan: "bronze", // $100/month
  amount: 10000, // cents
  interval: "monthly"
});
```

#### For Live Show Donations
```javascript
// Fan donates to artist at show
Manifest.createPayment({
  amount: 2500, // $25
  splits: [
    { recipientId: artist.id, percentage: 80 }, // $20 to artist
    { recipientId: station.id, percentage: 20 }  // $5 to station
  ],
  metadata: {
    showId: show.id,
    artistName: "Sarah Martinez",
    venue: "The Troubadour"
  }
});
```

#### For Monthly Pool Distribution
```javascript
// Distribute artist pool at end of month
Manifest.batchPayout({
  sourceAccount: "artist_pool",
  recipients: [
    { artistId: "artist_1", amount: 17550 }, // $175.50
    { artistId: "artist_2", amount: 8775 },  // $87.75
    // ... 850 more artists
  ],
  description: "December 2025 Airplay Pool Distribution"
});
```

### API Endpoints to Create

**File Structure:**
```
/src/lib/payments/
  ├── manifest-client.ts         # Manifest API wrapper
  ├── subscription-manager.ts    # Handle recurring payments
  └── payout-engine.ts          # Monthly pool distribution

/src/app/api/payments/
  ├── create-subscription/route.ts
  ├── webhook/route.ts
  ├── distribute-pool/route.ts
  └── instant-payout/route.ts
```

### Configuration Needed

**Environment Variables:**
```bash
MANIFEST_API_KEY=mani_live_...
MANIFEST_SECRET_KEY=sk_mani_...
MANIFEST_WEBHOOK_SECRET=whsec_...
MANIFEST_ACCOUNT_ID=acct_...
```

**Where to Get Credentials:**
1. Sign up at https://manifest.financial
2. Complete business verification
3. Get API keys from dashboard
4. Configure webhook URL: https://yourdomain.com/api/payments/webhook

---

## 3. Data Sourcing Strategy

### Where Each Team Gets Contact Data

---

### Riley's Team - Artist Discovery

**Mission:** Find 850+ performing artists

#### Primary Sources (Free/Low-Cost)

**1. Instagram Artist Discovery**
```
API: Instagram Graph API (Free with Business Account)
Search Strategy:
  - Hashtags: #livemusic #localartist #giglife #singersongwriter
  - Location tags: Los Angeles, Nashville, Austin, etc.
  - Follower range: 500-50,000 (sweet spot)
  - Engagement rate: >3%

Filters:
  ✅ Has "shows" or "gigs" in bio
  ✅ Recent posts from venues
  ✅ Uses music-related hashtags
  ✅ Has contact info in bio

Monthly Yield: 200-300 qualified leads
Cost: Free
```

**2. TikTok Music Discovery**
```
API: TikTok for Developers API (Free tier)
Search Strategy:
  - Sounds: Original music tracks
  - Hashtags: #originalsong #liveperformance #giglife
  - Location: Major music cities
  - Video content: Live performances

Filters:
  ✅ Posted live performance video
  ✅ 1,000+ followers
  ✅ Active (posted within 30 days)
  ✅ Has link in bio

Monthly Yield: 150-200 qualified leads
Cost: Free
```

**3. Spotify for Artists**
```
API: Spotify Web API (Free)
Search Strategy:
  - Independent artists with monthly listeners
  - Location: Target cities
  - Recently played shows (via concert info)
  - Has social links

Filters:
  ✅ 500+ monthly listeners
  ✅ Has upcoming shows listed
  ✅ Independent (not signed to major label)
  ✅ Active on social media

Monthly Yield: 100-150 qualified leads
Cost: Free
```

**4. Venue Websites & Calendars**
```
Method: Web scraping (Playwright/Puppeteer)
Targets:
  - Local venue websites
  - Ticketing platforms (Eventbrite, Bandsintown)
  - Facebook Events
  - Songkick

Extract:
  ✅ Artist name
  ✅ Show date/venue
  ✅ Social media links
  ✅ Contact email (if listed)

Monthly Yield: 100-200 qualified leads
Cost: Free (just server time)
```

**5. Music Industry Directories**
```
Sources:
  - Sonicbids (artist profiles)
  - ReverbNation (local artists)
  - Indie on the Move (touring database)
  - Bandzoogle artist sites

Access: Free browsing, scrape with permission
Monthly Yield: 50-100 qualified leads
Cost: Free
```

**6. Referrals from Existing Artists**
```
Strategy: Ask active artists to refer friends
Incentive: $50 bonus for each referred artist who books a show
Conversion: 60-80% of referrals become active
Monthly Yield: 20-50 qualified leads (grows over time)
Cost: $50 per successful referral
```

#### Total Artist Discovery Capacity
```
Instagram:        200-300/month
TikTok:          150-200/month
Spotify:         100-150/month
Venue Scraping:  100-200/month
Directories:      50-100/month
Referrals:        20-50/month
------------------------
TOTAL:           620-1,000 new leads/month

Conversion Rate: 15-20% (discovery → active)
Active Artists Gained: 93-200/month

Time to 850 artists: 4-9 months
```

---

### Harper's Team - Sponsor Discovery

**Mission:** Find 1,000+ local business sponsors

#### Primary Sources (Free/Low-Cost)

**1. Google Maps / Places API**
```
API: Google Places API ($0.017 per search)
Search Strategy:
  - Business types: coffee shops, fitness studios, salons, boutiques
  - Location radius: 25 miles from station broadcast area
  - Rating: 4.0+ stars
  - Review count: 50+ reviews

Filters:
  ✅ Locally owned (not national chains)
  ✅ High rating (4+ stars)
  ✅ Active (has recent reviews)
  ✅ Has phone number

Monthly Yield: 500-800 qualified leads
Cost: ~$10-15/month (1,000 searches)
```

**2. Yelp Business Search**
```
API: Yelp Fusion API (Free tier: 5,000 calls/day)
Search Strategy:
  - Categories: restaurants, retail, services, nightlife
  - Location: Target cities
  - Price: $$ or $$$ (can afford $100-500/mo)
  - Rating: 4+ stars

Extract:
  ✅ Business name
  ✅ Category
  ✅ Phone & address
  ✅ Owner name (sometimes in reviews)

Monthly Yield: 400-600 qualified leads
Cost: Free
```

**3. Chamber of Commerce Directories**
```
Sources:
  - Local Chamber of Commerce member lists
  - Business improvement districts (BIDs)
  - Downtown associations
  - Industry associations

Access: Most have public directories
Extract:
  ✅ Business name
  ✅ Contact person
  ✅ Email
  ✅ Phone

Monthly Yield: 200-400 qualified leads
Cost: Free (some charge for CSV export: $50-200)
```

**4. Instagram Business Accounts**
```
API: Instagram Graph API (Free)
Search Strategy:
  - Location tags: Target cities
  - Business accounts only
  - Hashtags: #shoplocal #supportlocal #smallbusiness
  - Engagement: Active following

Filters:
  ✅ Has business category
  ✅ 500+ followers
  ✅ Posts regularly
  ✅ Has contact button

Monthly Yield: 300-500 qualified leads
Cost: Free
```

**5. ZoomInfo / Apollo.io**
```
Service: B2B contact database
Filter by:
  - Location
  - Industry
  - Company size (5-50 employees)
  - Revenue ($500K-$5M)

Export:
  ✅ Owner/manager name
  ✅ Email (verified)
  ✅ Phone (direct)
  ✅ Company info

Monthly Yield: 500-1,000 qualified leads
Cost: $99-199/month (Apollo.io basic)
```

**6. LinkedIn Sales Navigator**
```
Service: LinkedIn premium for B2B
Search:
  - Job title: Owner, Manager, Marketing Director
  - Location: Target cities
  - Company size: 5-50 employees
  - Industries: Retail, Food & Beverage, Services

Extract:
  ✅ Full name
  ✅ Email (via InMail or found on company site)
  ✅ Company details
  ✅ Recent activity

Monthly Yield: 300-600 qualified leads
Cost: $99/month
```

**7. Event Sponsors & Community Partners**
```
Sources:
  - Local festival sponsor lists
  - Concert venue sponsors
  - Community event partners
  - Charity event sponsors

Logic: If they sponsor music events, they'll sponsor radio
Monthly Yield: 50-150 qualified leads
Cost: Free (manual research)
```

#### Total Sponsor Discovery Capacity
```
Google Places:    500-800/month
Yelp:            400-600/month
Chamber of Comm: 200-400/month
Instagram:       300-500/month
Apollo.io:       500-1,000/month
LinkedIn:        300-600/month
Event Sponsors:   50-150/month
------------------------
TOTAL:          2,250-4,050 new leads/month

Conversion Rate: 5-10% (discovery → closed)
Active Sponsors Gained: 113-405/month

Time to 1,000 sponsors: 2.5-9 months
```

---

### Elliot's Team - Listener Growth

**Mission:** Grow to 50,000+ monthly listeners

#### Primary Sources (Free/Organic)

**1. Artist Live Shows (Primary Driver)**
```
Method: Artists use 9-word line at every show
Math:
  - 850 artists × 3 shows/month = 2,550 shows/month
  - Average attendance: 50-200 people
  - Conversion rate: 5-10%

Monthly New Listeners: 6,375-51,000
Cost: $0 (artists do the work)
Quality: Very high (pre-qualified music fans)
```

**2. Artist Social Media**
```
Method: Artists share TrueFans CONNECT on their socials
Reach:
  - 850 artists × avg 2,000 followers = 1.7M reach
  - Cross-posting bonus (fans follow multiple artists)
  - Stories, posts, reels

Monthly New Listeners: 500-2,000
Cost: $0 (organic sharing)
```

**3. Sponsor Cross-Promotion**
```
Method: Sponsors mention station in their marketing
Examples:
  - "As featured on TrueFans RADIO"
  - QR codes in coffee shops
  - Table tents in restaurants
  - Social media shoutouts

Math:
  - 1,000 sponsors × 500 avg customers/week = 500K weekly impressions
  - Conversion: 0.5-1%

Monthly New Listeners: 1,000-2,000
Cost: $0 (included in sponsorship)
```

**4. TikTok Viral Content**
```
Strategy: Post artist success stories
Content Ideas:
  - "Local artist made $400 from fans in ONE NIGHT"
  - Behind-the-scenes of live shows
  - Fan donation reveals
  - Artist reactions to first pool payout

Potential: One viral video = 10K-100K+ listeners
Monthly New Listeners: 2,000-20,000 (if content hits)
Cost: $0 (in-house content creation)
```

**5. Instagram Reels / Stories**
```
Strategy: Daily content featuring artists
Content:
  - Artist spotlight videos
  - Show announcements
  - Donation celebration posts
  - Pool distribution announcements

Monthly New Listeners: 1,000-3,000
Cost: $0 (organic)
```

**6. YouTube Shorts**
```
Strategy: Repurpose TikTok content
Content: Same as TikTok strategy
Additional Reach: YouTube algorithm favors music content
Monthly New Listeners: 500-2,000
Cost: $0
```

**7. Reddit Community Building**
```
Communities:
  - r/WeAreTheMusicMakers (500K members)
  - r/indieheads (2M members)
  - r/Music (32M members)
  - Local city subreddits

Strategy: Share artist success stories, pool distributions
Monthly New Listeners: 500-1,500
Cost: $0 (organic posting)
```

**8. Podcast Cross-Promotion**
```
Method: Partner with music industry podcasts
Strategy:
  - Guest appearances
  - Ad swaps (we promote them, they promote us)
  - Artist interviews

Monthly New Listeners: 200-1,000
Cost: $0 (time/relationship building)
```

#### Paid Acquisition (Optional)

**9. Facebook/Instagram Ads**
```
Target: Music fans aged 18-35 in broadcast areas
Budget: $1,000/month
Expected CPA: $0.50-$1.00 per listener
Monthly New Listeners: 1,000-2,000
ROI: High (music fans likely to donate)
```

**10. Spotify Ad Studio**
```
Target: Indie music listeners
Budget: $500/month
Format: Audio ads between songs
Monthly New Listeners: 500-1,000
```

**11. YouTube Pre-Roll**
```
Target: Music video watchers
Budget: $500/month
Monthly New Listeners: 400-800
```

#### Total Listener Growth Capacity
```
Artist Shows:     6,375-51,000/month 🔥
Artist Social:      500-2,000/month
Sponsor Promo:    1,000-2,000/month
TikTok:           2,000-20,000/month
Instagram:        1,000-3,000/month
YouTube:            500-2,000/month
Reddit:             500-1,500/month
Podcasts:           200-1,000/month
FB/IG Ads:        1,000-2,000/month (paid)
Spotify Ads:        500-1,000/month (paid)
YouTube Ads:        400-800/month (paid)
------------------------
TOTAL (Organic):  12,075-82,500/month
TOTAL (w/ Paid):  13,975-86,300/month

Retention Rate: 60% (30-day)
Net Monthly Growth: 8,385-51,780 listeners

Time to 50,000 listeners: 1-6 months
```

---

## Data Sourcing Cost Summary

### Riley's Team (Artists)
```
Instagram API:        Free
TikTok API:          Free
Spotify API:         Free
Web scraping:        Free (server costs only)
Directories:         Free
Referrals:           $50 per successful referral

Total Monthly Cost: $0-1,000 (mostly referral bonuses)
Cost per Artist:    $0-5
```

### Harper's Team (Sponsors)
```
Google Places API:   ~$15/month
Yelp API:           Free
Chamber of Comm:    $0-200 (one-time for CSV)
Instagram API:      Free
Apollo.io:          $99-199/month (optional)
LinkedIn:           $99/month (optional)

Total Monthly Cost: $15-513
Cost per Sponsor:   $0.05-$0.25
```

### Elliot's Team (Listeners)
```
Organic methods:    Free
Paid ads:           $2,000/month (optional)

Total Monthly Cost: $0-2,000
Cost per Listener:  $0-0.15
```

### Total Platform Data Sourcing
```
Minimum (all free):     $15/month
Recommended (w/ tools): $500-1,500/month
With paid ads:          $2,500-3,500/month

ROI: Massive (acquiring customers that generate $200K+/month)
```

---

## Quick Start Guide

### For Riley's Team
1. Set up Instagram Business Account
2. Get Instagram Graph API access
3. Set up TikTok for Developers account
4. Create Spotify Developer account
5. Start with manual Instagram searches while APIs set up
6. Goal: 20-30 artist leads per day

### For Harper's Team
1. Get Google Places API key ($15/month)
2. Use Yelp API (free tier)
3. Manual Google Maps searches to start
4. Consider Apollo.io ($99/month) for high volume
5. Goal: 30-50 sponsor leads per day

### For Elliot's Team
1. Create TikTok, Instagram, YouTube accounts
2. Start posting artist success stories
3. Optimize for viral potential
4. Work with artists to cross-promote
5. Goal: 500+ new listeners per week (organic)

---

**Next Steps:**
1. I'll create the revenue breakdown page
2. Update payment references to Manifest Financial
3. Update all 9-word line references
4. Create Manifest Financial integration guide
