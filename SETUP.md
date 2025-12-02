# Quick Setup Guide

Get Riley and the AI Sales System running in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Database

### Option A: Use PostgreSQL locally

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql

   # Create database
   createdb tfcartists
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://localhost:5432/tfcartists"
   ```

### Option B: Use Supabase (recommended for quick start)

1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string
4. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
   ```

## Step 3: Configure AI Providers

1. Get an OpenAI API key: https://platform.openai.com/api-keys
2. (Optional) Get an Anthropic API key: https://console.anthropic.com/

3. Update `.env`:
   ```env
   OPENAI_API_KEY="sk-..."
   ANTHROPIC_API_KEY="sk-ant-..."
   DEFAULT_AI_PROVIDER="claude"  # or "openai"
   ```

## Step 4: Push Database Schema

```bash
npx prisma db push
```

This creates all the tables in your database.

## Step 5: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Step 6: Test the System

### Create Your First Artist

1. Go to http://localhost:3000/onboard
2. Fill out the form:
   - Name: "Test Artist"
   - Email: "test@example.com"
   - Genre: "Indie"
   - (Optional) Add a show date

3. Submit!

### Watch Riley Work

1. Go to http://localhost:3000/admin
2. You should see your test artist
3. Click on the artist name
4. See Riley's initial outreach message
5. Type a response in the message box: "Yes, I have a show next week!"
6. Watch Riley respond!

## Step 7: View Database (Optional)

```bash
npx prisma studio
```

Opens a GUI to view all your data.

## Common Issues

### Database Connection Error

Make sure PostgreSQL is running:
```bash
brew services start postgresql
```

### AI Provider Error

Check your API keys in `.env`. Make sure they're valid and have credits.

### Build Errors

Clear Next.js cache:
```bash
rm -rf .next
npm run dev
```

## Next: Add Real Discovery

Right now, artist discovery is a framework. To add real social platform scanning:

1. Get Instagram API access
2. Get Spotify API credentials
3. Implement in `src/lib/discovery/discovery-engine.ts`

See README.md for full details.

## Environment Variables Reference

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - At least one AI provider

Optional:
- `DEFAULT_AI_PROVIDER` - "claude" or "openai" (default: claude)
- `RILEY_ACTIVE` - Enable/disable Riley (default: true)
- `RILEY_MAX_OUTREACH_PER_DAY` - Rate limit (default: 50)

For production:
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `TWILIO_*` - For SMS integration
- `INSTAGRAM_*` - For Instagram DM integration

## Development Workflow

1. Make changes to code
2. Next.js hot-reloads automatically
3. Test in browser
4. Check logs in terminal
5. View data in Prisma Studio

## Ready to Deploy?

See README.md for deployment instructions (Vercel recommended).

---

Happy building! 🚀
