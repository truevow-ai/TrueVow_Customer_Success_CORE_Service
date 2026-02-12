# CS-Support Service

Customer Success & Customer Support Service for TrueVow.

## Setup

1. Copy `.env.example` to `.env.local`
2. Fill in all environment variables
3. Run `npm install`
4. Run `npm run dev`

The service will start on port 3003.

## Documentation

See `docs/CS_SUPPORT_SERVICE_PRD.md` for complete product requirements.
See `docs/CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.md` for implementation details.

## Technology Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Clerk (Shared Application)
- **Database:** Supabase (PostgreSQL)
- **LLM:** Claude (Anthropic) + Kimi
- **Voice AI:** Deepgram (STT) + Cartesia (TTS)

## Service Port

This service runs on port **3003** by default.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

This is a standalone service with:
- Own repository (`TrueVow-CS-Support/`)
- Own frontend (Next.js App Router)
- Own backend (Next.js API Routes)
- Own database (`support_db` schema in Supabase)
- Independent deployment

## Security

- **LLM Access:** This service is one of only two services authorized for direct LLM access (along with Sales-CRM Service)
- **Authentication:** Uses Clerk shared application for SSO
- **Service-to-Service:** Uses API key authentication

