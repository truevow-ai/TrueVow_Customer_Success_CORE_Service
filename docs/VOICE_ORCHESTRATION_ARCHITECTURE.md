# Voice Orchestration Architecture - CS-Support Service

**Date:** January 20, 2026  
**Status:** ✅ Architecture Documented in PRD  
**Reference:** Sales CRM Service Implementation (January 2026)

---

## Summary

CS-Support Service will adopt the same unified voice orchestration architecture successfully implemented by Sales CRM Service. This architecture provides a unified voice service pattern while maintaining complete isolation between services.

---

## Architecture Pattern

### Unified Service, Isolated Instances

**Key Principle:** All services use the same voice orchestration architecture, but each service has its own isolated STT (Speech-to-Text) service instance.

### Service Isolation

```
┌─────────────────────────────────────┐
│      Intake Service (Core)          │
│  Deterministic - AI/LLM-Free         │
│                                      │
│  STT: localhost:8000                 │
│  Database: intake_db                 │
│  Purpose: Core legal intake          │
└─────────────────────────────────────┘
              ↓ (ISOLATED)
┌─────────────────────────────────────┐
│      Sales CRM Service               │
│  Uses AI/LLM for call intelligence   │
│                                      │
│  STT: localhost:8001 (SEPARATE)      │
│  Database: sales_crm_db              │
│                                      │
│  Features:                           │
│  - Real-time objection detection     │
│  - CRM auto-update                   │
│  - Coaching scorecards                │
│  - Call transcription                │
└─────────────────────────────────────┘
              ↓ (ISOLATED)
┌─────────────────────────────────────┐
│      CS-Support Service               │
│  Uses AI/LLM for call intelligence   │
│                                      │
│  STT: localhost:8002 (SEPARATE)      │
│  Database: cs_support_db              │
│                                      │
│  Features:                           │
│  - Support call transcription        │
│  - Customer sentiment analysis       │
│  - Issue detection & escalation      │
│  - Support quality scoring           │
│  - SLA compliance tracking           │
└─────────────────────────────────────┘
```

---

## CS-Support Service Implementation

### Configuration

```bash
# CS-Support STT Service (SEPARATE from Intake and Sales CRM)
CS_SUPPORT_STT_SERVICE_URL=http://localhost:8002
```

**Important:**
- Intake uses `FASTER_WHISPER_SERVICE_URL` (typically `http://localhost:8000`)
- Sales CRM uses `SALES_CRM_STT_SERVICE_URL` (typically `http://localhost:8001`)
- CS-Support uses `CS_SUPPORT_STT_SERVICE_URL` (should be `http://localhost:8002` or different)
- **These must be different URLs/ports** to ensure isolation

### Features

1. **Call Transcription Pipeline:**
   - Real-time call transcription
   - Post-call transcription
   - Automatic speaker diarization
   - Integration with call intelligence

2. **Call Intelligence:**
   - Customer sentiment analysis
   - Issue detection and escalation
   - Support quality scoring
   - SLA compliance tracking
   - Customer satisfaction insights

3. **Integration Points:**
   - Twilio call webhooks
   - Support ticket creation from calls
   - CRM auto-update from call insights
   - Activity logging for RevOps

---

## API Endpoints

### Call Transcription
```
POST /api/v1/calls/[call_id]/transcribe
```
- Transcribe call audio
- Real-time or post-call transcription
- Returns transcript with speaker diarization

### Get Transcript
```
GET /api/v1/calls/[call_id]/transcribe
```
- Retrieve call transcript
- Includes metadata and speaker information

### Call Intelligence
```
POST /api/v1/calls/[call_id]/intelligence
```
- Analyze call for insights
- Sentiment analysis
- Issue detection
- Quality scoring

---

## Database Schema

### Call Transcripts Table
```sql
CREATE TABLE cs_call_transcripts (
  transcript_id UUID PRIMARY KEY,
  call_id VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL,
  customer_id UUID,
  transcript_text TEXT,
  speaker_diarization JSONB,
  sentiment_score DECIMAL(3,2),
  issues_detected JSONB,
  quality_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Steps

1. **Create STT Service Client:**
   - `lib/integrations/stt-service.ts`
   - Accepts `CS_SUPPORT_STT_SERVICE_URL` parameter
   - Handles transcription requests

2. **Create Call Transcription Pipeline:**
   - `lib/services/call-transcription-pipeline.ts`
   - Integrates STT service with call intelligence
   - Handles real-time and post-call transcription

3. **Create API Endpoints:**
   - `app/api/v1/calls/[call_id]/transcribe/route.ts`
   - `app/api/v1/calls/[call_id]/intelligence/route.ts`

4. **Database Migration:**
   - Create `cs_call_transcripts` table
   - Add indexes for performance

5. **Integration with Twilio:**
   - Update call webhook handler
   - Trigger transcription on call completion
   - Store transcripts in database

---

## Benefits

1. **Service Isolation:**
   - Each service has its own STT instance
   - No interference between services
   - Intake remains deterministic

2. **Unified Architecture:**
   - Same pattern across all services
   - Consistent implementation
   - Easier maintenance

3. **Scalability:**
   - Each service can scale independently
   - No shared bottlenecks
   - Better resource management

4. **AI Intelligence:**
   - Sales CRM and CS-Support can use AI/LLM
   - Intake remains AI/LLM-free
   - Clear separation of concerns

---

## Testing

### Isolation Test
```bash
npm run test:voice-isolation
```
- Verifies `CS_SUPPORT_STT_SERVICE_URL` is configured
- Ensures URLs are different from other services
- Validates code implementation

### Integration Test
```bash
npm run test:call-intelligence
```
- Tests STT service health
- Tests transcription pipeline
- Tests call intelligence features
- Verifies service isolation

---

## Reference

- **Sales CRM Implementation:** January 2026
- **Architecture Pattern:** Unified Service, Isolated Instances
- **Isolation Principle:** Each service uses separate STT service instance
- **Intake Protection:** Intake service remains deterministic and AI/LLM-free

---

## Next Steps

1. **Environment Configuration:**
   - Set `CS_SUPPORT_STT_SERVICE_URL` in `.env.local`
   - Deploy separate STT service instance for CS-Support

2. **Implementation:**
   - Create STT service client
   - Create call transcription pipeline
   - Create API endpoints
   - Create database migration

3. **Testing:**
   - Run isolation test
   - Run integration test
   - Verify service isolation

4. **Deployment:**
   - Deploy CS-Support STT service instance
   - Verify isolation in production
   - Monitor performance

---

**Status:** ✅ **Architecture Documented - Ready for Implementation**

---

**Last Updated:** January 20, 2026
