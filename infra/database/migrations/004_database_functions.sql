-- CS-Support Service - Database Functions
-- Version: 1.0
-- Created: 2026-01-10
-- Description: Core database functions for health scores, churn risk, SLA tracking, and agent operations

-- ============================================================================
-- HEALTH SCORE CALCULATION
-- ============================================================================

/**
 * Calculate customer health score for a tenant
 * 
 * Health Score Factors (weighted):
 * - Usage: 30 points (based on feature adoption and activity)
 * - Support Tickets: 20 points (fewer tickets = higher score)
 * - NPS: 25 points (based on NPS score)
 * - Payment Status: 15 points (on-time payments = higher score)
 * - Engagement: 10 points (based on engagement metrics)
 * 
 * Health Levels:
 * - Healthy: 70-100
 * - At Risk: 40-69
 * - Critical: 0-39
 */
CREATE OR REPLACE FUNCTION calculate_health_score(p_tenant_id UUID)
RETURNS UUID AS $$
DECLARE
  v_health_id UUID;
  v_health_score INT;
  v_health_level VARCHAR(50);
  v_factors JSONB;
  v_previous_score INT;
  v_trend VARCHAR(50);
  v_usage_score INT := 0;
  v_support_score INT := 0;
  v_nps_score INT := 0;
  v_payment_score INT := 0;
  v_engagement_score INT := 0;
  
  -- Metrics
  v_ticket_count INT;
  v_avg_ticket_resolution_time INTERVAL;
  v_nps_score_value INT;
  v_payment_on_time BOOLEAN;
  v_engagement_level VARCHAR(50);
BEGIN
  -- Get previous health score
  SELECT health_score INTO v_previous_score
  FROM cs_customer_health_scores
  WHERE tenant_id = p_tenant_id
  ORDER BY calculated_at DESC
  LIMIT 1;
  
  -- Calculate Usage Score (0-30 points)
  -- Based on feature adoption and activity (simplified - would integrate with Platform Service)
  -- For now, default to 20 points (can be enhanced with actual usage data)
  v_usage_score := 20;
  
  -- Calculate Support Tickets Score (0-20 points)
  -- Fewer tickets and faster resolution = higher score
  SELECT 
    COUNT(*),
    AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL)
  INTO v_ticket_count, v_avg_ticket_resolution_time
  FROM cs_tickets
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - INTERVAL '30 days';
  
  IF v_ticket_count = 0 THEN
    v_support_score := 20; -- No tickets = perfect score
  ELSIF v_ticket_count <= 2 THEN
    v_support_score := 18; -- 1-2 tickets = excellent
  ELSIF v_ticket_count <= 5 THEN
    v_support_score := 15; -- 3-5 tickets = good
  ELSIF v_ticket_count <= 10 THEN
    v_support_score := 10; -- 6-10 tickets = moderate
  ELSE
    v_support_score := 5; -- 10+ tickets = poor
  END IF;
  
  -- Adjust based on resolution time (if available)
  IF v_avg_ticket_resolution_time IS NOT NULL THEN
    IF v_avg_ticket_resolution_time < INTERVAL '24 hours' THEN
      v_support_score := v_support_score + 2; -- Fast resolution bonus
    ELSIF v_avg_ticket_resolution_time > INTERVAL '72 hours' THEN
      v_support_score := v_support_score - 3; -- Slow resolution penalty
    END IF;
  END IF;
  
  -- Ensure score stays within bounds
  v_support_score := GREATEST(0, LEAST(20, v_support_score));
  
  -- Calculate NPS Score (0-25 points)
  -- Get latest NPS score
  SELECT nps_score INTO v_nps_score_value
  FROM cs_survey_nps
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_nps_score_value IS NOT NULL THEN
    -- Convert NPS (-100 to 100) to 0-25 scale
    -- NPS 50+ = 25 points, NPS 0 = 12.5 points, NPS -50 = 0 points
    v_nps_score := GREATEST(0, LEAST(25, 12.5 + (v_nps_score_value::DECIMAL / 4)));
  ELSE
    v_nps_score := 12; -- Default if no NPS data
  END IF;
  
  -- Calculate Payment Score (0-15 points)
  -- Assume on-time payments (would integrate with billing service)
  -- For now, default to 15 (can be enhanced with actual payment data)
  v_payment_score := 15;
  
  -- Calculate Engagement Score (0-10 points)
  -- Based on recent activity (simplified)
  -- For now, default to 7 (can be enhanced with actual engagement data)
  v_engagement_score := 7;
  
  -- Calculate total health score
  v_health_score := v_usage_score + v_support_score + v_nps_score + v_payment_score + v_engagement_score;
  
  -- Ensure score is between 0 and 100
  v_health_score := GREATEST(0, LEAST(100, v_health_score));
  
  -- Determine health level
  IF v_health_score >= 70 THEN
    v_health_level := 'healthy';
  ELSIF v_health_score >= 40 THEN
    v_health_level := 'at_risk';
  ELSE
    v_health_level := 'critical';
  END IF;
  
  -- Determine trend
  IF v_previous_score IS NULL THEN
    v_trend := 'stable';
  ELSIF v_health_score > v_previous_score + 5 THEN
    v_trend := 'improving';
  ELSIF v_health_score < v_previous_score - 5 THEN
    v_trend := 'declining';
  ELSE
    v_trend := 'stable';
  END IF;
  
  -- Build factors JSONB
  v_factors := jsonb_build_object(
    'usage', v_usage_score,
    'support_tickets', v_support_score,
    'nps', v_nps_score,
    'payment', v_payment_score,
    'engagement', v_engagement_score
  );
  
  -- Insert or update health score
  INSERT INTO cs_customer_health_scores (
    tenant_id,
    health_score,
    health_level,
    factors,
    previous_score,
    trend
  ) VALUES (
    p_tenant_id,
    v_health_score,
    v_health_level,
    v_factors,
    v_previous_score,
    v_trend
  )
  RETURNING health_id INTO v_health_id;
  
  RETURN v_health_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CHURN RISK CALCULATION
