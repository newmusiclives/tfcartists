# 🚀 TrueFans RADIO - Netlify Deployment Guide

## ✅ Netlify-Specific Configuration Complete

Your TrueFans RADIO system is now configured for Netlify deployment with:
- ✅ `netlify.toml` configuration file
- ✅ 4 Scheduled Functions (cron jobs)
- ✅ Next.js optimization via `@netlify/plugin-nextjs`
- ✅ Security headers configured
- ✅ API route redirects

---

## 🎯 Quick Deploy to Netlify

### Option 1: Deploy via Netlify CLI (Recommended)

```bash
# 1. Install Netlify CLI globally
npm install -g netlify-cli

# 2. Login to Netlify
netlify login

# 3. Initialize your site
netlify init

# 4. Deploy to production
netlify deploy --prod
```

### Option 2: Deploy via Git (Automatic)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify Dashboard](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your Git repository
5. Netlify will auto-detect Next.js and configure build settings
6. Click "Deploy site"

---

## 🔧 Environment Variables Setup

### In Netlify Dashboard:

1. Go to **Site settings → Environment variables**
2. Add all required variables:

### Critical (Must Have):
```bash
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
NEXTAUTH_SECRET=... # Generate: openssl rand -base64 32
NEXTAUTH_URL=https://your-netlify-site.netlify.app
CRON_SECRET=... # Generate: openssl rand -base64 32
```

### Payments (Required for Revenue):
```bash
MANIFEST_API_KEY=...
MANIFEST_WEBHOOK_SECRET=...
```

### Communication (Required for Outreach):
```bash
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=...
```

### Social Discovery (Recommended):
```bash
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
TIKTOK_API_KEY=...
INSTAGRAM_ACCESS_TOKEN=...
```

### Voice AI (Optional):
```bash
VAPI_API_KEY=...
VAPI_PHONE_NUMBER=+1234567890
```

### Monitoring (Recommended):
```bash
SENTRY_DSN=...
```

---

## ⏰ Scheduled Functions (Cron Jobs)

### Important: Scheduled Functions require **Netlify Pro plan or higher**

Your scheduled functions are configured in `netlify.toml`:

| Function | Schedule | Time (UTC) | Purpose |
|----------|----------|------------|---------|
| riley-daily | `0 9 * * *` | 9:00 AM | Artist discovery & outreach |
| harper-daily | `0 10 * * *` | 10:00 AM | Sponsor follow-ups & renewals |
| elliot-daily | `0 11 * * *` | 11:00 AM | Content generation & listener engagement |
| revenue-monthly | `0 2 1 * *` | 2:00 AM (1st) | Monthly revenue distribution |

**Note**: Times are in UTC. Adjust timezone as needed:
- PST (UTC-8): Use hour + 8
- EST (UTC-5): Use hour + 5
- CST (UTC-6): Use hour + 6

### Verify Scheduled Functions:

After deployment, check:
```bash
netlify functions:list
```

### Manually Trigger for Testing:

```bash
# Test Riley's daily automation
netlify functions:invoke riley-daily

# Test Harper's daily automation
netlify functions:invoke harper-daily

# Test Elliot's daily automation
netlify functions:invoke elliot-daily

# Test revenue distribution
netlify functions:invoke revenue-monthly
```

---

## 🔄 Post-Deployment Setup

### 1. Verify Build Success

Check the Netlify build logs:
```bash
netlify logs
```

### 2. Set Up Database

```bash
# Run Prisma migrations
npx prisma db push

# Seed demo data (optional)
npm run db:seed
```

### 3. Configure Manifest Webhooks

In your Manifest Financial dashboard, set webhook URL to:
```
https://your-site.netlify.app/api/webhooks/manifest
```

Subscribe to these events:
- subscription.created
- subscription.updated
- subscription.cancelled
- payment.succeeded
- payment.failed
- payout.paid
- payout.failed

### 4. Test API Routes

```bash
# Test health check
curl https://your-site.netlify.app/api/health

# Test Riley's stats
curl https://your-site.netlify.app/api/riley/stats

# Test Harper's stats
curl https://your-site.netlify.app/api/harper/stats

# Test Elliot's content
curl https://your-site.netlify.app/api/elliot/content
```

### 5. Test Cron Jobs (If on Pro Plan)

```bash
# Manually trigger Riley
curl -X GET https://your-site.netlify.app/api/cron/riley-daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check Netlify function logs
netlify functions:log riley-daily
```

---

## 🎯 Netlify-Specific Features

### Automatic Deploys

