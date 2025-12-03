# TrueFans RADIO - Current Project Status

**Last Updated:** December 2025
**Git Commit:** Initial commit with station capacity calculator and dual-team system

---

## ✅ What's Been Built

### 1. **Station Capacity Calculator** (/capacity)
Complete revenue projection system based on airtime constraints:

**Airtime Constraints:**
- 12 tracks per hour → 288 tracks/day → 8,640 tracks/month
- 24 ad spots per hour (15-sec ads) → 576 spots/day → 17,280 spots/month
- Prime hours: 6am-6pm | Subprime: 6pm-6am

**Riley's Team - Artist Capacity:**
- Max capacity: 864 FREE tier artists (10 plays/month minimum)
- Balanced mix: 861 artists → $10,735/month revenue
- Premium mix: 861 artists → $24,960/month revenue
- Share-based distribution: FREE(1), Bronze(5), Silver(25), Gold(75), Platinum(200)

**Harper's Team - Sponsor Capacity:**
- Max Bronze: 1,728 sponsors ($173k/month)
- Max Silver: 864 sponsors ($216k/month)
- Max Gold: 432 sponsors ($173k/month)
- Max Platinum: 288 sponsors ($144k/month)
- Balanced mix: 1,093 sponsors → $186,000/month

**Premium Opportunities:**
- News & Weather: 2 slots × $200 = $400/month
- Sponsored Hours: 8 hours × $500 = $4,000/month
- Week Takeover: 1/month × $2,000 = $2,000/month

**Total Station Revenue:**
- Balanced scenario: $203,135/month
- Premium scenario: $217,360/month
- 80% to Artist Pool, 20% to station operations

### 2. **Database Schema** (Prisma + SQLite)
Complete dual-team pipeline tracking:

**Riley's Team:**
- `Artist` - Full profile with discovery source, pipeline status, airplay tier
- `Conversation` - Multi-channel conversations (SMS, email, Instagram)
- `Message` - Individual messages with intent tracking
- `Show` - Live show tracking with 9-word line usage
- `Donation` - Win tracking and first-win celebrations
- `Referral` - Artist referral system
- `RadioRevenuePool` - Monthly revenue distribution
- `RadioEarnings` - Individual artist earnings
- `TrackSubmission` - Artist track upload and approval

**Harper's Team:**
- `Sponsor` - Business info, contact, pipeline status
- `SponsorConversation` - Email, SMS, Voice AI conversations
- `SponsorMessage` - Message history with intent
- `SponsorCall` - Voice AI or human call tracking
- `Sponsorship` - Active sponsor contracts

### 3. **AI Agent Systems**

**Riley (Artist Acquisition):**
- Personality: Friendly, motivational, artist-focused
- Workflow: Search → Email/SMS → Engage → Book show → Activate
- Automatic FREE airplay activation on first contact
- Intent-based conversation routing
- Teaches 9-word line for live shows
- Celebrates first wins

**Harper (Sponsor Acquisition):**
- Personality: Professional, ROI-focused, community-impact
- Workflow: Search → Contact → Voice AI → Close or human handoff
- Sponsorship packages: Bronze $100 → Platinum $500
- Handles objections, negotiates deals
- Voice AI for simple closes, human for complex deals

**AI Provider Support:**
- OpenAI (GPT-4) and Anthropic (Claude) support
- Abstraction layer for easy switching
- Environment variable configuration

### 4. **Revenue Systems**

**Airplay Tiers:**
- FREE: $0/month, 1 share
- Bronze: $5/month, 5 shares
- Silver: $20/month, 25 shares
- Gold: $50/month, 75 shares
- Platinum: $120/month, 200 shares

**Revenue Pool:**
- 80% of sponsor revenue → Artist Pool
- Distributed by shares (non-linear growth)
- Monthly pool calculations
- Per-share value tracking

**Sponsorship Packages:**
- Bronze: $100/month, 10 ad spots
- Silver: $250/month, 20 ad spots
- Gold: $400/month, 40 ad spots
- Platinum: $500/month, 60 ad spots

### 5. **User Interfaces**

**Pages Built:**
- `/` - Homepage (internal team view)
- `/admin` - Riley's dashboard with artist pipeline
- `/admin/artists` - Full artist list
- `/admin/artists/[id]` - Artist detail page
- `/onboard` - Artist onboarding flow
- `/airplay` - Public airplay tier pricing
- `/capacity` - Station capacity calculator (NEW!)

**Features:**
- Real-time stats and metrics
- Pipeline stage visualization
- Artist conversation history
- Show and donation tracking
- Responsive design with Tailwind CSS

### 6. **API Routes**

**Artist Management:**
- `GET /api/artists` - List artists with filters
- `GET /api/artists/[id]` - Artist details
- `POST /api/riley/outreach` - Send Riley outreach
- `POST /api/riley/message` - Riley conversation

**Airplay System:**
- `GET /api/airplay/pool` - Current revenue pool
- `GET /api/airplay/earnings` - Artist earnings
- `POST /api/airplay/upgrade` - Upgrade tier

**Stats:**
- `GET /api/stats` - Dashboard statistics

### 7. **Documentation**
- `README.md` - Project overview
- `SETUP.md` - Local setup instructions
- `PROJECT-OVERVIEW.md` - System architecture
- `TEAMS-SYSTEM-OVERVIEW.md` - Complete dual-team workflow
- `AIRPLAY-SYSTEM.md` - Revenue pool mechanics
- `CURRENT-STATUS.md` - This file!

---

## 📊 Demo Data