-- ============================================================================

/**
 * Calculate churn risk for a tenant
 * 
 * Risk Factors (weighted):
 * - Usage decline: 30 points
 * - Support tickets: 20 points
 * - Payment issues: 25 points
 * - Engagement: 15 points
 * - NPS: 10 points
 * 
 * Risk Levels:
 * - Low: 0-39
 * - Medium: 40-59
 * - High: 60-79
 * - Critical: 80-100
 */
CREATE OR REPLACE FUNCTION calculate_churn_risk(p_tenant_id UUID)
RETURNS UUID AS $$
DECLARE
  v_risk_id UUID;
  v_risk_score INT;
  v_risk_level VARCHAR(50);
  v_risk_factors JSONB;
  v_previous_score INT;
  v_trend VARCHAR(50);
  v_predicted_churn_date DATE;
  v_intervention_required BOOLEAN;
  
  -- Risk factors (0-100 scale, higher = more risk)
  v_usage_decline_risk INT := 0;
  v_support_tickets_risk INT := 0;
  v_payment_issues_risk INT := 0;
  v_engagement_risk INT := 0;
  v_nps_risk INT := 0;
  
  -- Metrics
  v_ticket_count INT;
  v_open_ticket_count INT;
  v_nps_score_value INT;
  v_health_score_value INT;
