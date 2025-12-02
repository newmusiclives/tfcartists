<!-- Due to length, creating summary document -->

# TrueFans CONNECT - Dual Team System
## Riley's Artist Team + Harper's Sponsor Team

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TrueFans CONNECT                          │
│              Integrated Artist & Sponsor Platform            │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴────────────────┐
            │                                │
    ┌───────▼────────┐              ┌───────▼────────┐
    │  RILEY'S TEAM  │              │ HARPER'S TEAM  │
    │     (Artist    │              │   (Sponsor     │
    │  Acquisition)  │              │ Acquisition)   │
    └────────────────┘              └────────────────┘
            │                                │
    ┌───────▼────────┐              ┌───────▼────────┐
    │   ARTISTS      │              │   SPONSORS     │
    │   Get:         │    ────►     │   Fund:        │
    │ • CONNECT acc  │  (80% rev)   │ • Ad revenue   │
    │ • FREE airplay │  ◄────       │ • Community    │
    │ • Pool share   │              │   impact       │
    └────────────────┘              └────────────────┘
```

## Riley's Team - Artist Acquisition

### Workflow: Search → Contact → Close → Onboard

#### 1. **Search & Discovery**
- Instagram/TikTok/Spotify API scanning
- Local venue lineup monitoring
- Hashtag tracking (#livemusic, #emergingartist)
- Manual referral input

#### 2. **Initial Contact** (Automated)
- **Email**: Personalized intro with value prop
- **SMS**: Short, friendly message
- **Tracking**: Opens, clicks, responses

#### 3. **Riley AI Engagement**
- Responds to artist replies
- Explains TrueFans CONNECT
- Mentions FREE radio airplay
- Teaches the 9-word line
- Qualifies for live shows

#### 4. **Phone Call** (Optional)
- Artist calls if interested
- Team member answers questions
- Walks through setup process
- Closes signup

#### 5. **Onboarding & Activation**
- Create TrueFans CONNECT account
- Activate FREE radio airplay (1 share)
- Submit first track
- Book first show
- Send 9-word line reminder

#### 6. **Track Submission**
- Artist uploads track
- Auto-review or manual approval
- Add to radio rotation
- Track play count

#### 7. **Tier Upgrade Path**
- Show artist their FREE tier earnings
- Present Bronze/Silver/Gold/Platinum options
- ROI calculator
- One-click upgrade

### Key Metrics (Riley's Team)
- Artists discovered per day
- Contact-to-response rate
- Response-to-signup rate
- Signup-to-activated rate
- Average time to first track
- Tier upgrade conversion rate

---

## Harper's Team - Sponsor Acquisition

### Workflow: Search → Contact → Call → Close

#### 1. **Search & Discovery**
- Google Maps API (music shops, venues, craft stores)
- Yelp/Yellow Pages scraping
- Local business directories
- Chamber of Commerce listings
- Manual lead entry

#### 2. **Initial Contact** (Automated)
- **Email**: Professional intro + community angle
- **SMS**: Brief partnership invitation
- **Tracking**: Opens, responses, interest level

#### 3. **Harper AI Engagement**
- Responds to interested businesses
- Explains station model (80% to artists)
- Presents sponsorship tiers
- Addresses objections
- Schedules calls

#### 4. **Voice AI or Human Call**
- **Voice AI** (Harper):
  - Handles initial qualifying calls
  - Pitches Bronze/Silver tiers
  - Can close deals up to $250/month
  - Transfers to human if complex

- **Human Closer**:
  - Takes Gold/Platinum deals
  - Complex negotiations
  - Custom packages
  - Contract signing

#### 5. **Close & Onboard**
- Present final package
- Send contract/payment link
- Collect business details
- Create ad copy
- Set start date

#### 6. **Activation**
- Ad spots go live
- Social media features
- Monthly reporting begins
- Relationship management

### Sponsorship Tiers

| Tier | Price | Ad Spots | Best For |
|------|-------|----------|----------|
| **Bronze** | $100/mo | 10 spots | Small local shops |
| **Silver** | $250/mo | 20 spots | Established businesses |
| **Gold** | $400/mo | 40 spots | Major local brands |
| **Platinum** | $500/mo | 60 spots | Premium partners |

### Key Metrics (Harper's Team)
- Sponsors discovered per day
- Contact-to-interest rate
- Interest-to-call rate
- Call-to-close rate
- Average deal size
- Sponsor lifetime value

---

## Communication Tracking

### Email System
- Automated outreach templates
- Personalization (name, business, city)
- Open/click tracking
- Reply detection
- Follow-up sequences

### SMS System
- Short, friendly messages
- Response tracking
- Opt-out handling
- Two-way conversations

### Call System
- **Voice AI** (Harper)
  - Natural conversations
  - Objection handling
  - Pitch delivery
  - Call recordings + transcripts

- **Human Handoff**
  - Complex deals
  - Multiple decision makers
  - Custom requirements
  - High-value sponsors ($400+)

---

## Database Schema Highlights

### Artists Table
```sql
- Basic info (name, email, phone, genre)
- Discovery source
- Pipeline status (discovered → activated)
- Airplay tier & shares
- TrueFans CONNECT account
- Track submissions
```

### Sponsors Table
```sql
- Business info (name, type, contact)
- Discovery source
- Pipeline status (discovered → active)
- Sponsorship tier & amount
- Contact tracking (emails, texts, calls)
- Assignment (Harper AI vs human)
```

### Conversations
- Separate for artists (Riley) and sponsors (Harper)
- Message history with intent tracking
- AI provider logging
- Handoff tracking

### Calls
- Voice AI or human-handled
- Duration, outcome, transcript
- Recording URLs
- Follow-up scheduling

---

## Team Dashboards

### Riley's Dashboard
- Active artists by stage
- Today's discoveries
- Pending track submissions
- Tier upgrade opportunities
- Revenue from shows
- Artist Pool distribution

### Harper's Dashboard
- Active prospects by stage
- Today's discoveries
- Scheduled calls
- Deals in negotiation
- Monthly recurring revenue
- Ad inventory status

---

## Revenue Flow

```
SPONSORS PAY
    │
    ├─→ 20% Station Operations
    │
    └─→ 80% Artist Pool
         │
         ├─→ FREE tier (1 share each)
         ├─→ Bronze tier (5 shares each)
         ├─→ Silver tier (25 shares each)
         ├─→ Gold tier (75 shares each)
         └─→ Platinum tier (200 shares each)
