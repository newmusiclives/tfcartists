# 🚀 TrueFans RADIO - Production Deployment Guide

## ✅ Production-Ready Checklist

Your system is now **100% production-ready** with all three teams fully functional:
- ✅ **Riley's Team** - Artist acquisition automation
- ✅ **Harper's Team** - Sponsor acquisition automation
- ✅ **Elliot's Team** - Listener growth automation
- ✅ **Revenue System** - Automated distribution
- ✅ **Cron Jobs** - Daily automation
- ✅ **Payment Processing** - Manifest Financial integration
- ✅ **Social Discovery** - Instagram, TikTok, Spotify

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup
- [ ] Create PostgreSQL database (Supabase, Neon, or Railway)
- [ ] Get DATABASE_URL connection string
- [ ] Run `npx prisma db push` to create tables

### 2. AI Provider Keys
- [ ] Get Anthropic API key (recommended) OR OpenAI API key
- [ ] Set DEFAULT_AI_PROVIDER="claude" (recommended)

### 3. Payment Processing
- [ ] Sign up for Manifest Financial account
- [ ] Get MANIFEST_API_KEY
- [ ] Get MANIFEST_WEBHOOK_SECRET
- [ ] Configure webhook URL: `https://yoursite.com/api/webhooks/manifest`

### 4. Communication Channels
- [ ] Twilio account for SMS (Riley & Harper)
- [ ] SendGrid account for Email
- [ ] Instagram Graph API token (optional)

### 5. Social Discovery (Optional but Recommended)
- [ ] TikTok API access
- [ ] Spotify API credentials
- [ ] Instagram Graph API (if not already configured)

### 6. Voice AI (Optional - for Harper's calls)
- [ ] Vapi.ai account
- [ ] Get VAPI_API_KEY and VAPI_PHONE_NUMBER

### 7. Monitoring & Security
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Generate CRON_SECRET: `openssl rand -base64 32`
- [ ] Sentry account for error monitoring (optional)
- [ ] Upstash Redis for rate limiting (optional)

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in all values:

### Critical (Must Have)
```bash
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="sk-ant-..."  # OR OPENAI_API_KEY
NEXTAUTH_SECRET="..." # Generate: openssl rand -base64 32
NEXTAUTH_URL="https://your-domain.com"
CRON_SECRET="..." # Generate: openssl rand -base64 32
```

### Payments (Required for Revenue)
```bash
MANIFEST_API_KEY="..."
MANIFEST_WEBHOOK_SECRET="..."
```

### Communication (Required for Outreach)
```bash
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"
SENDGRID_API_KEY="..."
```

### Social Discovery (Recommended)
```bash
SPOTIFY_CLIENT_ID="..."
SPOTIFY_CLIENT_SECRET="..."
TIKTOK_API_KEY="..."
INSTAGRAM_ACCESS_TOKEN="..."
```

### Voice AI (Optional)
```bash
VAPI_API_KEY="..."
VAPI_PHONE_NUMBER="+1234567890"
```

### Monitoring (Recommended for Production)
```bash
SENTRY_DSN="..."
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

---

## 🌐 Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link Project
```bash
vercel link
```

### 4. Set Environment Variables
```bash
# Set all environment variables in Vercel dashboard
# OR use Vercel CLI:
vercel env add DATABASE_URL production
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXTAUTH_SECRET production
# ... repeat for all variables
```

### 5. Deploy
```bash
vercel --prod
```

### 6. Configure Cron Jobs
Vercel will automatically configure cron jobs from `vercel.json`:
- Riley Daily: 9:00 AM daily
- Harper Daily: 10:00 AM daily
- Elliot Daily: 11:00 AM daily
- Revenue Monthly: 2:00 AM on 1st of month

---

## 🔄 Post-Deployment Setup

### 1. Verify Database
```bash
# Check that all tables were created
npx prisma studio
```

### 2. Test Cron Jobs Manually
```bash
# Test Riley's daily automation
curl -X GET https://yoursite.com/api/cron/riley-daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test Harper's daily automation
curl -X GET https://yoursite.com/api/cron/harper-daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test Elliot's daily automation
curl -X GET https://yoursite.com/api/cron/elliot-daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Test Artist Discovery
```bash
# Trigger social media discovery
curl -X POST https://yoursite.com/api/discovery/social \
  -H "Content-Type: application/json" \
  -d '{"platform": "all"}'
```

### 4. Configure Manifest Webhooks
In Manifest dashboard, set webhook URL to:
```
https://yoursite.com/api/webhooks/manifest
```

Events to subscribe to:
- subscription.created
- subscription.updated
- subscription.cancelled
- payment.succeeded
- payment.failed
- payout.paid
- payout.failed