BEGIN
  -- Get previous risk score
  SELECT risk_score INTO v_previous_score
  FROM cs_customer_churn_risk
  WHERE tenant_id = p_tenant_id
  ORDER BY calculated_at DESC
  LIMIT 1;
  
  -- Calculate Usage Decline Risk (0-30 points)
  -- Check if usage has declined (simplified - would integrate with Platform Service)
  -- For now, check health score as proxy
  SELECT health_score INTO v_health_score_value
  FROM cs_customer_health_scores
  WHERE tenant_id = p_tenant_id
  ORDER BY calculated_at DESC
  LIMIT 1;
  
  IF v_health_score_value IS NOT NULL THEN
    -- Lower health score = higher usage decline risk
    v_usage_decline_risk := 30 - (v_health_score_value / 100.0 * 30)::INT;
  ELSE
    v_usage_decline_risk := 15; -- Default moderate risk
  END IF;
  
  -- Calculate Support Tickets Risk (0-20 points)
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('open', 'in_progress', 'pending')),
    COUNT(*)
  INTO v_open_ticket_count, v_ticket_count
  FROM cs_tickets
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - INTERVAL '30 days';
  
  IF v_open_ticket_count >= 5 THEN
    v_support_tickets_risk := 20; -- 5+ open tickets = high risk
  ELSIF v_open_ticket_count >= 3 THEN
    v_support_tickets_risk := 15; -- 3-4 open tickets = medium-high risk
  ELSIF v_open_ticket_count >= 1 THEN
    v_support_tickets_risk := 10; -- 1-2 open tickets = moderate risk
  ELSIF v_ticket_count >= 10 THEN
    v_support_tickets_risk := 12; -- Many tickets overall = moderate risk
  ELSE
    v_support_tickets_risk := 5; -- Few tickets = low risk
  END IF;
  
  -- Calculate Payment Issues Risk (0-25 points)
  -- Assume no payment issues (would integrate with billing service)
  -- For now, default to 0 (can be enhanced with actual payment data)
  v_payment_issues_risk := 0;
  
  -- Calculate Engagement Risk (0-15 points)
  -- Lower engagement = higher risk (simplified)
  -- For now, use health score as proxy
  IF v_health_score_value IS NOT NULL THEN
    v_engagement_risk := 15 - (v_health_score_value / 100.0 * 15)::INT;
  ELSE
    v_engagement_risk := 8; -- Default moderate risk
  END IF;
  
  -- Calculate NPS Risk (0-10 points)
  -- Get latest NPS score
  SELECT nps_score INTO v_nps_score_value
  FROM cs_survey_nps
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_nps_score_value IS NOT NULL THEN
    -- Negative NPS = higher risk
    IF v_nps_score_value < 0 THEN
      v_nps_risk := 10; -- Negative NPS = high risk
    ELSIF v_nps_score_value < 30 THEN
      v_nps_risk := 7; -- Low NPS = medium-high risk
    ELSIF v_nps_score_value < 50 THEN
      v_nps_risk := 4; -- Moderate NPS = low-medium risk
    ELSE
      v_nps_risk := 1; -- High NPS = low risk
    END IF;
  ELSE
    v_nps_risk := 5; -- Default moderate risk if no NPS data
  END IF;
  
  -- Calculate total risk score
  v_risk_score := v_usage_decline_risk + v_support_tickets_risk + v_payment_issues_risk + 
                  v_engagement_risk + v_nps_risk;
  
  -- Ensure score is between 0 and 100
  v_risk_score := GREATEST(0, LEAST(100, v_risk_score));
  
  -- Determine risk level
  IF v_risk_score >= 80 THEN
    v_risk_level := 'critical';
  ELSIF v_risk_score >= 60 THEN
    v_risk_level := 'high';
  ELSIF v_risk_score >= 40 THEN
    v_risk_level := 'medium';
  ELSE
    v_risk_level := 'low';
  END IF;
  
  -- Determine trend
  IF v_previous_score IS NULL THEN
    v_trend := 'stable';
  ELSIF v_risk_score > v_previous_score + 5 THEN
    v_trend := 'declining';
  ELSIF v_risk_score < v_previous_score - 5 THEN
    v_trend := 'improving';
  ELSE
    v_trend := 'stable';
  END IF;
  
  -- Calculate predicted churn date (if high risk)
  IF v_risk_level IN ('high', 'critical') THEN
    IF v_risk_level = 'critical' THEN
      v_predicted_churn_date := CURRENT_DATE + INTERVAL '30 days';
    ELSE
      v_predicted_churn_date := CURRENT_DATE + INTERVAL '60 days';
    END IF;
  ELSE
    v_predicted_churn_date := NULL;
  END IF;
  
  -- Determine if intervention is required
  v_intervention_required := v_risk_level IN ('high', 'critical');
  
  -- Build risk factors JSONB
  v_risk_factors := jsonb_build_object(
    'usage_decline', v_usage_decline_risk,
    'support_tickets', v_support_tickets_risk,
    'payment_issues', v_payment_issues_risk,
    'engagement', v_engagement_risk,
    'nps', v_nps_risk
  );
  
  -- Insert churn risk record
  INSERT INTO cs_customer_churn_risk (
    tenant_id,
    risk_score,
    risk_level,
    risk_factors,
    predicted_churn_date,
    intervention_required,
    previous_score,
    trend
  ) VALUES (
    p_tenant_id,
    v_risk_score,
    v_risk_level,
    v_risk_factors,
    v_predicted_churn_date,
    v_intervention_required,
    v_previous_score,
    v_trend
  )
  RETURNING risk_id INTO v_risk_id;
  
  RETURN v_risk_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SLA TRACKING