Every push to your main branch triggers a new deployment:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Netlify automatically deploys!
```

### Deploy Previews

Every pull request gets a unique preview URL:
- Perfect for testing before merging
- Share with team for review

### Build Plugins

Your site uses `@netlify/plugin-nextjs` for:
- Optimized Next.js builds
- Automatic ISR (Incremental Static Regeneration)
- Edge function support
- Image optimization

### Edge Functions (Optional Upgrade)

For even better performance, you can migrate hot paths to Edge Functions:
- Geolocation-based routing
- A/B testing
- Personalization

---

## 🚨 Troubleshooting

### Build Fails

**Issue**: Build fails with "Module not found"
**Solution**: 
```bash
# Clear Netlify cache and rebuild
netlify build --clear-cache
```

**Issue**: Database connection fails during build
**Solution**: 
- Make sure `DATABASE_URL` is set as environment variable
- For build-time issues, set build environment in `netlify.toml`

### Scheduled Functions Not Running

**Issue**: Cron jobs don't execute
**Solution**:
1. Verify you're on Netlify Pro plan or higher
2. Check function logs: `netlify functions:log riley-daily`
3. Verify `CRON_SECRET` matches in environment variables
4. Test manually: `netlify functions:invoke riley-daily`

### API Routes Return 404

**Issue**: `/api/*` routes not found
**Solution**: 
- Verify `netlify.toml` has the API redirect rules
- Check that `@netlify/plugin-nextjs` is installed
- Redeploy the site

### Functions Timeout

**Issue**: Functions timeout after 10 seconds
**Solution**:
- Pro plan: 26 second timeout
- Business plan: 100 second timeout
- Optimize slow operations
- Consider background jobs for long-running tasks

---

## 📊 Monitoring on Netlify

### Function Logs

View real-time logs:
```bash
# All functions
netlify functions:list

# Specific function logs
netlify functions:log riley-daily --follow
```

### Analytics

Enable Netlify Analytics in dashboard:
- Site settings → Analytics → Enable

Track:
- Page views
- Top pages
- Traffic sources
- Device types

### Error Tracking

Recommended: Integrate Sentry for detailed error tracking
- Set `SENTRY_DSN` environment variable
- Errors automatically captured and reported

---

## 💰 Netlify Pricing Considerations

### Starter (Free):
- ✅ Unlimited sites
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ❌ No scheduled functions

### Pro ($19/month):
- ✅ Scheduled functions (cron jobs) ← **Required for automation**
- ✅ 1 TB bandwidth/month
- ✅ 25,000 build minutes/month
- ✅ Background functions

### Business ($99/month):
- ✅ Everything in Pro
- ✅ 100-second function timeout
- ✅ Priority support

**Recommendation**: Start with Pro plan for the automated cron jobs.

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Generate secure secrets
openssl rand -base64 32

# Never commit to git
# Set in Netlify Dashboard only
```

### 2. Function Security

Your functions are protected by:
- CRON_SECRET for scheduled functions
- NEXTAUTH for authenticated routes
- Rate limiting (if configured)

### 3. Webhook Security

Manifest webhooks are verified using:
- Signature verification in `/api/webhooks/manifest`
- MANIFEST_WEBHOOK_SECRET

### 4. HTTPS

- All Netlify sites have automatic HTTPS
- Free SSL certificates via Let's Encrypt
- Automatic renewal

---

## 🎓 Next Steps

### Week 1: Deploy & Verify
```bash
# 1. Deploy to Netlify
netlify deploy --prod

# 2. Set all environment variables
# (via Netlify Dashboard)

# 3. Verify build success
netlify logs

# 4. Test API routes
curl https://your-site.netlify.app/api/health
```

### Week 2: Enable Automation
```bash
# 1. Upgrade to Netlify Pro (for scheduled functions)
# 2. Verify cron jobs are scheduled
netlify functions:list

# 3. Manually test each cron job
netlify functions:invoke riley-daily
netlify functions:invoke harper-daily
netlify functions:invoke elliot-daily
```

### Week 3: Monitor & Optimize
```bash
# 1. Check function logs daily
netlify functions:log riley-daily

# 2. Monitor error rates
# (Sentry dashboard)

# 3. Review performance
# (Netlify Analytics)
```

### Week 4: Scale
- Add more artists/sponsors
- Increase outreach limits
- Optimize slow queries
- Consider edge functions for hot paths

---

## 📞 Support Resources

- **Netlify Docs**: https://docs.netlify.com
- **Netlify Functions**: https://docs.netlify.com/functions/overview/
- **Netlify Scheduled Functions**: https://docs.netlify.com/functions/scheduled-functions/
- **Next.js on Netlify**: https://docs.netlify.com/integrations/frameworks/next-js/

---

## 🎉 You're Ready to Deploy!

Your TrueFans RADIO system is fully configured for Netlify:
- ✅ Configuration files created
- ✅ Scheduled functions ready
- ✅ Security headers configured
- ✅ Build optimization enabled

**Deploy now and let your AI teams run autonomously! 🚀**

```bash
netlify deploy --prod
```