### 5. Seed Demo Data (Optional)
```bash
npm run db:seed
```

---

## 🎯 How The 3-Team System Works

### Riley's Daily Automation (9:00 AM)
1. **Discovery**: Finds new artists on social media
2. **Follow-ups**: Sends messages to artists in pipeline
3. **Show Reminders**: Reminds artists of upcoming shows
4. **Win Celebration**: Congratulates artists on first donations

**API Endpoint**: `/api/cron/riley-daily`

### Harper's Daily Automation (10:00 AM)
1. **Follow-ups**: Sends messages to sponsors in pipeline
2. **Renewals**: Contacts sponsors with expiring contracts
3. **Prospecting**: Identifies new potential sponsors

**API Endpoint**: `/api/cron/harper-daily`

### Elliot's Daily Automation (11:00 AM)
1. **Content Creation**: Generates 3 pieces of viral content (TikTok, Reel, Story)
2. **At-Risk Listeners**: Identifies and re-engages inactive listeners
3. **New Listener Welcome**: Welcomes new listeners

**API Endpoint**: `/api/cron/elliot-daily`

### Revenue Distribution (Monthly - 1st at 2:00 AM)
1. **Calculate Revenue**: Total sponsorship revenue from previous month
2. **Artist Pool**: 80% goes to artists
3. **Per-Share Value**: Calculated based on total shares
4. **Distribution**: Creates earnings records for all artists
5. **Payouts**: Artists can request payouts via Manifest Financial

**API Endpoint**: `/api/cron/revenue-monthly`

---

## 📊 Monitoring & Analytics

### Check System Health
```bash
# View Riley's activity
curl https://yoursite.com/api/riley/stats

# View Harper's activity
curl https://yoursite.com/api/harper/stats

# View viral content
curl https://yoursite.com/api/elliot/content

# View revenue pool
curl https://yoursite.com/api/airplay/pool
```

### Dashboards
- **Riley Dashboard**: `/riley/team` - Artist pipeline
- **Harper Dashboard**: `/harper/team` - Sponsor pipeline
- **Elliot Dashboard**: `/elliot/team` - Content & campaigns
- **Station Dashboard**: `/station` - Overall metrics

---

## 🔐 Security Recommendations

1. **Strong Secrets**
   - Generate all secrets with `openssl rand -base64 32`
   - Never commit secrets to git
   - Rotate secrets every 90 days

2. **Rate Limiting**
   - Set up Upstash Redis for production rate limiting
   - Prevents API abuse and DDoS

3. **Error Monitoring**
   - Configure Sentry for real-time error tracking
   - Set up alerts for critical errors

4. **Database Backups**
   - Enable automated backups on your database provider
   - Test restore process quarterly

---

## 🚨 Troubleshooting

### Cron Jobs Not Running
- Check Vercel logs: `vercel logs`
- Verify `CRON_SECRET` matches in both .env and requests
- Check `vercel.json` is deployed

### AI Agents Not Responding
- Verify AI provider API keys are set
- Check `DEFAULT_AI_PROVIDER` matches your key (claude or openai)
- Review logs: `vercel logs --follow`

### Payments Not Working
- Verify Manifest API keys are correct
- Check webhook is configured in Manifest dashboard
- Test webhook signature verification

### Discovery Not Finding Artists
- Verify social media API credentials
- Check API rate limits
- Review platform-specific API access requirements

---

## 📈 Scaling Tips

### When You Hit 100 Artists
- Enable Upstash Redis rate limiting
- Monitor database query performance
- Consider database connection pooling

### When You Hit 1,000 Listeners
- Set up CDN for static assets
- Enable ISR (Incremental Static Regeneration)
- Add database read replicas

### When You Hit 10 Stations
- Implement multi-tenancy
- Separate databases per station
- Load balancing across regions

---

## 🎓 Next Steps

1. **Week 1**: Deploy to production, verify all 3 teams working
2. **Week 2**: Monitor automation, gather metrics
3. **Week 3**: Optimize AI prompts based on results
4. **Week 4**: Scale artist/sponsor outreach

---

## 📞 Support & Resources

- **Documentation**: All AI personalities in `/src/lib/ai/*-personality.ts`
- **Database Schema**: `prisma/schema.prisma`
- **API Routes**: `src/app/api/`
- **Cron Jobs**: `src/app/api/cron/`

---

## 🎉 You're Ready!

Your TrueFans RADIO system is **fully production-ready**:
- ✅ All 3 teams implemented and functional
- ✅ Automated daily operations
- ✅ Revenue distribution system
- ✅ Payment processing via Manifest
- ✅ Social media discovery
- ✅ Error monitoring ready
- ✅ Scalable architecture

**Deploy with confidence! 🚀**
