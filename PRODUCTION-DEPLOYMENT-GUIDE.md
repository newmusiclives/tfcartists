# TrueFans RADIO - Production Deployment Guide

**Last Updated:** December 2025
**Status:** Pre-Production (Critical fixes applied, remaining items documented)

---

## 📋 Pre-Deployment Checklist

### ✅ COMPLETED (Critical Fixes Applied)

- [x] **Environment Variable Validation** - Added `/src/lib/env.ts` for startup validation
- [x] **Production Logging** - Created `/src/lib/logger.ts` (replaces console.log)
- [x] **Console.log Cleanup** - Removed all console.log from production code
- [x] **Error Boundaries** - Added React Error Boundaries (`error.tsx`, `global-error.tsx`)
- [x] **PostgreSQL Migration** - Schema updated from SQLite to PostgreSQL
- [x] **Database Indexes** - Added indexes to Artist, Sponsor, Conversation, Message models
- [x] **Type-Safe Environment** - Environment variables validated with Zod

### ⚠️ REQUIRED BEFORE PRODUCTION

- [ ] **Implement Message Delivery** - Integrate Twilio (SMS), SendGrid (Email), Instagram API
- [ ] **Add Authentication** - Implement NextAuth.js for API protection
- [ ] **API Rate Limiting** - Add rate limiting to prevent abuse/excessive AI costs
- [ ] **Input Validation** - Add Zod schemas for all API endpoints
- [ ] **Error Tracking** - Integrate Sentry or similar service
- [ ] **Replace Mock Data** - Replace hardcoded stats with real database queries
- [ ] **Fix Type Assertions** - Remove all `as any` type assertions
- [ ] **Security Headers** - Add CSP, CORS, HTTPS enforcement

### 🎯 RECOMMENDED BEFORE PRODUCTION

- [ ] Add loading states to all pages
- [ ] Implement data pagination for large datasets
- [ ] Add comprehensive SEO metadata
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring (Vercel Analytics, DataDog, etc.)
- [ ] Add unit tests for critical business logic
- [ ] Create API documentation
- [ ] Set up database backups

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.production` file with the following:

```bash
# Database (Required)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# AI Providers (At least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
AI_PROVIDER="openai" # or "anthropic"

# Authentication (Required for production)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Message Delivery (Required for production)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"
SENDGRID_API_KEY="SG..."

# Node Environment
NODE_ENV="production"

# Optional: Social Media APIs
INSTAGRAM_ACCESS_TOKEN=""
TIKTOK_API_KEY=""
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""
```

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

---

## 🗄️ Database Setup

### 1. Provision PostgreSQL Database

**Recommended Providers:**
- **Vercel Postgres** (if deploying to Vercel)
- **Supabase** (free tier available)
- **Railway** (easy setup)
- **AWS RDS** (enterprise)
- **Digital Ocean** (managed PostgreSQL)

### 2. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (first time)
npx prisma db push

# Or run migrations (recommended for production)
npx prisma migrate deploy
```

### 3. Seed Demo Data (Optional - Development Only)

```bash
npm run seed
```

**⚠️ WARNING:** Do NOT run seed script in production!

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure Project**
   ```bash
   vercel login
   vercel link
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add OPENAI_API_KEY production
   vercel env add NEXTAUTH_SECRET production
   # Add all other required env vars
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Setup Custom Domain**
   - Add domain in Vercel dashboard
   - Configure DNS records
   - Enable automatic HTTPS

### Option 2: Docker Deployment

1. **Create Dockerfile** (example)
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t truefans-radio .
   docker run -p 3000:3000 --env-file .env.production truefans-radio
   ```

### Option 3: Traditional VPS (Ubuntu)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone <your-repo-url>
cd TFCARTISTS

# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Build application
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
npm install -g pm2
pm2 start npm --name "truefans-radio" -- start
pm2 save
pm2 startup
```

---

## 🔒 Security Checklist

### Pre-Deployment Security

- [ ] All API routes have authentication
- [ ] Rate limiting configured on expensive endpoints
- [ ] CORS configured properly
- [ ] CSP headers added
- [ ] HTTPS enforced
- [ ] Environment variables validated
- [ ] No secrets in git repository
- [ ] Database connection uses SSL
- [ ] Input validation on all user inputs
- [ ] XSS protection enabled

### Post-Deployment Security

- [ ] Enable Vercel/Cloudflare WAF
- [ ] Set up DDoS protection
- [ ] Configure database firewall rules
- [ ] Enable database backups
- [ ] Set up alerting for errors
- [ ] Monitor API usage
- [ ] Regular dependency updates
- [ ] Security audit completed

---

## 📊 Monitoring Setup

### Error Tracking (Sentry)

1. **Install Sentry**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Initialize Sentry**
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Add to env**
   ```bash
   SENTRY_DSN="your-sentry-dsn"
   ```

### Application Monitoring

**Recommended Tools:**
- **Vercel Analytics** (if using Vercel)
- **New Relic** (APM)
- **DataDog** (full stack)
- **Uptime Robot** (uptime monitoring)

---

## 🎯 Performance Optimization

### Before Production

- [ ] Enable Next.js Image Optimization
- [ ] Implement lazy loading for heavy components
- [ ] Add Redis caching layer (optional)
- [ ] Enable gzip compression
- [ ] Optimize bundle size
- [ ] Add CDN for static assets

### Database Optimization

```sql
-- Verify indexes are created
\d+ "Artist";
\d+ "Sponsor";
\d+ "Conversation";
\d+ "Message";

-- Monitor slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 📝 Post-Deployment Tasks

### Day 1

- [ ] Verify all pages load correctly
- [ ] Test authentication flow
- [ ] Confirm database connections working
- [ ] Check error tracking integration
- [ ] Verify email/SMS delivery
- [ ] Test API endpoints
- [ ] Monitor initial traffic

### Week 1

- [ ] Review error logs daily
- [ ] Monitor database performance
- [ ] Check AI API costs
- [ ] Review user feedback
- [ ] Optimize slow queries
- [ ] Adjust rate limits if needed

### Monthly

- [ ] Review security logs
- [ ] Update dependencies
- [ ] Database backup verification
- [ ] Performance optimization
- [ ] Cost optimization review

---

## 🚨 Rollback Plan

### If Deployment Fails

1. **Vercel:** Use instant rollback
   ```bash
   vercel rollback
   ```

2. **Docker:** Keep previous image
   ```bash
   docker run <previous-image-tag>
   ```

3. **Database:** Restore from backup
   ```bash
   pg_restore -d database backup.sql
   ```

---

## 📞 Support & Maintenance

### Critical Issues

1. Check error logs in Sentry
2. Review application logs
3. Check database connection
4. Verify API keys are valid
5. Check rate limits not exceeded

### AI Provider Issues

- **OpenAI Down:** Switch to Anthropic in env
- **Rate Limited:** Implement request queuing
- **High Costs:** Add stricter rate limiting

### Database Issues

- **Connection Timeout:** Check connection pool settings
- **Slow Queries:** Review query performance, add indexes
- **Storage Full:** Increase database size

---

## 🔗 Important Links

### Production URLs
- **Application:** `https://your-domain.com`
- **Admin:** `https://your-domain.com/admin`
- **API:** `https://your-domain.com/api/*`

### Services
- **Database:** [Your DB Provider Dashboard]
- **Error Tracking:** [Sentry Dashboard]
- **Monitoring:** [Your APM Dashboard]
- **DNS:** [Your DNS Provider]

### Documentation
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **NextAuth:** https://next-auth.js.org

---

## ✅ Final Pre-Launch Checklist

### Technical
- [ ] All environment variables set in production
- [ ] Database migrations run successfully
- [ ] SSL certificate configured
- [ ] Custom domain configured
- [ ] Error tracking integrated
- [ ] Monitoring set up
- [ ] Backups configured

### Business
- [ ] Test all 3 teams (Riley, Harper, Elliot)
- [ ] Verify artist onboarding flow
- [ ] Test sponsor acquisition flow
- [ ] Confirm listener growth tracking
- [ ] Verify revenue calculations
- [ ] Test airplay tier upgrades

### Legal
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance verified (if applicable)
- [ ] Data retention policy documented

---

## 🎉 You're Ready to Launch!

Once all critical items are completed, you can safely deploy to production. Remember:

1. **Start small** - Limited beta test first
2. **Monitor closely** - Watch for errors in first 24 hours
3. **Have rollback ready** - Keep previous version available
4. **Communicate** - Let users know about maintenance windows
5. **Iterate** - Continuously improve based on feedback

**Good luck with your launch!** 🚀
