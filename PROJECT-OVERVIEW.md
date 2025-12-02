# TrueFans CONNECT - Riley AI Sales System
## Project Overview

## What Was Built

A complete, production-ready foundation for an AI-powered artist acquisition system featuring Riley, a conversational AI sales agent.

### Core Features

#### 1. Riley AI Agent System
- **Dual AI Provider Support**: Configurable OpenAI (GPT-4) or Anthropic (Claude)
- **Personality-Driven**: Riley has a warm, friendly, human-like personality
- **Intent-Based Routing**: Smart conversation flow based on artist status
- **Context-Aware**: Remembers conversation history and artist details

#### 2. Full-Stack Web Application
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for modern, responsive design
- **Server-side rendering** and API routes

#### 3. Database & Data Model
- **PostgreSQL** with Prisma ORM
- Complete schema for:
  - Artists (with pipeline tracking)
  - Conversations & Messages
  - Shows & Donations
  - Referrals
  - Riley's activity log

#### 4. Admin Dashboard
- Real-time statistics
- Artist pipeline visualization
- Full artist management
- Conversation history viewer
- Message simulator for testing

#### 5. Artist Onboarding
- Multi-step onboarding flow
- Show booking integration
- Automatic Riley outreach trigger

#### 6. Artist Discovery Framework
- Modular discovery engine
- Ready for Instagram, TikTok, Spotify APIs
- Venue scraping capability
- Auto-import to database

## Architecture

### Frontend Pages
- `/` - Landing page with value proposition
- `/onboard` - Artist onboarding wizard
- `/admin` - Dashboard with stats and pipeline
- `/admin/artists` - Artist list with filters
- `/admin/artists/[id]` - Detailed artist view with conversation

### API Routes
- `POST /api/riley/message` - Process incoming artist messages
- `POST /api/riley/outreach` - Trigger Riley to contact an artist
- `GET/POST /api/artists` - Artist CRUD operations
- `GET /api/stats` - Dashboard analytics
- `POST /api/discovery/run` - Run discovery cycle

### AI System Architecture

```
┌─────────────────────────────────────────┐
│         AI Provider Layer               │
│  (OpenAI GPT-4 / Anthropic Claude)     │
└─────────────────────────────────────────┘
                    ↑
                    │
┌─────────────────────────────────────────┐
│         Riley Agent Layer               │
│  - Personality & Prompts                │
│  - Intent Detection                     │
│  - Conversation Management              │
└─────────────────────────────────────────┘
                    ↑
                    │
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  - Pipeline Management                  │
│  - Show Booking                         │
│  - Activity Logging                     │
└─────────────────────────────────────────┘
                    ↑
                    │
┌─────────────────────────────────────────┐
│         Data Layer (Prisma + DB)        │
└─────────────────────────────────────────┘
```

### Riley's Conversation Flow

```
DISCOVERED → Initial Outreach
    ↓
CONTACTED → Qualify Live Shows
    ↓
ENGAGED → Educate About Product
    ↓
QUALIFIED → Book Next Show
    ↓
ONBOARDING → Send Reminders
    ↓
ACTIVATED → Celebrate First Win
    ↓
ACTIVE → Request Referrals
```

## File Structure Highlights

### Critical Files

**AI Agent System**
- `src/lib/ai/providers.ts` - AI provider abstraction (OpenAI + Claude)
- `src/lib/ai/riley-personality.ts` - Riley's personality prompts
- `src/lib/ai/riley-agent.ts` - Main Riley conversation engine

**Discovery System**
- `src/lib/discovery/discovery-engine.ts` - Artist discovery framework

**Database**
- `prisma/schema.prisma` - Complete database schema
- `src/lib/db.ts` - Prisma client singleton

**Pages**
- `src/app/page.tsx` - Landing page
- `src/app/admin/page.tsx` - Admin dashboard
- `src/app/onboard/page.tsx` - Artist onboarding

## Key Design Decisions

