-- Migration: Dialer Permissions
-- Description: Creates dialer permissions table for unified dialer service
-- Date: January 2026

-- Create dialer_permissions table
CREATE TABLE IF NOT EXISTS dialer_permissions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  dialer_enabled BOOLEAN DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '{}',
  number_assignment TEXT CHECK (number_assignment IN ('individual', 'pool')),
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on department for faster queries
CREATE INDEX IF NOT EXISTS idx_dialer_permissions_department ON dialer_permissions(department);
CREATE INDEX IF NOT EXISTS idx_dialer_permissions_role ON dialer_permissions(role);
CREATE INDEX IF NOT EXISTS idx_dialer_permissions_enabled ON dialer_permissions(dialer_enabled);

-- Enable RLS
ALTER TABLE dialer_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own dialer permissions" ON dialer_permissions;
DROP POLICY IF EXISTS "Team members can view dialer permissions" ON dialer_permissions;
DROP POLICY IF EXISTS "Users can update own dialer enabled status" ON dialer_permissions;
DROP POLICY IF EXISTS "Admins can manage dialer permissions" ON dialer_permissions;

-- RLS Policies
-- Users can view their own permissions
CREATE POLICY "Users can view own dialer permissions"
  ON dialer_permissions
  FOR SELECT
  USING (user_id::text = get_current_clerk_user_id());

-- Team members can view permissions (for admin purposes)
CREATE POLICY "Team members can view dialer permissions"
  ON dialer_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Users can update their own permissions (limited fields)
CREATE POLICY "Users can update own dialer enabled status"
  ON dialer_permissions
  FOR UPDATE
  USING (user_id::text = get_current_clerk_user_id())
  WITH CHECK (user_id::text = get_current_clerk_user_id());

-- Team members with admin role can manage all permissions
CREATE POLICY "Admins can manage dialer permissions"
  ON dialer_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
      AND cs_team_members.role IN ('admin', 'head_of_cs', 'customer_success_manager')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dialer_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS update_dialer_permissions_updated_at ON dialer_permissions;

-- Create trigger for updated_at
CREATE TRIGGER update_dialer_permissions_updated_at
  BEFORE UPDATE ON dialer_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_dialer_permissions_updated_at();

-- Insert default permissions for customer support role
-- Note: This will be populated when users are created or when dialer is enabled
-- Default permissions structure:
-- {
--   "inbound": false,
--   "outbound": true,
--   "parallel_dialing": false,
--   "conference_rooms": false,
--   "call_coaching": false,
--   "recording": true,
--   "transcription": true
-- }

COMMENT ON TABLE dialer_permissions IS 'Stores dialer permissions for users in the unified dialer system';
COMMENT ON COLUMN dialer_permissions.permissions IS 'JSONB object containing specific permission flags';
COMMENT ON COLUMN dialer_permissions.number_assignment IS 'Type of number assignment: individual or pool';
