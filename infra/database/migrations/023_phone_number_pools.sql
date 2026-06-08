-- Migration: Phone Number Pools
-- Description: Creates phone number pools table for unified dialer service
-- Date: January 2026

-- Create phone_number_pools table
CREATE TABLE IF NOT EXISTS phone_number_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  twilio_number_sid TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'in_use', 'maintenance')),
  reserved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_phone_number_pools_department ON phone_number_pools(department);
CREATE INDEX IF NOT EXISTS idx_phone_number_pools_status ON phone_number_pools(status);
CREATE INDEX IF NOT EXISTS idx_phone_number_pools_phone_number ON phone_number_pools(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_number_pools_reserved_by ON phone_number_pools(reserved_by);
CREATE INDEX IF NOT EXISTS idx_phone_number_pools_available ON phone_number_pools(department, status) 
  WHERE status = 'available';

-- Enable RLS
ALTER TABLE phone_number_pools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Team members can view phone pools" ON phone_number_pools;
DROP POLICY IF EXISTS "Team members can reserve phone numbers" ON phone_number_pools;
DROP POLICY IF EXISTS "Admins can manage phone pools" ON phone_number_pools;

-- RLS Policies
-- Team members can view phone pools
CREATE POLICY "Team members can view phone pools"
  ON phone_number_pools
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Team members can reserve numbers
CREATE POLICY "Team members can reserve phone numbers"
  ON phone_number_pools
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Admins can manage phone pools
CREATE POLICY "Admins can manage phone pools"
  ON phone_number_pools
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
      AND cs_team_members.role IN ('admin', 'head_of_cs')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_phone_number_pools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS update_phone_number_pools_updated_at ON phone_number_pools;

-- Create trigger for updated_at
CREATE TRIGGER update_phone_number_pools_updated_at
  BEFORE UPDATE ON phone_number_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_number_pools_updated_at();

-- Create function to auto-release expired reservations
CREATE OR REPLACE FUNCTION release_expired_phone_reservations()
RETURNS void AS $$
BEGIN
  UPDATE phone_number_pools
  SET 
    status = 'available',
    reserved_by = NULL,
    reserved_until = NULL,
    updated_at = NOW()
  WHERE 
    status = 'reserved'
    AND reserved_until IS NOT NULL
    AND reserved_until < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE phone_number_pools IS 'Stores phone numbers available for pool assignment in the unified dialer system';
COMMENT ON COLUMN phone_number_pools.department IS 'Department using this pool (e.g., customer_support, sales)';
COMMENT ON COLUMN phone_number_pools.status IS 'Current status of the phone number: available, reserved, in_use, or maintenance';
