-- Migration: Phone Number Mappings
-- Description: Creates phone number mappings table for unified dialer service
-- Date: January 2026

-- Create phone_number_mappings table
CREATE TABLE IF NOT EXISTS phone_number_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('individual', 'pool', 'campaign', 'pod')),
  assigned_to JSONB,
  department TEXT,
  campaign_id UUID,
  pod_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_phone_number_mappings_phone_number ON phone_number_mappings(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_number_mappings_type ON phone_number_mappings(type);
CREATE INDEX IF NOT EXISTS idx_phone_number_mappings_department ON phone_number_mappings(department);
CREATE INDEX IF NOT EXISTS idx_phone_number_mappings_campaign ON phone_number_mappings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_phone_number_mappings_pod ON phone_number_mappings(pod_id);

-- Enable RLS
ALTER TABLE phone_number_mappings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Team members can view phone mappings" ON phone_number_mappings;
DROP POLICY IF EXISTS "Admins can manage phone mappings" ON phone_number_mappings;

-- RLS Policies
-- Team members can view phone mappings
CREATE POLICY "Team members can view phone mappings"
  ON phone_number_mappings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Admins can manage phone mappings
CREATE POLICY "Admins can manage phone mappings"
  ON phone_number_mappings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
      AND cs_team_members.role IN ('admin', 'head_of_cs')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_phone_number_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS update_phone_number_mappings_updated_at ON phone_number_mappings;

-- Create trigger for updated_at
CREATE TRIGGER update_phone_number_mappings_updated_at
  BEFORE UPDATE ON phone_number_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_number_mappings_updated_at();

COMMENT ON TABLE phone_number_mappings IS 'Maps phone numbers to assignments (individual, pool, campaign, pod)';
COMMENT ON COLUMN phone_number_mappings.assigned_to IS 'JSONB object containing assignment details (user_id, etc.)';
COMMENT ON COLUMN phone_number_mappings.type IS 'Type of assignment: individual, pool, campaign, or pod';
