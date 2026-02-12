# Database Functions Implementation - COMPLETE ✅

**Date:** January 10, 2026  
**Migration File:** `database/migrations/004_database_functions.sql`  
**Status:** ✅ Ready to Execute

## Summary

Created 5 comprehensive database functions for health score calculation, churn risk assessment, SLA tracking, agent execution logging, and cost tracking.

## Functions Created

### 1. ✅ `calculate_health_score(tenant_id UUID)`
**Purpose:** Calculate customer health score for a tenant

**Health Score Factors (weighted):**
- **Usage:** 30 points (feature adoption and activity)
- **Support Tickets:** 20 points (fewer tickets = higher score)
- **NPS:** 25 points (based on NPS score)
- **Payment Status:** 15 points (on-time payments)
- **Engagement:** 10 points (engagement metrics)

**Health Levels:**
- **Healthy:** 70-100 points
- **At Risk:** 40-69 points
- **Critical:** 0-39 points

**Returns:** `health_id` (UUID)

**Features:**
- Calculates trend (improving, stable, declining)
- Stores previous score for comparison
- Stores factors breakdown in JSONB
- Auto-determines health level

### 2. ✅ `calculate_churn_risk(tenant_id UUID)`
**Purpose:** Calculate churn risk score for a tenant

**Risk Factors (weighted):**
- **Usage Decline:** 30 points
- **Support Tickets:** 20 points
- **Payment Issues:** 25 points
- **Engagement:** 15 points
- **NPS:** 10 points

**Risk Levels:**
- **Low:** 0-39 points
- **Medium:** 40-59 points
- **High:** 60-79 points
- **Critical:** 80-100 points

**Returns:** `risk_id` (UUID)

**Features:**
- Calculates trend (improving, stable, declining)
- Predicts churn date for high/critical risk
- Flags intervention required
- Stores risk factors breakdown in JSONB

### 3. ✅ `update_ticket_sla(ticket_id UUID)`
**Purpose:** Update SLA tracking for a ticket

**Features:**
- Finds SLA policy based on ticket priority
- Calculates first response target time
- Calculates resolution target time
- Updates ticket with SLA targets
- Creates/updates SLA tracking record

**Returns:** `tracking_id` (UUID)

**Default SLA (if no policy found):**
- First Response: 2 hours
- Resolution: 24 hours

### 4. ✅ `log_agent_execution(agent_id UUID, execution_data JSONB)`
**Purpose:** Log agent execution with full execution data

**Execution Data Structure:**
```json
{
  "ticket_id": "uuid",
  "conversation_id": "uuid",
  "execution_type": "chat|suggest|analyze|escalate|other",
  "input_text": "string",
  "output_text": "string",
  "llm_provider": "string",
  "llm_model": "string",
  "tokens_input": 100,
  "tokens_output": 50,
  "tokens_total": 150,
  "cost_usd": 0.0015,
  "execution_time_ms": 500,
  "status": "completed"
}
```

**Returns:** `execution_id` (UUID)

**Features:**
- Logs full execution details
- Automatically tracks cost via `track_agent_cost()`
- Stores metadata in JSONB

### 5. ✅ `track_agent_cost(agent_id UUID, tokens INT, cost_usd DECIMAL)`
**Purpose:** Track agent cost for a given period

**Features:**
- Tracks cost per agent per day
- Gets LLM provider and model from agent config
- Creates cost tracking record
- Can be called independently or automatically via `log_agent_execution()`

**Returns:** `cost_id` (UUID)

## Usage Examples

### Calculate Health Score
```sql
SELECT calculate_health_score('tenant-uuid-here');
-- Returns: health_id
```

### Calculate Churn Risk
```sql
SELECT calculate_churn_risk('tenant-uuid-here');
-- Returns: risk_id
```

### Update Ticket SLA
```sql
SELECT update_ticket_sla('ticket-uuid-here');
-- Returns: tracking_id
```

### Log Agent Execution
```sql
SELECT log_agent_execution(
  'agent-uuid-here',
  '{
    "ticket_id": "ticket-uuid",
    "execution_type": "chat",
    "input_text": "Customer question",
    "output_text": "Agent response",
    "llm_provider": "anthropic",
    "llm_model": "claude-3-opus",
    "tokens_input": 100,
    "tokens_output": 50,
    "tokens_total": 150,
    "cost_usd": 0.0015,
    "execution_time_ms": 500,
    "status": "completed"
  }'::jsonb
);
-- Returns: execution_id
```

### Track Agent Cost
```sql
SELECT track_agent_cost('agent-uuid-here', 150, 0.0015);
-- Returns: cost_id
```

## Security

All functions are created with `SECURITY DEFINER` which means:
- Functions run with the privileges of the function creator
- Allows functions to access tables even if caller doesn't have direct access
- Proper for administrative functions like these

## Integration Points

These functions integrate with:
- **Platform Service** - For usage data (can be enhanced)
- **Billing Service** - For payment status (can be enhanced)
- **Existing Tables** - Tickets, NPS, health scores, SLA policies

## Enhancement Opportunities

1. **Usage Data Integration** - Connect to Platform Service for real usage metrics
2. **Payment Data Integration** - Connect to Billing Service for payment status
3. **Engagement Metrics** - Add more sophisticated engagement calculations
4. **Machine Learning** - Enhance risk prediction with ML models
5. **Real-time Updates** - Add triggers to auto-calculate on data changes

## Migration Instructions

```bash
# Using psql
psql $DATABASE_URL -f database/migrations/004_database_functions.sql

# Or using Supabase CLI
supabase db push
```

## After Migration

1. ✅ All 5 functions created and ready to use
2. ⏳ Test functions with sample data
3. ⏳ Create triggers to auto-calculate health scores and churn risk
4. ⏳ Integrate functions into application code

---

**Migration Status:** ✅ READY TO EXECUTE  
**Functions Created:** 5 comprehensive functions  
**Security:** All functions use SECURITY DEFINER