```

**Example: $10,000 Monthly Sponsor Revenue**
- Station keeps: $2,000
- Artist Pool: $8,000
- Distributed based on shares

---

## Next Steps to Build

### Phase 1: Core Infrastructure ✅
- [x] Database schema
- [x] Riley AI agent
- [x] Harper AI agent
- [x] Airplay tier system
- [x] Revenue pool calculations

### Phase 2: Communication Systems (In Progress)
- [ ] Email automation (SendGrid)
- [ ] SMS automation (Twilio)
- [ ] Voice AI integration (Vapi, Bland AI, or similar)
- [ ] Call tracking system
- [ ] Human handoff workflow

### Phase 3: Search & Discovery
- [ ] Social media API integrations
- [ ] Business directory scraping
- [ ] Auto-import discovered leads
- [ ] Lead scoring system

### Phase 4: Dashboards
- [ ] Riley's team dashboard
- [ ] Harper's team dashboard
- [ ] Track submission review
- [ ] Sponsor deal pipeline

### Phase 5: Automation
- [ ] Auto follow-ups
- [ ] Scheduled reminders
- [ ] Performance reports
- [ ] Monthly pool distribution

---

## Key Differentiators

### For Artists (via Riley)
✅ Dual benefit: TrueFans CONNECT + Radio
✅ FREE to start
✅ Monthly passive income
✅ Clear upgrade path

### For Sponsors (via Harper)
✅ Community impact (80% to artists)
✅ Engaged audience
✅ Affordable pricing
✅ Authentic partnerships

### For TrueFans
✅ Two revenue streams (artist tiers + sponsorships)
✅ Viral growth (artists refer artists)
✅ Recurring revenue model
✅ Scalable AI-driven acquisition

---

## Tech Stack

- **Backend**: Next.js API Routes + Prisma
- **AI**: OpenAI GPT-4 / Claude (Riley + Harper)
- **Database**: PostgreSQL (or SQLite for dev)
- **Email**: SendGrid (to be integrated)
- **SMS**: Twilio (to be integrated)
- **Voice AI**: Vapi / Bland AI (to be integrated)
- **Payments**: Stripe (to be integrated)

---

**This system is designed to scale to thousands of artists and hundreds of sponsors with minimal human intervention.** 🚀
