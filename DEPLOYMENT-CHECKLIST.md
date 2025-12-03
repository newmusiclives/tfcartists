# 🚀 TrueFans RADIO - Netlify Deployment Checklist

## Pre-Deployment Preparation

### 1. Database Setup
- [ ] Create PostgreSQL database (Supabase/Neon/Railway)
- [ ] Copy DATABASE_URL connection string
- [ ] Test database connectivity locally
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] (Optional) Seed demo data: `npm run db:seed`

### 2. Generate Secrets
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Create strong custom passwords for all team accounts
- [ ] Save all secrets securely (password manager recommended)

### 3. Obtain API Keys
- [ ] Get Anthropic API key from https://console.anthropic.com/
  OR
- [ ] Get OpenAI API key from https://platform.openai.com/
- [ ] (Optional) Get Upstash Redis credentials from https://console.upstash.com/
- [ ] (Optional) Get Twilio credentials for SMS
- [ ] (Optional) Get SendGrid API key for email

### 4. Prepare Repository
- [ ] Push latest code to Git repository (GitHub/GitLab/Bitbucket)
- [ ] Verify `netlify.toml` exists in repository root
- [ ] Verify `next.config.js` exists and is properly configured
- [ ] Ensure `.env` is in `.gitignore` (never commit secrets!)

## Netlify Configuration

### 5. Create Netlify Site
- [ ] Go to https://app.netlify.com
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Connect Git provider and select repository
- [ ] Verify build settings:
  - Build command: `npm run build`
  - Publish directory: `.next`
  - Node version: 22 (set in netlify.toml)

### 6. Configure Environment Variables

**Required Variables:**
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Generated secure random string
- [ ] `NEXTAUTH_URL` - https://your-site.netlify.app
- [ ] `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- [ ] `DEFAULT_AI_PROVIDER` - "claude" or "openai"

**Recommended Variables:**
- [ ] `ADMIN_PASSWORD` - Custom admin password
- [ ] `RILEY_PASSWORD` - Custom Riley password
- [ ] `HARPER_PASSWORD` - Custom Harper password
- [ ] `ELLIOT_PASSWORD` - Custom Elliot password
- [ ] `UPSTASH_REDIS_REST_URL` - For rate limiting
- [ ] `UPSTASH_REDIS_REST_TOKEN` - For rate limiting

**Optional Variables:**
- [ ] `TWILIO_ACCOUNT_SID` - For SMS delivery
- [ ] `TWILIO_AUTH_TOKEN` - For SMS delivery
- [ ] `TWILIO_PHONE_NUMBER` - For SMS delivery
- [ ] `SENDGRID_API_KEY` - For email delivery
- [ ] `RILEY_ACTIVE` - Enable/disable Riley outreach
- [ ] `RILEY_MAX_OUTREACH_PER_DAY` - Outreach limit

### 7. Deploy
- [ ] Click "Deploy site"
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Check deploy logs for any errors
- [ ] Note your Netlify URL (e.g., https://truefans-radio.netlify.app)

## Post-Deployment Verification

### 8. Test Core Functionality
- [ ] Visit home page: https://your-site.netlify.app
- [ ] Test login page: https://your-site.netlify.app/login
- [ ] Login as admin (username: admin, password: from ADMIN_PASSWORD)
- [ ] Verify admin dashboard loads
- [ ] Check that demo data displays (if seeded)
- [ ] Test navigation between pages
- [ ] Verify API routes return data (check /api/artists, /api/stats)

### 9. Test Authentication
- [ ] Login as admin
- [ ] Logout
- [ ] Login as Riley
- [ ] Verify Riley-specific pages work
- [ ] Login as Harper
- [ ] Verify Harper-specific pages work
- [ ] Test unauthorized access (should redirect to login)

### 10. Database Verification
- [ ] Confirm artists data loads in /admin/artists
- [ ] Confirm sponsors data loads in /harper/sponsors
- [ ] Check that stats dashboard shows correct counts
- [ ] Verify no database connection errors in Netlify logs

### 11. Monitor & Debug
- [ ] Check Netlify Functions logs for errors
- [ ] Test error pages (404, 500)
- [ ] Verify HTTPS certificate is active
- [ ] Test on mobile device/different browser
- [ ] Check page load times

## Production Hardening

### 12. Security Configuration
- [ ] Verify strong NEXTAUTH_SECRET is set
- [ ] Confirm all default passwords changed
- [ ] Enable "Force HTTPS" in Netlify
- [ ] Review database firewall rules
- [ ] Set up database backups
- [ ] Consider adding Sentry for error tracking

### 13. Performance Optimization
- [ ] Set up Upstash Redis for rate limiting
- [ ] Monitor Netlify function execution times
- [ ] Check for slow API routes
- [ ] Optimize database queries if needed
- [ ] Consider upgrading to Netlify Pro for better performance

### 14. Custom Domain (Optional)
- [ ] Add custom domain in Netlify settings
- [ ] Configure DNS records (CNAME or A record)
- [ ] Wait for DNS propagation
- [ ] Update NEXTAUTH_URL to custom domain
- [ ] Verify SSL certificate provisioned
- [ ] Redeploy site

### 15. Continuous Deployment
- [ ] Verify automatic deploys on git push
- [ ] Set up deploy notifications (email/Slack)
- [ ] Configure deploy previews for pull requests
- [ ] Set up staging environment (optional)

## Maintenance & Monitoring

### 16. Ongoing Tasks
- [ ] Set up database backup schedule
- [ ] Monitor monthly costs (database, Netlify, APIs)
- [ ] Review Netlify analytics regularly
- [ ] Check for dependency updates: `npm outdated`
- [ ] Monitor API usage (Anthropic/OpenAI)
- [ ] Review error logs weekly
- [ ] Test backup restoration procedure

### 17. Documentation
- [ ] Document custom environment variables
- [ ] Save database credentials securely
- [ ] Document any custom configurations
- [ ] Update team on deployment URLs and credentials

## Troubleshooting Common Issues

### Build Failures
- **"DATABASE_URL not configured"** → Set DATABASE_URL in environment variables
- **NODE_ENV errors** → Remove NODE_ENV from env variables (Netlify sets it automatically)
- **Dependency errors** → Run `npm install` locally and commit package-lock.json

### Runtime Errors
- **500 errors on API routes** → Check Netlify function logs, verify DATABASE_URL
- **Authentication not working** → Verify NEXTAUTH_URL matches site URL, check NEXTAUTH_SECRET
- **Database connection timeout** → Check database firewall allows Netlify IPs (0.0.0.0/0)

### Performance Issues
- **Slow page loads** → Enable caching, upgrade Netlify tier, optimize database queries
- **Function timeouts** → Upgrade to Netlify Pro (26s timeout), optimize slow operations

## Quick Reference

### Default Login Credentials
```
Admin:  username: admin  | password: truefans2024
Riley:  username: riley  | password: riley2024
Harper: username: harper | password: harper2024
Elliot: username: elliot | password: elliot2024
```
**⚠️ IMPORTANT:** Change these via environment variables!

### Useful Commands
```bash
# Generate NextAuth secret
openssl rand -base64 32

