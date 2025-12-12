# TrueFans RADIO - Production Deployment Guide

This guide covers deploying TrueFans RADIO to production on Netlify (or any other platform).

## 📋 Pre-Deployment Checklist

### 1. Database Setup (PostgreSQL)

The application requires PostgreSQL in production. Choose a provider:

- **Recommended**: [Supabase](https://supabase.com) (Free tier available)
- **Alternatives**: Neon, Railway, Render, PlanetScale

#### Steps:

1. Create a new PostgreSQL database
2. Copy the connection string (format: `postgresql://user:pass@host:5432/dbname`)
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
4. Run migrations:
   ```bash
   npx prisma db push
   ```

### 2. Generate Authentication Secret

Generate a strong secret for NextAuth:

```bash
openssl rand -base64 32
```

Copy the output - you'll need it for `NEXTAUTH_SECRET`.

### 3. Set Up Redis (Rate Limiting)

**Required for production**

1. Sign up at [Upstash](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and TOKEN

### 4. Configure AI Provider

Choose at least one:

**Option A: Anthropic Claude (Recommended)**
- Sign up at https://console.anthropic.com
- Create an API key
- Set as `ANTHROPIC_API_KEY`

**Option B: OpenAI**
- Sign up at https://platform.openai.com
- Create an API key
- Set as `OPENAI_API_KEY`

### 5. Optional Services

**Twilio (SMS)** - For sending messages to artists:
- https://www.twilio.com/console
- Get: Account SID, Auth Token, Phone Number

**SendGrid (Email)** - For email communications:
- https://app.sendgrid.com/settings/api_keys
- Create an API key

---

## 🚀 Netlify Deployment

### Step 1: Connect Repository

1. Push code to GitHub/GitLab
2. Go to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your repository

### Step 2: Build Settings

Netlify should auto-detect Next.js. Verify:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 22 (set in `netlify.toml`)

### Step 3: Environment Variables

In Netlify dashboard, go to **Site settings → Environment variables** and add:

#### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
NEXTAUTH_SECRET="<your-generated-secret-from-step-2>"
NEXTAUTH_URL="https://your-domain.netlify.app"

# AI Provider (choose one or both)
ANTHROPIC_API_KEY="sk-ant-..."
# OR
OPENAI_API_KEY="sk-..."
DEFAULT_AI_PROVIDER="claude"  # or "openai"

# Team Passwords (set strong passwords!)
ADMIN_PASSWORD="<strong-password>"
RILEY_PASSWORD="<strong-password>"
HARPER_PASSWORD="<strong-password>"
ELLIOT_PASSWORD="<strong-password>"

# Rate Limiting (REQUIRED)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

#### Optional Variables

```bash
# SMS (Twilio)
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"

# Email (SendGrid)
SENDGRID_API_KEY="..."

# CORS (if exposing API to other domains)
ALLOWED_ORIGINS="https://app1.com,https://app2.com"
```

### Step 4: Deploy

1. Click "Deploy site"
2. Wait for build to complete
3. Visit your site URL

### Step 5: Run Database Migrations

After first deployment, you need to initialize the database:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Run Prisma migration
netlify env:import .env  # if you have local .env
DATABASE_URL="your-prod-db-url" npx prisma db push

# Or use Netlify Dev to run migrations
netlify dev
npx prisma db push
```

---

## 🔐 Security Post-Deployment

### 1. Change Default Passwords

The app has fallback passwords for development. **Change them immediately**:

- Set strong `ADMIN_PASSWORD`, `RILEY_PASSWORD`, `HARPER_PASSWORD`, `ELLIOT_PASSWORD`
- Passwords should be 16+ characters

### 2. Enable HTTPS

Netlify provides free SSL. Ensure HTTPS is enabled:
- Site settings → Domain management → HTTPS

### 3. Set up Domain (Optional)

1. Buy a domain (Namecheap, Google Domains, etc.)
2. In Netlify: Site settings → Domain management → Add custom domain
3. Update `NEXTAUTH_URL` to your custom domain

### 4. Security Headers

Already configured! The app includes:
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- And more...

---

## 📊 Monitoring & Logging

### Application Logs

View logs in Netlify dashboard:
- Functions → Function logs

### Database Monitoring

Monitor your PostgreSQL database:
- Supabase: Database → Logs
- Other providers: Check their dashboard

### Error Tracking (Recommended)

Set up error monitoring:

**Option 1: Sentry**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Option 2: LogRocket, Datadog, etc.**

---

## 🧪 Testing Production

### 1. Smoke Test Checklist

After deployment, verify:

- [ ] Homepage loads
- [ ] Login works (`/login`)
- [ ] Admin dashboard accessible
- [ ] Riley dashboard accessible
- [ ] Harper dashboard accessible
- [ ] Elliot dashboard accessible
- [ ] API endpoints respond
- [ ] Database connections work

### 2. Test Logins

Try logging in with each team:

- Username: `admin` / Password: `<ADMIN_PASSWORD>`
- Username: `riley` / Password: `<RILEY_PASSWORD>`
- Username: `harper` / Password: `<HARPER_PASSWORD>`
- Username: `elliot` / Password: `<ELLIOT_PASSWORD>`

### 3. Check Security Headers

Visit https://securityheaders.com and test your site. Should get an A or A+ rating.

---

## 🐛 Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Solution: Add all required env vars in Netlify

**Error: Database connection failed**
- Solution: Verify `DATABASE_URL` is correct and accessible from Netlify

### Runtime Errors

**"Cannot find module"**
- Solution: Clear build cache in Netlify and redeploy

**"Rate limit exceeded"**
- Solution: Verify Upstash Redis is configured

**"Unauthorized" errors**
- Solution: Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly

---

## 🔄 Updates & Maintenance

### Deploying Updates

1. Push to your repository
2. Netlify auto-deploys (if enabled)
3. Or manually trigger deploy in dashboard

### Database Migrations

When you change the Prisma schema:

```bash
# Generate migration
npx prisma migrate dev --name your_migration_name

# Deploy to production
DATABASE_URL="prod-url" npx prisma migrate deploy
```

### Backup Database

**Supabase**: Automatic daily backups
**Others**: Set up backup schedule with your provider

---

## 📈 Scaling Considerations

### When you need to scale:

1. **Database**: Upgrade to paid tier with connection pooling
2. **Redis**: Upgrade Upstash plan for higher rate limits
3. **Functions**: Netlify Pro for increased function execution time
4. **CDN**: Already handled by Netlify

### Performance Optimization

- Enable ISR (Incremental Static Regeneration) for dashboards
- Add database indexes (already configured)
- Implement caching layer with Redis
- Use CDN for static assets

---

## 🆘 Support

### Common Issues

- **Login redirect loop**: Check `NEXTAUTH_URL` matches your domain
- **API timeouts**: Increase serverless function timeout in Netlify
- **Database too many connections**: Use connection pooling

### Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)

---

## ✅ Production Checklist

Before going live:

- [ ] Database set up (PostgreSQL)
- [ ] All environment variables configured
- [ ] Strong passwords set for all teams
- [ ] Upstash Redis configured
- [ ] AI provider configured
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)
- [ ] Database migrations run
- [ ] Smoke tests passed
- [ ] Security headers verified
- [ ] Error monitoring configured (recommended)
- [ ] Backup strategy in place

---

**You're ready for production!** 🎉
