# TrueFans CONNECT - Riley AI Sales System

An AI-powered artist acquisition and engagement platform that uses conversational AI agents (led by Riley) to discover, educate, and activate emerging artists for TrueFans CONNECT.

## Overview

Riley is your tireless, friendly, always-on sales rep who:
- Discovers emerging artists from social platforms
- Starts friendly, human-like conversations
- Educates artists about the 9-word line
- Books artists for their next show
- Sends reminders and motivation
- Celebrates first wins

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Providers**: OpenAI (GPT-4) & Anthropic (Claude) - configurable
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Features

### ✅ Completed

1. **AI Agent System**
   - Configurable AI providers (OpenAI + Claude)
   - Riley's personality-driven conversation engine
   - Intent-based message routing
   - Context-aware responses

2. **Admin Dashboard**
   - Real-time stats and metrics
   - Artist pipeline visualization
   - Recent artists table
   - Full conversation history

3. **Artist Management**
   - Complete CRUD operations
   - Pipeline stage tracking
   - Show management
   - Donation tracking

4. **Artist Onboarding**
   - Multi-step onboarding flow
   - Automatic Riley outreach
   - Show booking integration

5. **API Routes**
   - `/api/riley/message` - Handle artist messages
   - `/api/riley/outreach` - Trigger Riley outreach
   - `/api/artists` - Artist CRUD
   - `/api/stats` - Dashboard statistics
   - `/api/discovery/run` - Run discovery cycle

### 🚧 To Be Implemented

1. **Artist Discovery APIs**
   - Instagram API integration
   - TikTok API integration
   - Spotify API integration
   - Venue scraping

2. **Messaging Integration**
   - Twilio (SMS)
   - Instagram DM API
   - Email (SendGrid)

3. **Authentication**
   - NextAuth.js setup
   - Role-based access control

4. **Scheduled Tasks**
   - Daily discovery runs
   - Show reminders
   - Follow-up automation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- OpenAI API key
- Anthropic API key (optional)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd /Users/Test/Documents/Projects/TFCARTISTS
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/tfcartists"
   OPENAI_API_KEY="sk-..."
   ANTHROPIC_API_KEY="sk-ant-..."
   DEFAULT_AI_PROVIDER="claude"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   ```

3. **Set up the database**
   ```bash
   npx prisma db push
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   - Homepage: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin
   - Artist Onboarding: http://localhost:3000/onboard

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── admin/               # Admin dashboard
│   │   ├── page.tsx         # Main dashboard
│   │   └── artists/         # Artist management
│   ├── onboard/             # Artist onboarding flow
│   └── api/                 # API routes
│       ├── riley/           # Riley AI endpoints
│       ├── artists/         # Artist CRUD
│       ├── stats/           # Analytics
│       └── discovery/       # Discovery engine
├── lib/
│   ├── ai/                  # AI agent system
│   │   ├── providers.ts     # OpenAI & Claude integration
│   │   ├── riley-personality.ts  # Riley's personality
│   │   └── riley-agent.ts   # Main Riley agent
│   ├── discovery/           # Artist discovery
│   │   └── discovery-engine.ts
│   ├── db.ts                # Prisma client
│   └── utils.ts             # Utilities
├── components/              # React components (future)
└── types/                   # TypeScript types

prisma/
└── schema.prisma            # Database schema
```

## Database Schema

Key models:
- **Artist** - Artist profiles and pipeline status
- **Conversation** - Riley's conversations with artists
- **Message** - Individual messages
- **Show** - Live show bookings
- **Donation** - Fan donations/wins
- **RileyActivity** - Riley's action log

## Riley's Personality

Riley is designed to be:
- **Warm & friendly** - Sounds like a real person texting
- **Concise** - 1-3 sentences max
- **Artist-centric** - Focuses on their success
- **Helpful, not pushy** - No marketing jargon
- **Genuinely excited** - Celebrates wins

See `src/lib/ai/riley-personality.ts` for full personality prompt.

## How Riley Works

### Pipeline Stages

1. **DISCOVERED** - Found by discovery engine
2. **CONTACTED** - Riley reached out
3. **ENGAGED** - Artist responded
4. **QUALIFIED** - Has live shows, interested
5. **ONBOARDING** - Setting up profile
6. **ACTIVATED** - Used the 9-word line
7. **ACTIVE** - Regular user

### Conversation Intents

Riley uses intent-based routing:
- `initial_outreach` - First contact
- `qualify_live_shows` - Ask about shows
- `educate_product` - Explain TrueFans
- `book_show` - Get show details
- `send_reminder` - Pre-show reminder
- `motivate` - Hype message
- `celebrate_win` - First donation
- `request_referral` - Ask for referrals

## API Examples

### Trigger Riley Outreach

```bash
curl -X POST http://localhost:3000/api/riley/outreach \
  -H "Content-Type: application/json" \
  -d '{"artistId": "artist-id"}'
```

### Simulate Artist Message

```bash
curl -X POST http://localhost:3000/api/riley/message \
  -H "Content-Type: application/json" \
  -d '{
    "artistId": "artist-id",
    "message": "Yes, I have a show next week!",
    "channel": "sms"
  }'
```

### Create Artist Manually

```bash
curl -X POST http://localhost:3000/api/artists \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "genre": "Indie",
    "discoverySource": "manual"
  }'
```

## Testing Riley

1. Go to http://localhost:3000/onboard
2. Fill out the artist onboarding form
3. Submit the form
4. Check the admin dashboard at http://localhost:3000/admin
5. Click on the artist to view their detail page
6. Use the message input to simulate artist responses
7. Watch Riley respond in real-time!

## Next Steps

### 1. Add Messaging Integration

Integrate Twilio for SMS:

```bash
npm install twilio
```

Add to `.env`:
```env
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=xxx
```

Update `src/lib/ai/riley-agent.ts` to actually send messages.

### 2. Add Instagram API

Get Instagram API access and implement in `src/lib/discovery/discovery-engine.ts`.

### 3. Add Scheduled Tasks

Use Vercel Cron or a task queue like BullMQ for:
- Daily discovery runs
- Show reminders (24h before)
- Follow-up messages

### 4. Add Authentication

```bash
npm install next-auth
```

Set up admin authentication to protect the dashboard.

### 5. Deploy

Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

## Contributing

This is the initial foundation. To extend:

1. **Add Discovery APIs** - Implement actual social platform integrations
2. **Add Echo & Nova** - Build the activation and celebration AI agents
3. **Add Analytics** - Track conversion rates, engagement metrics
4. **Add Webhooks** - Real-time show tracking, donation notifications
5. **Add Mobile App** - Artist mobile experience

## License

Proprietary - TrueFans CONNECT

## Support

For questions or issues, contact the development team.

---

**Built with ❤️ for TrueFans CONNECT**
