# Netlify Deployment Guide - TrueFans RADIO

This comprehensive guide will help you deploy the TrueFans RADIO application to Netlify.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Troubleshooting](#troubleshooting)
7. [Post-Deployment](#post-deployment)

## Prerequisites

✅ **Required:**
- Netlify account (sign up at https://netlify.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- PostgreSQL database (Supabase, Neon, or Railway recommended)
- AI API key (Anthropic Claude or OpenAI)

✅ **Recommended:**
- Custom domain (optional)
- Upstash Redis account for rate limiting (optional but recommended)

## Quick Start

### 1. Set Up Database

**Option A: Supabase (Recommended)**
1. Go to https://supabase.com/dashboard
2. Create a new project
3. Copy the "Connection string" from Settings → Database
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

**Option B: Neon**
1. Go to https://console.neon.tech/
2. Create a new project
3. Copy the connection string

**Option C: Railway**
1. Go to https://railway.app/
2. Create new PostgreSQL database
3. Copy connection string from "Connect" tab

### 2. Prepare Environment Variables

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

You'll need these minimum variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - The secure random string you generated
- `NEXTAUTH_URL` - Your Netlify site URL (e.g., https://your-app.netlify.app)
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` - Your AI provider API key

### 3. Deploy to Netlify

#### Method A: Netlify Dashboard
1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider and select your repository
4. Configure build settings (should auto-detect):
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Click **"Show advanced"** → **"New variable"** and add your environment variables
6. Click **"Deploy site"**

#### Method B: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Set environment variables
netlify env:set DATABASE_URL "your-database-url"
netlify env:set NEXTAUTH_SECRET "your-secret"
netlify env:set NEXTAUTH_URL "https://your-site.netlify.app"
netlify env:set ANTHROPIC_API_KEY "your-api-key"

# Deploy
netlify deploy --prod
```

## Detailed Setup

### Configuration Files

The project includes these configuration files for Netlify:

**netlify.toml** (already configured):
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "22"
```

**next.config.js** (already configured):
- Transpiles NextAuth for compatibility
- Configures server actions
- Optimized for Netlify deployment

## Environment Variables

### Required Variables

Set these in **Site settings** → **Environment variables**:

```bash
# Database (PostgreSQL required for production)
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
NEXTAUTH_URL="https://your-app.netlify.app"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# AI Provider (at least one)
ANTHROPIC_API_KEY="sk-ant-your-key"
# OR
OPENAI_API_KEY="sk-your-key"

# Default AI provider
DEFAULT_AI_PROVIDER="claude"  # or "openai"
```

### Optional Variables

```bash
# Team Passwords (uses defaults if not set)
ADMIN_PASSWORD="custom-password"
RILEY_PASSWORD="custom-password"
HARPER_PASSWORD="custom-password"
ELLIOT_PASSWORD="custom-password"

# Message Delivery
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"
SENDGRID_API_KEY="your-sendgrid-key"

# Rate Limiting (Recommended for production)
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Application Config
RILEY_ACTIVE="true"
RILEY_MAX_OUTREACH_PER_DAY="50"
```

### How to Set Environment Variables in Netlify

1. Go to your site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **"Add a variable"**
4. Enter **Key** and **Value**
5. Select **"Same value for all deploy contexts"** or customize per environment
6. Click **"Create variable"**
7. Repeat for all required variables

**Important:** After adding variables, trigger a new deploy for changes to take effect.

## Database Setup

### Step 1: Run Prisma Migrations

After your first deployment, you need to set up the database schema:

```bash
# Install dependencies locally
npm install

# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Step 2: Seed Demo Data (Optional)

```bash
# Seed the database with demo data
npm run db:seed
```

This creates:
- 6 demo artists with various statuses
- 5 demo sponsors with different tiers
- 2 active sponsorship contracts
- Sample conversations and messages
- Track submissions
- Activity logs

### Database Schema

The application uses these main models:
- **Artist** - Artist profiles and pipeline tracking
- **Sponsor** - Sponsor/advertiser management
- **Conversation** & **Message** - Communication tracking
- **TrackSubmission** - Music track submissions
- **Sponsorship** - Active sponsor contracts
- **RileyActivity** & **HarperActivity** - Team activity logs

For full schema details, see `prisma/schema.prisma`

## Troubleshooting

### Build Fails with "DATABASE_URL not configured"

**Solution:** The build is configured to work without `DATABASE_URL` during build time. However, you must set it as an environment variable in Netlify for runtime.

### Build Fails with NODE_ENV Error

**Solution:** Do NOT set `NODE_ENV` manually. Netlify sets it automatically to "production" during builds.

### Functions Timeout

**Problem:** Netlify Functions have a 10-second timeout on the free tier.

**Solutions:**
1. Upgrade to Pro tier (26-second timeout)
2. Optimize slow operations
3. Move heavy operations to background jobs
4. Use Netlify Background Functions

### Database Connection Errors at Runtime

**Checklist:**
1. ✅ Verify `DATABASE_URL` is correct in Netlify environment variables
2. ✅ Ensure your database allows connections from any IP (0.0.0.0/0) or Netlify's IP ranges
3. ✅ Check that Prisma migrations have been run: `npx prisma migrate deploy`
4. ✅ Verify database is online and accessible

### Authentication Not Working

**Checklist:**
1. ✅ `NEXTAUTH_URL` matches your actual site URL (including https://)
2. ✅ `NEXTAUTH_SECRET` is set and is a secure random string
3. ✅ Clear browser cookies and try again
4. ✅ Check Netlify function logs for errors

### API Routes Returning 500 Errors

**Common causes:**
1. Database connection issues - check `DATABASE_URL`
2. Missing environment variables - verify all required vars are set
3. Prisma client not generated - redeploy after migrations
4. Rate limiting errors - check if Redis is configured correctly

### Pages Show "Application Error"

1. Check Netlify function logs: Site → Functions → Select function → View logs
2. Verify all required environment variables are set
3. Check database connectivity
4. Ensure Prisma migrations are up to date

### How to View Logs

**Netlify Dashboard:**
1. Go to your site
2. Click **"Functions"** tab
3. Click on a function to see its logs
4. Or go to **"Deploys"** → Select deploy → **"Function log"**

**Netlify CLI:**
```bash
# View live logs
netlify dev

# View function logs
netlify functions:list
netlify functions:invoke function-name --log
```

## Post-Deployment

### 1. Verify Deployment

Test these URLs (replace with your domain):
- `https://your-app.netlify.app` - Home page
- `https://your-app.netlify.app/login` - Login page
- `https://your-app.netlify.app/admin` - Admin dashboard (after login)

### 2. Test Login

Default credentials:
- **Admin**: username: `admin`, password: `truefans2024` (or your `ADMIN_PASSWORD`)
- **Riley**: username: `riley`, password: `riley2024` (or your `RILEY_PASSWORD`)
- **Harper**: username: `harper`, password: `harper2024` (or your `HARPER_PASSWORD`)
- **Elliot**: username: `elliot`, password: `elliot2024` (or your `ELLIOT_PASSWORD`)

**Important:** Change these passwords by setting custom environment variables!

### 3. Configure Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow the instructions to configure DNS:
   - **CNAME record**: Point to your Netlify subdomain
   - **A record**: Point to Netlify's load balancer IP
4. Wait for DNS propagation (5 minutes to 48 hours)
5. Update `NEXTAUTH_URL` environment variable to your custom domain
6. Trigger a new deploy

### 4. Enable HTTPS

Netlify automatically provisions SSL certificates. Ensure:
1. **HTTPS** is enabled (Settings → Domain management → HTTPS)
2. **Force HTTPS** is enabled
3. Certificate shows as "Active"

### 5. Set Up Continuous Deployment

Netlify automatically redeploys when you push to your main branch.

**To deploy from a different branch:**
1. Go to **Site settings** → **Build & deploy** → **Continuous deployment**
2. Change the **"Production branch"** setting

**To set up deploy previews:**
- Netlify automatically creates preview deployments for pull requests
- Configure in **Site settings** → **Build & deploy** → **Deploy previews**

### 6. Monitor Performance

1. Check **Site → Analytics** for traffic and performance metrics
2. Monitor **Functions** tab for function execution times
3. Set up **Notifications** for deploy status

### 7. Set Up Database Backups

**Supabase:**
- Pro plan includes automatic backups
- Or use `pg_dump` for manual backups

**Neon:**
- Automatic daily backups on all plans
- Point-in-time recovery available

**Railway:**
- Manual backups via dashboard
- Set up automated backup scripts if needed

## Recommended Production Configuration

### Minimal Setup (Free Tier)
```bash
DATABASE_URL="<supabase-or-neon-free-tier>"
NEXTAUTH_SECRET="<secure-random-string>"
NEXTAUTH_URL="https://your-app.netlify.app"
ANTHROPIC_API_KEY="<your-api-key>"
```

**Cost:** $0/month (within free tier limits)

### Recommended Setup
```bash
# Core
DATABASE_URL="<supabase-pro-or-neon>"
NEXTAUTH_SECRET="<secure-random-string>"
NEXTAUTH_URL="https://your-domain.com"
ANTHROPIC_API_KEY="<your-api-key>"

# Rate Limiting
UPSTASH_REDIS_REST_URL="<upstash-url>"
UPSTASH_REDIS_REST_TOKEN="<upstash-token>"

# Message Delivery
TWILIO_ACCOUNT_SID="<twilio-sid>"
TWILIO_AUTH_TOKEN="<twilio-token>"
SENDGRID_API_KEY="<sendgrid-key>"

# Custom Passwords
ADMIN_PASSWORD="<strong-password>"
RILEY_PASSWORD="<strong-password>"
HARPER_PASSWORD="<strong-password>"
ELLIOT_PASSWORD="<strong-password>"
```

**Estimated Cost:**
- Netlify Pro: $19/month
- Supabase Pro: $25/month
- Upstash (pay-as-you-go): ~$5/month
- Twilio: Pay per SMS
- SendGrid: Free up to 100 emails/day
- **Total:** ~$49/month + usage

### Enterprise Setup

Add:
- Custom domain with Netlify DNS
- Increased function timeout (Pro tier)
- Database connection pooling
- CDN optimization
- Monitoring and alerting
- Backup strategy
- Staging environment

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Netlify function logs
3. Check database connectivity
4. Verify all environment variables are correctly set

## Security Checklist

Before going to production:

- [ ] Generate strong `NEXTAUTH_SECRET` (use `openssl rand -base64 32`)
- [ ] Change all default passwords via environment variables
- [ ] Use PostgreSQL (not SQLite) in production
- [ ] Enable HTTPS and force HTTPS redirect
- [ ] Set up database backups
- [ ] Configure rate limiting with Upstash Redis
- [ ] Review and restrict database firewall rules
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Review API route protection middleware
- [ ] Test authentication flows thoroughly
- [ ] Set up staging environment for testing

## Version Information

- **Node.js**: 22.x
- **Next.js**: 14.x
- **Prisma**: 6.x
- **NextAuth**: 5.x beta
- **Database**: PostgreSQL (production), SQLite (development)

---

**Ready to deploy?** Follow the Quick Start section and you'll be live in minutes! 🚀
