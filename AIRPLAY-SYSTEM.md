# TrueFans RADIO Airplay System

## Overview

All artists contacted by Riley automatically get **FREE airplay** on TrueFans RADIO. Artists can upgrade to higher tiers for more rotation and bigger shares of the monthly Artist Pool.

**80% of all ad revenue goes to artists** based on their tier shares.

## Airplay Tiers

### Share Distribution Model

| Tier | Price/Month | Shares | Multiplier | Features |
|------|-------------|--------|------------|----------|
| **FREE** | $0 | 1 | 1x | Basic rotation, Artist Pool share |
| **Bronze** | $5 | 5 | 5x | Priority rotation, Featured spotlight |
| **Silver** | $20 | 25 | 25x | Heavy rotation, Social features, Interviews |
| **Gold** | $50 | 75 | 75x | Power rotation, Show segment, Playlists |
| **Platinum** | $120 | 200 | 200x | Max rotation, Artist takeover, VIP events |

### Why This Structure?

- **Progressive multipliers** incentivize upgrades
- **Non-linear growth** makes higher tiers valuable
- **Free tier included** removes barrier to entry
- **Revenue share aligned** with airplay exposure

## Revenue Pool Distribution

### How It Works

1. **Monthly Ad Revenue** collected from station sponsors
2. **80% goes to Artist Pool** (20% to station operations)
3. **Total shares calculated** from all active artists
4. **Per-share value** = Artist Pool ÷ Total Shares
5. **Artist earnings** = Their shares × Per-share value

### Example Calculation

```
Monthly Ad Revenue: $10,000
Artist Pool (80%): $8,000

Active Artists:
- 50 FREE tier = 50 shares
- 20 Bronze ($5) = 100 shares (20 × 5)
- 15 Silver ($20) = 375 shares (15 × 25)
- 10 Gold ($50) = 750 shares (10 × 75)
- 5 Platinum ($120) = 1,000 shares (5 × 200)

Total Shares: 2,275

Per-Share Value: $8,000 ÷ 2,275 = $3.52

Monthly Earnings by Tier:
- FREE: 1 × $3.52 = $3.52
- Bronze: 5 × $3.52 = $17.60 (ROI: +252%)
- Silver: 25 × $3.52 = $88.00 (ROI: +340%)
- Gold: 75 × $3.52 = $264.00 (ROI: +428%)
- Platinum: 200 × $3.52 = $704.00 (ROI: +487%)
```

## Automatic Activation

When Riley contacts an artist:

1. Artist status changes to **CONTACTED**
2. **FREE airplay automatically activated**
3. Artist added to TrueFans RADIO rotation
4. Gets 1 share in current month's Artist Pool
5. Riley mentions radio benefit in conversation

### Code Flow

```typescript
// In riley-agent.ts
if (intent === "initial_outreach" && !artist.airplayActivatedAt) {
  await activateAirplay(artistId);
}
```

## Tier Upgrade Flow

Artists can upgrade through:

1. **Admin dashboard** (manual upgrade)
2. **Artist portal** (self-service - future)
3. **Direct link from Riley** (automated offer - future)

### Upgrade Process

```typescript
// API: POST /api/airplay/upgrade
{
  "artistId": "xxx",
  "tier": "TIER_20",
  "paymentDetails": {
    "amount": 20,
    "method": "stripe",
    "transactionId": "ch_xxx"
  }
}
```

Updates:
- Artist tier
- Share count
- Payment record
- Riley activity log

## Riley's Radio Messaging

### Initial Outreach
> "Hey — quick q: do you play live shows? Plus you'll get FREE airplay on TrueFans RADIO!"

### Product Education
> "It's TrueFans RADIO — one 9-word line onstage and fans can support you. And you get FREE airplay on TrueFans RADIO — your music goes into rotation immediately."

### Tier Upsell (Future)
> "BTW — you're currently on our FREE tier. Want more rotation? Our Silver tier ($20/mo) gives you 25x more airplay AND 25x more Artist Pool earnings!"

## Database Schema

### Artist Fields
```prisma
airplayTier       AirplayTier @default(FREE)
airplayActivatedAt DateTime?
airplayShares     Int         @default(1)
lastTierUpgrade   DateTime?
```