-- ============================================================================

/**
 * Update SLA tracking for a ticket
 * Calculates SLA targets based on ticket priority and policy
 * Updates SLA tracking record
 */
CREATE OR REPLACE FUNCTION update_ticket_sla(p_ticket_id UUID)
RETURNS UUID AS $$
DECLARE
  v_tracking_id UUID;
  v_ticket_record RECORD;
  v_policy_record RECORD;
  v_first_response_target TIMESTAMPTZ;
  v_resolution_target TIMESTAMPTZ;
BEGIN
  -- Get ticket information
  SELECT 
    ticket_id,
    tenant_id,
    priority,
    status,
    created_at,
    sla_first_response_target,
    sla_resolution_target
  INTO v_ticket_record
  FROM cs_tickets
  WHERE ticket_id = p_ticket_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found: %', p_ticket_id;
  END IF;
  
  -- Get SLA policy for ticket priority
  SELECT 
    policy_id,
    first_response_time,
    resolution_time
  INTO v_policy_record
  FROM cs_sla_policies
  WHERE priority = v_ticket_record.priority
    AND is_active = TRUE
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate SLA targets
  IF v_policy_record IS NOT NULL THEN
    v_first_response_target := v_ticket_record.created_at + v_policy_record.first_response_time;
    v_resolution_target := v_ticket_record.created_at + v_policy_record.resolution_time;
  ELSE
    -- Default SLA if no policy found
    -- Default: 2 hours for first response, 24 hours for resolution
    v_first_response_target := v_ticket_record.created_at + INTERVAL '2 hours';
    v_resolution_target := v_ticket_record.created_at + INTERVAL '24 hours';
  END IF;
  
  -- Update ticket with SLA targets
  UPDATE cs_tickets
  SET 
    sla_first_response_target = v_first_response_target,
    sla_resolution_target = v_resolution_target
  WHERE ticket_id = p_ticket_id;
  
  -- Upsert SLA tracking record (check if exists first)
  SELECT tracking_id INTO v_tracking_id
  FROM cs_sla_tracking
  WHERE ticket_id = p_ticket_id
  LIMIT 1;
  
  IF v_tracking_id IS NOT NULL THEN
    -- Update existing record
    UPDATE cs_sla_tracking
    SET 
      policy_id = v_policy_record.policy_id,
      first_response_target = v_first_response_target,
      resolution_target = v_resolution_target,
      updated_at = NOW()
    WHERE tracking_id = v_tracking_id;
  ELSE
    -- Insert new record
    INSERT INTO cs_sla_tracking (
      ticket_id,
      policy_id,
      first_response_target,
      resolution_target
    ) VALUES (
      p_ticket_id,
      v_policy_record.policy_id,
      v_first_response_target,
      v_resolution_target
    )
    RETURNING tracking_id INTO v_tracking_id;
  END IF;
  
  RETURN v_tracking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AGENT EXECUTION LOGGING
-- ============================================================================

/**
 * Log agent execution
 * Creates a record in cs_agent_executions table
 */
CREATE OR REPLACE FUNCTION log_agent_execution(
  p_agent_id UUID,
  p_execution_data JSONB
)
RETURNS UUID AS $$
DECLARE
  v_execution_id UUID;
  v_ticket_id UUID;
  v_conversation_id UUID;
  v_execution_type TEXT;
  v_input_text TEXT;
  v_output_text TEXT;
  v_llm_provider TEXT;
  v_llm_model TEXT;
  v_tokens_input INT;
  v_tokens_output INT;
  v_tokens_total INT;
  v_cost_usd DECIMAL(10,6);
  v_execution_time_ms INT;
  v_status TEXT;