**3 Demo Artists:**
1. **Sarah Miller** (Rock) - ENGAGED status
   - 2 conversations, 1 show scheduled
   - Next show: March 15, 2025 @ The Blue Room, Austin
   - FREE airplay tier (1 share)

2. **Marcus Chen** (Hip-Hop) - QUALIFIED status
   - 1 conversation
   - Silver airplay tier (25 shares), $20/month
   - 15,000 Instagram followers

3. **Luna Star** (Indie Pop) - ACTIVATED status
   - 3 conversations, 2 shows (1 completed)
   - $52.50 total raised
   - Platinum airplay tier (200 shares), $120/month
   - Used 9-word line, first win tracked

---

## 🚧 Not Yet Built (Pending)

### High Priority:
1. **Search/Discovery Systems**
   - Instagram/TikTok/Spotify API integrations (Riley)
   - Google Maps/Yelp business scraping (Harper)
   - Auto-import discovered leads
   - Lead scoring system

2. **Communication Systems**
   - Email automation (SendGrid)
   - SMS automation (Twilio)
   - Voice AI integration (Vapi, Bland AI)
   - Call recording and transcription
   - Human handoff workflow

3. **Team Dashboards**
   - Harper's sponsor dashboard
   - Track submission review interface
   - Sponsor deal pipeline
   - Call management system

4. **Track Submission Workflow**
   - Artist upload interface
   - Review/approval system
   - Add to rotation
   - Play count tracking

### Medium Priority:
5. **Automation**
   - Auto follow-ups
   - Scheduled reminders
   - Performance reports
   - Monthly pool distribution

6. **Analytics**
   - Conversion rate tracking
   - Revenue projections
   - Sponsor ROI reports
   - Artist engagement metrics

### Lower Priority:
7. **Advanced Features**
   - Artist referral rewards
   - Premium sponsor portal
   - Custom ad creative upload
   - Multi-station support

---

## 🔧 Technical Stack

**Framework:** Next.js 15 (App Router)
**Language:** TypeScript
**Database:** SQLite (dev) / PostgreSQL (production ready)
**ORM:** Prisma
**Styling:** Tailwind CSS
**UI Components:** Radix UI
**AI Providers:** OpenAI GPT-4, Anthropic Claude
**Charts:** Recharts (ready to use)

---

## 🚀 How to Start Working Again

### 1. Start the dev server:
```bash
npm run dev
```

### 2. View the app:
- Homepage: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin
- Airplay Tiers: http://localhost:3000/airplay
- **Capacity Calculator:** http://localhost:3000/capacity

### 3. Database management:
```bash
# View database
npm run db:studio

# Add more demo data
npx tsx scripts/seed-demo-data.ts
```

### 4. Next Steps (Recommended):

**Option A - Build Communication Systems:**
Start with email/SMS automation to enable Riley and Harper to actually contact artists and sponsors.

**Option B - Build Search/Discovery:**
Create the discovery engines that find artists on social media and businesses via Google Maps/Yelp.

**Option C - Build Harper's Dashboard:**
Create the sponsor-focused dashboard to manage Harper's team pipeline.

**Option D - Build Track Submission:**
Allow artists to upload tracks and manage the approval workflow.

---

## 📝 Environment Variables Needed

The `.env` file has placeholders. You'll need real API keys for:

```bash
# AI Providers (at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database (already set to SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Future integrations
SENDGRID_API_KEY=      # Email automation
TWILIO_ACCOUNT_SID=    # SMS automation
TWILIO_AUTH_TOKEN=     # SMS automation
VAPI_API_KEY=          # Voice AI calls
```

---

## 💡 Key Design Decisions

1. **SQLite for Development:** Easy local setup, can migrate to PostgreSQL later
2. **Share-based Revenue Pool:** Non-linear growth incentivizes upgrades
3. **Dual AI Support:** Can use OpenAI or Claude based on preference/cost
4. **Intent-based Routing:** Makes AI conversations contextual and trackable
5. **FREE Tier Inclusion:** Removes barrier to entry, builds artist database
6. **Voice AI + Human Handoff:** Scalable automation with quality for complex deals
7. **Prime/Subprime Hours:** Realistic airtime modeling for accurate revenue projections

---

## 📈 Revenue Model Summary

**Riley's Team Revenue:**
- Artist tier subscriptions ($5-$120/month)
- Goes to station operations

**Harper's Team Revenue:**
- Sponsor packages ($100-$500/month regular)
- Premium opportunities ($6,400/month additional)
- 80% → Artist Pool
- 20% → Station operations

**Artist Pool Distribution:**
- Based on shares, not flat rate
- Incentivizes tier upgrades
- Monthly distribution
- Transparent to artists

---

## 🎯 System Status

**Operational:**
- ✅ Database schema and migrations
- ✅ Admin dashboard and artist management
- ✅ Artist onboarding flow
- ✅ Airplay tier system
- ✅ Revenue pool calculations
- ✅ Station capacity calculator
- ✅ Riley AI personality and prompts
- ✅ Harper AI personality and prompts
- ✅ Demo data with 3 artists

**Ready to Integrate:**
- 🟡 Email/SMS communication (API routes exist)
- 🟡 Voice AI calls (schema ready)
- 🟡 Track submission (schema ready)
- 🟡 Sponsor management (schema ready)

**Not Started:**
- 🔴 Search/discovery engines
- 🔴 Communication automation
- 🔴 Harper's dashboard
- 🔴 Voice AI integration
- 🔴 Track upload interface

---

**This project is ready for the next phase of development. All foundation work is complete!**