### AirplayPayment
Tracks monthly payments for paid tiers.

### RadioRevenuePool
Monthly pool tracking:
- Total ad revenue
- Artist pool amount (80%)
- Total shares
- Per-share value
- Tier breakdowns

### RadioEarnings
Individual artist earnings per month:
- Shares
- Calculated earnings
- Payment status

## API Endpoints

### `POST /api/airplay/upgrade`
Upgrade artist tier

### `GET /api/airplay/earnings?artistId=xxx&period=2024-12`
Get artist earnings for a month

### `GET /api/airplay/pool?period=2024-12`
Get revenue pool stats

### `POST /api/airplay/pool/distribute`
Admin: Distribute monthly revenue

## Frontend Pages

### `/airplay`
- Public pricing page
- All 5 tiers displayed
- Earnings calculator
- ROI breakdown
- Sign-up CTA

### Admin Dashboard (Future Enhancement)
- Current tier display
- Month-to-date earnings
- Upgrade options
- Share history
- Pool stats

## Monthly Distribution Process

1. **Calculate total ad revenue** for the month
2. **Run distribution API**:
   ```bash
   POST /api/airplay/pool/distribute
   {
     "period": "2024-12",
     "totalAdRevenue": 10000
   }
   ```
3. **System calculates**:
   - Artist pool (80%)
   - Total active shares
   - Per-share value
4. **Creates earnings records** for each artist
5. **Marks pool as distributed**
6. **Notify artists** (future: email/SMS)

## Growth Projections

### Scenario: 1,000 Active Artists

Tier distribution (estimated):
- 700 FREE (700 shares)
- 200 Bronze (1,000 shares)
- 70 Silver (1,750 shares)
- 20 Gold (1,500 shares)
- 10 Platinum (2,000 shares)

**Total shares: 6,950**

Monthly revenue from tiers:
- Bronze: 200 × $5 = $1,000
- Silver: 70 × $20 = $1,400
- Gold: 20 × $50 = $1,000
- Platinum: 10 × $120 = $1,200

**Total tier revenue: $4,600/month**

Assuming $15,000 in ad revenue:
- Artist Pool: $12,000
- Per-share value: $1.73

Free tier earns: $1.73/mo
Platinum earns: $346/mo

**ROI maintained**: ~189% on Platinum tier

## Key Benefits

### For Artists
✅ FREE tier removes barrier to entry
✅ Immediate airplay on sign-up
✅ Passive monthly income from radio
✅ Clear upgrade path with ROI
✅ Aligned incentives (more airplay = more shares)

### For TrueFans
✅ Differentiated value prop (vs other artist platforms)
✅ Recurring revenue from paid tiers
✅ Artist retention through monthly payouts
✅ Natural upsell path built into Riley's flow
✅ Scales with station growth

### For Fans/Listeners
✅ Discover new artists
✅ Support artists through listening
✅ Higher quality programming (paid tier artists get more rotation)

## Next Steps

### Phase 1 (Complete)
- [x] Database schema
- [x] Tier system with shares
- [x] Revenue pool calculation
- [x] Automatic FREE activation
- [x] Riley mentions radio benefit
- [x] Public pricing page

### Phase 2 (To Build)
- [ ] Stripe integration for upgrades
- [ ] Artist portal to view earnings
- [ ] Monthly email reports
- [ ] Automated tier upsell messaging
- [ ] Public radio player

### Phase 3 (Future)
- [ ] Track play count per artist
- [ ] Dynamic rotation based on tier
- [ ] Artist request/voting system
- [ ] Sponsor integration dashboard

## Testing

Demo artists now have airplay:
- **Sarah Miller**: FREE (1 share)
- **Marcus Chen**: Bronze (5 shares)
- **Luna Star**: Silver (25 shares)

Test the system:
1. Visit http://localhost:3000/airplay
2. See all tier pricing
3. View earnings calculator
4. Check ROI breakdown

---

**This airplay system turns every artist into a recurring revenue opportunity while providing real value through radio exposure and revenue sharing.** 🎵