BEGIN
  -- Extract data from JSONB
  v_ticket_id := (p_execution_data->>'ticket_id')::UUID;
  v_conversation_id := (p_execution_data->>'conversation_id')::UUID;
  v_execution_type := p_execution_data->>'execution_type';
  v_input_text := p_execution_data->>'input_text';
  v_output_text := p_execution_data->>'output_text';
  v_llm_provider := p_execution_data->>'llm_provider';
  v_llm_model := p_execution_data->>'llm_model';
  v_tokens_input := (p_execution_data->>'tokens_input')::INT;
  v_tokens_output := (p_execution_data->>'tokens_output')::INT;
  v_tokens_total := (p_execution_data->>'tokens_total')::INT;
  v_cost_usd := (p_execution_data->>'cost_usd')::DECIMAL;
  v_execution_time_ms := (p_execution_data->>'execution_time_ms')::INT;
  v_status := COALESCE(p_execution_data->>'status', 'completed');
  
  -- Insert execution record
  INSERT INTO cs_agent_executions (
    agent_id,
    ticket_id,
    conversation_id,
    execution_type,
    input_text,
    output_text,
    llm_provider,
    llm_model,
    tokens_input,
    tokens_output,
    tokens_total,
    cost_usd,
    execution_time_ms,
    status,
    metadata
  ) VALUES (
    p_agent_id,
    v_ticket_id,
    v_conversation_id,
    v_execution_type,
    v_input_text,
    v_output_text,
    v_llm_provider,
    v_llm_model,
    v_tokens_input,
    v_tokens_output,
    v_tokens_total,
    v_cost_usd,
    v_execution_time_ms,
    v_status,
    p_execution_data
  )
  RETURNING execution_id INTO v_execution_id;
  
  -- Also track cost
  IF v_cost_usd IS NOT NULL AND v_cost_usd > 0 THEN
    PERFORM track_agent_cost(p_agent_id, v_tokens_total, v_cost_usd);
  END IF;
  
  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AGENT COST TRACKING
-- ============================================================================

/**
 * Track agent cost
 * Creates or updates cost tracking record for an agent
 */
CREATE OR REPLACE FUNCTION track_agent_cost(
  p_agent_id UUID,
  p_tokens INT,
  p_cost_usd DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_cost_id UUID;
  v_period_date DATE;
  v_execution_id UUID;
BEGIN
  -- Use today's date as period
  v_period_date := CURRENT_DATE;
  
  -- Get agent info for cost tracking
  SELECT 
    agent_id,
    llm_config->>'provider' as provider,
    llm_config->>'model' as model
  INTO v_execution_id
  FROM cs_llm_agents
  WHERE agent_id = p_agent_id;
  
  -- Insert cost tracking record
  INSERT INTO cs_agent_cost_tracking (
    agent_id,
    llm_provider,
    llm_model,
    tokens_input,
    tokens_output,
    tokens_total,
    cost_usd,
    period_date
  ) VALUES (
    p_agent_id,
    (SELECT llm_config->>'provider' FROM cs_llm_agents WHERE agent_id = p_agent_id),
    (SELECT llm_config->>'model' FROM cs_llm_agents WHERE agent_id = p_agent_id),
    0, -- Input tokens not tracked separately here
    0, -- Output tokens not tracked separately here
    p_tokens,
    p_cost_usd,
    v_period_date
  )
  RETURNING cost_id INTO v_cost_id;
  
  RETURN v_cost_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION COMMENTS
-- ============================================================================

COMMENT ON FUNCTION calculate_health_score(UUID) IS 
'Calculates customer health score based on usage, support tickets, NPS, payment status, and engagement. Returns health_id.';

COMMENT ON FUNCTION calculate_churn_risk(UUID) IS 
'Calculates churn risk score based on usage decline, support tickets, payment issues, engagement, and NPS. Returns risk_id.';

COMMENT ON FUNCTION update_ticket_sla(UUID) IS 
'Updates SLA tracking for a ticket based on priority and SLA policy. Returns tracking_id.';

COMMENT ON FUNCTION log_agent_execution(UUID, JSONB) IS 
'Logs agent execution with full execution data. Returns execution_id.';

COMMENT ON FUNCTION track_agent_cost(UUID, INT, DECIMAL) IS 
'Tracks agent cost for a given period. Returns cost_id.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- - Created 5 database functions:
--   1. calculate_health_score(tenant_id) - Health score calculation
--   2. calculate_churn_risk(tenant_id) - Churn risk calculation
--   3. update_ticket_sla(ticket_id) - SLA tracking updates
--   4. log_agent_execution(agent_id, execution_data) - Agent execution logging
--   5. track_agent_cost(agent_id, tokens, cost) - Cost tracking
-- All functions are SECURITY DEFINER for proper access control
