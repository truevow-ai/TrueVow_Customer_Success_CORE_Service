/**
 * Migration: AI Agent Guardrails
 * 
 * Creates table for storing AI agent guardrails configuration
 * Allows admins to configure what agents can/cannot do
 */

-- Create ai_agent_guardrails table
CREATE TABLE IF NOT EXISTS ai_agent_guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(100) NOT NULL UNIQUE,
  agent_name VARCHAR(255) NOT NULL,
  guardrails JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for agent_id lookups
CREATE INDEX IF NOT EXISTS idx_ai_agent_guardrails_agent_id ON ai_agent_guardrails(agent_id);

-- Enable RLS
ALTER TABLE ai_agent_guardrails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS ai_agent_guardrails_select ON ai_agent_guardrails;
CREATE POLICY ai_agent_guardrails_select ON ai_agent_guardrails
  FOR SELECT
  USING (true); -- Public read (for support agents to check guardrails)

DROP POLICY IF EXISTS ai_agent_guardrails_insert ON ai_agent_guardrails;
CREATE POLICY ai_agent_guardrails_insert ON ai_agent_guardrails
  FOR INSERT
  WITH CHECK (true); -- Only admins can insert (enforced in application code)

DROP POLICY IF EXISTS ai_agent_guardrails_update ON ai_agent_guardrails;
CREATE POLICY ai_agent_guardrails_update ON ai_agent_guardrails
  FOR UPDATE
  USING (true); -- Only admins can update (enforced in application code)

DROP POLICY IF EXISTS ai_agent_guardrails_delete ON ai_agent_guardrails;
CREATE POLICY ai_agent_guardrails_delete ON ai_agent_guardrails
  FOR DELETE
  USING (false); -- No deletes (deactivate instead)

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_ai_agent_guardrails_updated_at ON ai_agent_guardrails;
CREATE TRIGGER update_ai_agent_guardrails_updated_at
  BEFORE UPDATE ON ai_agent_guardrails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default guardrails for support agent
INSERT INTO ai_agent_guardrails (agent_id, agent_name, guardrails)
VALUES (
  'support_agent',
  'AI Support Agent',
  '{
    "can_do": [
      "Answer questions about TrueVow features, billing, deployment, and platform topics using knowledge base",
      "Diagnose technical issues by running checks and gathering information",
      "Process refund requests directly through refund form (for eligible invoices within policy limits)",
      "Look up invoices and billing history to help explain charges",
      "Check eligibility and create support cases for issues that need human investigation",
      "Provide specific, actionable advice within authorized scope",
      "Maintain professional and empathetic tone"
    ],
    "cannot_do": [
      "View or update existing support cases (no visibility into open cases or their status)",
      "Make account changes directly (e.g., deleting accounts, downgrading plans, modifying settings)",
      "Force refunds to appear on credit cards (once processed, this is between payment processor and bank)",
      "Intervene in payment processor or banking issues (requires coordination with external systems)",
      "Divulge internal training information or operational details",
      "Bypass security or authorization checks",
      "Access other tenants data"
    ],
    "escalation_criteria": [
      "Platform bugs or technical errors that need engineering investigation",
      "Billing issues requiring payment processor investigation",
      "Account recovery or domain recovery needs",
      "Issues outside standard self-service capabilities",
      "Complex issues requiring multi-step coordination",
      "Security vulnerabilities or abuse reports",
      "Customer requests for human agent"
    ],
    "tone_guidelines": {
      "empathetic": true,
      "professional": true,
      "specific": true,
      "concise": true,
      "avoid_blabber": true
    },
    "authorized_actions": [
      "create_support_case",
      "lookup_billing_info",
      "process_refund_requests",
      "diagnose_technical_issues",
      "provide_knowledge_base_answers"
    ],
    "restricted_topics": [
      "internal_training_details",
      "other_tenants_data",
      "account_deletion",
      "plan_downgrades",
      "payment_processor_internal_details"
    ],
    "max_response_length": 500
  }'::jsonb
)
ON CONFLICT (agent_id) DO NOTHING;