### Why Two AI Providers?
- **Flexibility**: Different models have different strengths
- **Cost optimization**: Can switch based on task complexity
- **Redundancy**: Fallback if one provider has issues

### Why Intent-Based Routing?
- Makes Riley's responses contextual and smart
- Easy to track conversation progress
- Enables automation at each stage

### Why PostgreSQL?
- Robust relational data
- Great for analytics queries
- Excellent Prisma support
- Production-ready scalability

## What's Ready for Production

✅ Core AI conversation engine
✅ Database schema and migrations
✅ Admin dashboard
✅ Artist onboarding flow
✅ API routes
✅ Type safety (TypeScript)
✅ Responsive design (mobile-ready)

## What Needs to Be Added

### High Priority
1. **Messaging Integration** (Twilio for SMS, Instagram DM API)
2. **Authentication** (NextAuth.js or similar)
3. **Social Platform APIs** (Instagram, TikTok, Spotify)
4. **Scheduled Tasks** (Cron jobs for reminders, discovery)

### Medium Priority
5. **Echo & Nova Agents** (Activation and celebration AIs)
6. **Analytics Dashboard** (Conversion metrics, engagement)
7. **Webhook System** (Real-time show tracking)

### Nice to Have
8. **Artist Mobile App**
9. **Email Campaigns**
10. **A/B Testing for Riley's messages**

## Testing Strategy

The system is built for easy testing:

1. **Seed Demo Data**: `npm run db:seed`
2. **Test Onboarding**: Fill out form at `/onboard`
3. **Simulate Conversations**: Use message input on artist detail page
4. **Watch Riley Respond**: Real-time AI responses

## Scalability Considerations

The architecture supports scaling to thousands of artists:

- **Database**: PostgreSQL can handle millions of records
- **AI Providers**: Rate limiting built-in
- **Stateless API**: Can deploy multiple instances
- **Caching**: Ready for Redis integration
- **Queue System**: Can add BullMQ for background jobs

## Cost Estimates (at scale)

**At 1,000 artists/month:**
- Database (Supabase): ~$25/mo
- AI API calls (Claude): ~$50-100/mo
- Hosting (Vercel): $20/mo
- SMS (Twilio): ~$0.01/message = $30-50/mo

**Total: ~$125-200/month**

## Next Steps for Paul

### Immediate (Week 1)
1. Set up environment (see SETUP.md)
2. Test Riley with demo data
3. Customize Riley's personality if needed

### Short-term (Month 1)
4. Add Twilio SMS integration
5. Deploy to Vercel
6. Start manual artist discovery

### Medium-term (Month 2-3)
7. Add Instagram/TikTok discovery
8. Implement scheduled reminders
9. Build Echo & Nova agents

### Long-term
10. Scale to 1,000+ artists
11. Add analytics and optimization
12. Build mobile app

## Success Metrics to Track

- **Discovery**: Artists found per day
- **Outreach**: Response rate to Riley's messages
- **Qualification**: % who have live shows
- **Activation**: % who use the 9-word line
- **Retention**: % who become active users
- **Referrals**: Artists per referral

## Technical Debt & Future Improvements

- Add comprehensive error handling
- Implement retry logic for AI calls
- Add rate limiting to public APIs
- Set up monitoring (Sentry, LogRocket)
- Add comprehensive test suite
- Optimize database queries with indexes
- Implement caching layer

## Security Considerations

Before production:
- [ ] Add authentication to admin routes
- [ ] Implement CSRF protection
- [ ] Add rate limiting
- [ ] Sanitize all user inputs
- [ ] Add HTTPS enforcement
- [ ] Set up API key rotation
- [ ] Implement audit logging

## Documentation

- **README.md** - Full project documentation
- **SETUP.md** - Quick start guide
- **PROJECT-OVERVIEW.md** - This file

## Support Resources

All code is documented with inline comments explaining:
- Why certain decisions were made
- How to extend functionality
- What needs to be implemented

Each major system has TODO comments for next steps.

---

**Built as a foundation for rapid iteration and scaling.**