# Run Prisma migrations
npx prisma migrate deploy

# Seed demo data
npm run db:seed

# View Netlify logs
netlify functions:list
netlify dev

# Test build locally
npm run build
npm run start
```

### Important URLs
- Netlify Dashboard: https://app.netlify.com
- Supabase Dashboard: https://supabase.com/dashboard
- Upstash Console: https://console.upstash.com
- Anthropic Console: https://console.anthropic.com
- OpenAI Platform: https://platform.openai.com

## Success Criteria

Your deployment is successful when:
- ✅ Site loads at your Netlify URL
- ✅ Login works for all team accounts
- ✅ Admin dashboard shows data
- ✅ No errors in Netlify function logs
- ✅ Database connections working
- ✅ HTTPS certificate active
- ✅ All required environment variables set

## Cost Estimate

**Free Tier (Development/Testing):**
- Netlify: Free (100GB bandwidth, 300 build minutes)
- Supabase/Neon: Free tier available
- Upstash: Free tier (10,000 requests/day)
- **Total:** $0/month

**Recommended Production Setup:**
- Netlify Pro: $19/month
- Supabase Pro: $25/month
- Upstash Redis: ~$5/month
- Anthropic API: Pay per use (~$10-50/month depending on usage)
- **Total:** ~$60-100/month

## Next Steps After Deployment

1. **Monitor for 24-48 hours** - Watch for errors, performance issues
2. **Set up monitoring** - Consider Sentry, Uptime monitoring
3. **Create backups** - Test database backup and restore
4. **Document processes** - Share with team
5. **Plan scaling** - Monitor usage, plan for growth

---

**Need Help?**
- Review: [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for detailed instructions
- Check: Netlify function logs for error details
- Verify: All environment variables are correctly set

**Ready to deploy? Start with item #1 and work your way down!** 🚀
